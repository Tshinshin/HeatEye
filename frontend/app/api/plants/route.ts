// app/api/plants/route.ts
import { NextResponse } from "next/server";
import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDoc } from "@/lib/dynamo";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export const runtime = "nodejs";

const USER_PLANT_TABLE = process.env.DDB_USER_PLANT_TABLE!;
const PLANTS_TABLE = process.env.DDB_PLANTS_TABLE!;
const REGION = process.env.NEXT_PUBLIC_COGNITO_REGION!;
const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;

if (!USER_PLANT_TABLE || !PLANTS_TABLE) throw new Error("DynamoDB table envs are not set");

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: "id",
  clientId: CLIENT_ID,
});

type UserPlantItem = { plant_id: string };
type PlantItem = { plant_id: string; plant_name: string };

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return NextResponse.json({ message: "Missing Authorization header" }, { status: 401 });
    }

    const token = m[1];

    // 1) トークン検証＆sub取得
    const payload = await verifier.verify(token);
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

    // 3) infra-dev-plants を plant_id で BatchGet（最大100件/回なので分割）
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

    // 表示順を user-plant の順に合わせたいなら並べ替え
    const nameById = new Map(results.map((p) => [p.plant_id, p.plant_name] as const));
    const ordered = uniqueIds
      .map((id) => ({ plant_id: id, plant_name: nameById.get(id) ?? "(unknown)" }))
      .filter((p) => p.plant_name);

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
