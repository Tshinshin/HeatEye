// amplify/backend/function/plantsApi/src/index.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchGetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { CognitoJwtVerifier } = require("aws-jwt-verify");

const REGION = process.env.AWS_REGION || process.env.REGION || "ap-northeast-1";
const IMAGES_BUCKET = process.env.IMAGES_BUCKET;
const SIGNED_URL_EXPIRES_IN = Number(process.env.SIGNED_URL_EXPIRES_IN || 3600);
const CROSS_ACCOUNT_ROLE_ARN = process.env.CROSS_ACCOUNT_ROLE_ARN;

const sts = new STSClient({ region: REGION });

async function createCrossAccountS3Client() {
  if (!CROSS_ACCOUNT_ROLE_ARN) {
    throw new Error("CROSS_ACCOUNT_ROLE_ARN is not set");
  }

  const assumed = await sts.send(
    new AssumeRoleCommand({
      RoleArn: CROSS_ACCOUNT_ROLE_ARN,
      RoleSessionName: "HeatEyePresignSession",
      DurationSeconds: 3600,
    })
  );

  const c = assumed.Credentials;
  if (!c) {
    throw new Error("AssumeRole failed: no credentials returned");
  }

  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: c.AccessKeyId,
      secretAccessKey: c.SecretAccessKey,
      sessionToken: c.SessionToken,
    },
  });
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function withCors(headers) {
  return { ...corsHeaders, ...(headers || {}) };
}

function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: withCors({
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(extraHeaders || {}),
    }),
    body: JSON.stringify(body),
  };
}

function getAuthorization(event) {
  const h = (event && event.headers) || {};
  const mvh = (event && event.multiValueHeaders) || {};

  const direct = h.authorization || h.Authorization || h.AUTHORIZATION || "";
  if (direct) return String(direct);

  const mv =
    (mvh.authorization && mvh.authorization[0]) ||
    (mvh.Authorization && mvh.Authorization[0]) ||
    (mvh.AUTHORIZATION && mvh.AUTHORIZATION[0]) ||
    "";

  return mv ? String(mv) : "";
}

let verifier = null;
function getVerifier() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error(
      "Cognito envs are not set (COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID)"
    );
  }

  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: "id",
      clientId,
    });
  }
  return verifier;
}

// 追加：path判定を吸収
function getPath(event) {
  return (
    event?.rawPath ||
    event?.requestContext?.http?.path ||
    event?.path ||
    ""
  );
}

function getQueryParam(event, key) {
  const q = event?.queryStringParameters || {};
  return q[key];
}

// 追加：ユーザーがそのplantにアクセスできるか確認（user-plantをQueryして存在チェック）
async function assertUserCanAccessPlant({ userId, plantId, userPlantTable }) {
  const q = await ddb.send(
    new QueryCommand({
      TableName: userPlantTable,
      KeyConditionExpression: "user_id = :u",
      ExpressionAttributeValues: { ":u": userId },
      ProjectionExpression: "plant_id",
    })
  );

  const plantIds = (q.Items || [])
    .map((x) => x?.plant_id)
    .filter(Boolean);

  if (!plantIds.includes(plantId)) {
    // 403の方が正確（認証は通ってるが権限がない）
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
}

// 追加：devices取得
async function loadDevicesByPlant({ devicesTable, plantId }) {
  const r = await ddb.send(
    new QueryCommand({
      TableName: devicesTable,
      KeyConditionExpression: "plant_id = :p",
      ExpressionAttributeValues: { ":p": plantId },
      // ProjectionExpression を書かない（全属性返す）
    })
  );

  return r.Items || [];
}

// 追加：readings取得
async function loadReadingsByDevice({ readingsTable, deviceId }) {
  const r = await ddb.send(
    new QueryCommand({
      TableName: readingsTable,
      KeyConditionExpression: "device_id = :d",
      ExpressionAttributeValues: { ":d": deviceId },

      // timestamp は念のため別名（予約語扱い回避）
      ProjectionExpression: "device_id, #ts, reading, image",
      ExpressionAttributeNames: {
        "#ts": "timestamp",
      },
    })
  );

  const items = r.Items || [];

  // timestamp降順（SortKeyでない可能性があるのでアプリ側でソート）
  items.sort((a, b) => {
    const ta = String(a.timestamp ?? "");
    const tb = String(b.timestamp ?? "");
    if (ta < tb) return 1;
    if (ta > tb) return -1;
    return 0;
  });

  return items;
}

async function createPresignedImageUrl(imageValue) {
  if (!imageValue) return null;
  if (!IMAGES_BUCKET) {
    throw new Error("IMAGES_BUCKET is not set");
  }

  const key = String(imageValue).trim().replace(/^\/+/, "");

  // 👇 ここが重要（変更点）
  const s3 = await createCrossAccountS3Client();

  const command = new GetObjectCommand({
    Bucket: IMAGES_BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3, command, {
    expiresIn: SIGNED_URL_EXPIRES_IN,
  });
}

exports.handler = async (event) => {
  const method = event?.httpMethod || event?.requestContext?.http?.method || "";
  if (String(method).toUpperCase() === "OPTIONS") {
    return {
      statusCode: 200,
      headers: withCors({ "cache-control": "no-store" }),
      body: "",
    };
  }

  try {
    const USER_PLANT_TABLE = process.env.DDB_USER_PLANT_TABLE;
    const PLANTS_TABLE = process.env.DDB_PLANTS_TABLE;
    const DEVICES_TABLE = process.env.DDB_DEVICES_TABLE; // ★追加

    if (!USER_PLANT_TABLE || !PLANTS_TABLE) {
      return json(500, {
        message: "DynamoDB table envs are not set",
        detail: {
          DDB_USER_PLANT_TABLE: !!process.env.DDB_USER_PLANT_TABLE,
          DDB_PLANTS_TABLE: !!process.env.DDB_PLANTS_TABLE,
          DDB_DEVICES_TABLE: !!process.env.DDB_DEVICES_TABLE,
          AWS_REGION: process.env.AWS_REGION ?? null,
          REGION: process.env.REGION ?? null,
        },
      });
    }

    const auth = getAuthorization(event);
    const m = String(auth).match(/^Bearer\s+(.+)$/i);
    if (!m) return json(401, { message: "Unauthorized" });
    const token = m[1];

    // JWT検証
    const payload = await getVerifier().verify(token);
    const userId = payload.sub;

    // ルーティング判定
    const path = getPath(event);

    // ★★★ 追加：/devices ルート ★★★
    if (path.endsWith("/devices")) {
      if (!DEVICES_TABLE) {
        return json(500, { message: "DDB_DEVICES_TABLE is not set" });
      }

      const plantId =
        getQueryParam(event, "plantId") || getQueryParam(event, "plant_id");

      if (!plantId) {
        return json(400, { message: "plantId is required" });
      }

      // 認可：そのユーザーがそのplantにアクセスできるか
      await assertUserCanAccessPlant({
        userId,
        plantId,
        userPlantTable: USER_PLANT_TABLE,
      });

      // devices取得
      const devices = await loadDevicesByPlant({
        devicesTable: DEVICES_TABLE,
        plantId,
      });

      // フロントが使いやすい形で返す（items配列）
      return json(200, { items: devices });
    }

    // ★★★ 追加：/readings ルート ★★★
    if (path.endsWith("/readings")) {
      const READINGS_TABLE = process.env.DDB_READINGS_TABLE;
      if (!READINGS_TABLE) {
        return json(500, { message: "DDB_READINGS_TABLE is not set" });
      }

      const deviceId =
        getQueryParam(event, "deviceId") || getQueryParam(event, "device_id");

      if (!deviceId) {
        return json(400, { message: "deviceId is required" });
      }

      const items = await loadReadingsByDevice({
        readingsTable: READINGS_TABLE,
        deviceId,
      });

      console.log("raw items =", JSON.stringify(items, null, 2));

      const itemsWithSignedUrl = await Promise.all(
        items.map(async (item) => ({
          ...item,
          image: item.image ? await createPresignedImageUrl(item.image) : null,
        }))
      );

      console.log("itemsWithSignedUrl =", JSON.stringify(itemsWithSignedUrl, null, 2));

      return json(200, { items: itemsWithSignedUrl });
    }

    // --- 既存：plants一覧（そのまま） ---
    const q = await ddb.send(
      new QueryCommand({
        TableName: USER_PLANT_TABLE,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: { ":u": userId },
        ProjectionExpression: "plant_id",
      })
    );

    const plantIds = (q.Items || [])
      .map((x) => (x ? x.plant_id : undefined))
      .filter(Boolean);

    if (plantIds.length === 0) {
      return json(200, { plants: [] });
    }

    const uniqueIds = Array.from(new Set(plantIds));
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += 100) {
      chunks.push(uniqueIds.slice(i, i + 100));
    }

    const results = [];
    for (const ids of chunks) {
      const b = await ddb.send(
        new BatchGetCommand({
          RequestItems: {
            [PLANTS_TABLE]: {
              Keys: ids.map((id) => ({ plant_id: id })),
              ProjectionExpression: "plant_id, plant_name",
            },
          },
        })
      );

      const got = (b.Responses && b.Responses[PLANTS_TABLE]) || [];
      results.push(...got);
    }

    const nameById = new Map(results.map((p) => [p.plant_id, p.plant_name]));
    const ordered = uniqueIds.map((id) => ({
      plant_id: id,
      plant_name: nameById.get(id) || "(unknown)",
    }));

    return json(200, { plants: ordered });
  } catch (e) {
    console.error("handler error full =", e);
    const statusCode = e?.statusCode || 500;
    const detail =
      e && (e.stack || e.message) ? e.stack || e.message : String(e);
    return json(statusCode, { message: "Request failed", detail });
  }
};
