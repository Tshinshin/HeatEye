// app/api/plants/route.ts
import { NextResponse } from "next/server";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";

export const runtime = "nodejs";

type UserPlantItem = { plant_id: string };
type PlantItem = { plant_id: string; plant_name: string };

// ddbDoc は「sendできる」ことだけ分かれば十分
type DynamoDocLike = {
  send: (command: unknown) => Promise<unknown>;
};

function isDynamoDocLike(x: unknown): x is DynamoDocLike {
  return typeof x === "object" && x !== null && "send" in x && typeof (x as { send?: unknown }).send === "function";
}

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error(
      `Cognito envs are not set: NEXT_PUBLIC_COGNITO_USER_POOL_ID=${!!userPoolId}, NEXT_PUBLIC_COGNITO_CLIENT_ID=${!!clientId}`
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

async function getDdbDoc(): Promise<DynamoDocLike> {
  try {
    const mod: unknown = await import("@/lib/dynamo");
    if (typeof mod !== "object" || mod === null || !("ddbDoc" in mod)) {
      throw new Error("Module '@/lib/dynamo' does not export ddbDoc");
    }
    const ddb = (mod as { ddbDoc?: unknown }).ddbDoc;
    if (!isDynamoDocLike(ddb)) {
      throw new Error("ddbDoc is not a DocumentClient-like object (missing send)");
    }
    return ddb;
  } catch (e: unknown) {
    const detail =
      e instanceof Error ? (e.stack ?? e.message) : typeof e === "string" ? e : JSON.stringify(e);
    throw new Error(`Failed to import @/lib/dynamo: ${detail}`);
  }
}

export async function GET(req: Request) {
  try {
    const ddbDoc = await getDdbDoc();

    // ✅ Amplifyで実行時に見えないことがあるので NEXT_PUBLIC_* も保険で見る
    const USER_PLANT_TABLE =
      process.env.DDB_USER_PLANT_TABLE ?? process.env.NEXT_PUBLIC_DDB_USER_PLANT_TABLE;
    const PLANTS_TABLE =
      process.env.DDB_PLANTS_TABLE ?? process.env.NEXT_PUBLIC_DDB_PLANTS_TABLE;

    if (!USER_PLANT_TABLE || !PLANTS_TABLE) {
      return NextResponse.json(
        {
          message: "DynamoDB table envs are not set",
          detail: {
            DDB_USER_PLANT_TABLE: !!process.env.DDB_USER_PLANT_TABLE,
            DDB_PLANTS_TABLE: !!process.env.DDB_PLANTS_TABLE,
            NEXT_PUBLIC_DDB_USER_PLANT_TABLE: !!process.env.NEXT_PUBLIC_DDB_USER_PLANT_TABLE,
            NEXT_PUBLIC_DDB_PLANTS_TABLE: !!process.env.NEXT_PUBLIC_DDB_PLANTS_TABLE,
            AWS_REGION: process.env.AWS_REGION ?? null,
            REGION: process.env.REGION ?? null,
          },
        },
        { status: 500 }
      );
    }

    const auth = req.headers.get("authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return NextResponse.json({ message: "Missing Authorization header" }, { status: 401 });
    }

    const token = m[1];

    // 1) トークン検証＆sub取得
    const payload = await getVerifier().verify(token);
    const userId = payload.sub;

    // 2) user-plant を Query
    const qUnknown = await ddbDoc.send(
      new QueryCommand({
        TableName: USER_PLANT_TABLE,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: { ":u": userId },
        ProjectionExpression: "plant_id",
      })
    );

    // 最低限必要な形に読み替え
    const q = qUnknown as { Items?: unknown[] };

    const plantIds = (q.Items ?? [])
      .map((x) => (x as UserPlantItem).plant_id)
      .filter(Boolean);

    if (plantIds.length === 0) {
      return NextResponse.json({ plants: [] }, { status: 200 });
    }

    // 3) plants を BatchGet（最大100件/回）
    const uniqueIds = Array.from(new Set(plantIds));
    const chunks: string[][] = [];
    for (let i = 0; i < uniqueIds.length; i += 100) chunks.push(uniqueIds.slice(i, i + 100));

    const results: PlantItem[] = [];
    for (const ids of chunks) {
      const bUnknown = await ddbDoc.send(
        new BatchGetCommand({
          RequestItems: {
            [PLANTS_TABLE]: {
              Keys: ids.map((id) => ({ plant_id: id })),
              ProjectionExpression: "plant_id, plant_name",
            },
          },
        })
      );

      const b = bUnknown as { Responses?: Record<string, unknown[]> };
      const got = ((b.Responses?.[PLANTS_TABLE] ?? []) as PlantItem[]) || [];
      results.push(...got);
    }

    const nameById = new Map(results.map((p) => [p.plant_id, p.plant_name] as const));
    const ordered = uniqueIds.map((id) => ({
      plant_id: id,
      plant_name: nameById.get(id) ?? "(unknown)",
    }));

    return NextResponse.json({ plants: ordered }, { status: 200 });
  } catch (e: unknown) {
    const detail =
      e instanceof Error ? (e.stack ?? e.message) : typeof e === "string" ? e : JSON.stringify(e);

    return NextResponse.json({ message: "Failed to load plants", detail }, { status: 500 });
  }
}
