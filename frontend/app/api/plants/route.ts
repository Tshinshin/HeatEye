// app/api/plants/route.ts
import { NextResponse } from "next/server";
import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDoc } from "@/lib/dynamo";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export const runtime = "nodejs";

type UserPlantItem = { plant_id: string };
type PlantItem = { plant_id: string; plant_name: string };

// verifier も “遅延生成”にしておく（env未設定でビルド落ちを防ぐ）
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error("Cognito envs are not set");
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

export async function GET(req: Request) {
  try {
    const USER_PLANT_TABLE = process.env.DDB_USER_PLANT_TABLE;
    const PLANTS_TABLE = process.env.DDB_PLANTS_TABLE;

    if (!USER_PLANT_TABLE || !PLANTS_TABLE) {
      // throw してもOKだが、APIとしては 500 を返した方が親切
      return NextResponse.json(
        { message: "DynamoDB table envs are not set" },
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

    // 2) infra-dev-user-plant を user_id(PartitionKey) で Query
    const q = await ddbDoc.send(
      new QueryCommand({
        TableName: USER_PLANT_TABLE,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: { ":u": userId },
        ProjectionExpression: "plant_id",
      })
    );

    const plantIds = (q.Items ?? [])
      .map((x) => (x as UserPlantItem).plant_id)
      .filter(Boolean);

    if (plantIds.length === 0) {
      return NextResponse.json({ plants: [] }, { status: 200 });
    }

    // 3) infra-dev-plants を plant_id で BatchGet（最大100件/回）
    const uniqueIds = Array.from(new Set(plantIds));
    const chunks: string[][] = [];
    for (let i = 0; i < uniqueIds.length; i += 100) chunks.push(uniqueIds.slice(i, i + 100));

    const results: PlantItem[] = [];
    for (const ids of chunks) {
      const b = await ddbDoc.send(
        new BatchGetCommand({
          RequestItems: {
            [PLANTS_TABLE]: {
              Keys: ids.map((id) => ({ plant_id: id })),
              ProjectionExpression: "plant_id, plant_name",
            },
          },
        })
      );

      const got = (b.Responses?.[PLANTS_TABLE] ?? []) as PlantItem[];
      results.push(...got);
    }

    const nameById = new Map(results.map((p) => [p.plant_id, p.plant_name] as const));
    const ordered = uniqueIds.map((id) => ({
      plant_id: id,
      plant_name: nameById.get(id) ?? "(unknown)",
    }));

    return NextResponse.json({ plants: ordered }, { status: 200 });
  } catch (e: unknown) {
    console.error(e);
    const detail =
      e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);

    return NextResponse.json(
      { message: "Failed to load plants", detail },
      { status: 500 }
    );
  }
}
