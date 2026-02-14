// amplify/backend/function/plantsApi/src/index.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchGetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { CognitoJwtVerifier } = require("aws-jwt-verify");

// Lambda 環境では AWS_REGION が自動で入ることが多いのでそれを優先
const REGION = process.env.AWS_REGION || process.env.REGION || "ap-northeast-1";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

// --- CORS (always attach) ---
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

// ✅ Authorization ヘッダを “あらゆる場所” から拾う（APIGWの差異吸収）
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

// verifier は遅延生成（コールドスタートでも無駄な初期化を避ける）
let verifier = null;
function getVerifier() {
  // ✅ Lambda 側は NEXT_PUBLIC_* を使わない（クリーン＆事故防止）
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error("Cognito envs are not set (COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID)");
  }

  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: "id", // 将来 access token に寄せるなら "access"
      clientId,
    });
  }
  return verifier;
}

exports.handler = async (event) => {
  // --- Preflight (CORS) ---
  const method = event?.httpMethod || event?.requestContext?.http?.method || "";
  if (String(method).toUpperCase() === "OPTIONS") {
    return {
      statusCode: 200,
      headers: withCors({ "cache-control": "no-store" }),
      body: "",
    };
  }

  try {
    // ✅ Lambda 側は NEXT_PUBLIC_* を使わない（クリーン＆事故防止）
    const USER_PLANT_TABLE = process.env.DDB_USER_PLANT_TABLE;
    const PLANTS_TABLE = process.env.DDB_PLANTS_TABLE;

    if (!USER_PLANT_TABLE || !PLANTS_TABLE) {
      // ここは運用で詰まるので “どれが足りないか” だけ返す（値は返さない）
      return json(500, {
        message: "DynamoDB table envs are not set",
        detail: {
          DDB_USER_PLANT_TABLE: !!process.env.DDB_USER_PLANT_TABLE,
          DDB_PLANTS_TABLE: !!process.env.DDB_PLANTS_TABLE,
          AWS_REGION: process.env.AWS_REGION ?? null,
          REGION: process.env.REGION ?? null,
        },
      });
    }

    const auth = getAuthorization(event);
    const m = String(auth).match(/^Bearer\s+(.+)$/i);
    if (!m) {
      // ✅ 401 はレスポンスを最小限に。詳細はログへ。
      console.warn("Missing/invalid Authorization header", {
        hasHeaders: !!event?.headers,
        hasMultiValueHeaders: !!event?.multiValueHeaders,
        headerKeys: event?.headers ? Object.keys(event.headers).slice(0, 50) : [],
        mvHeaderKeys: event?.multiValueHeaders
          ? Object.keys(event.multiValueHeaders).slice(0, 50)
          : [],
      });
      return json(401, { message: "Unauthorized" });
    }

    const token = m[1];

    // 1) JWT 検証 & sub 取得
    const payload = await getVerifier().verify(token);
    const userId = payload.sub;

    // 2) user-plant を Query
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

    // 3) plants を BatchGet（最大100件/回）
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
    const detail = e && (e.stack || e.message) ? (e.stack || e.message) : String(e);
    return json(500, { message: "Failed to load plants", detail });
  }
};
