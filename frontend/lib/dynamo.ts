// lib/dynamo.ts (または src/lib/dynamo.ts)
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Amplify では AWS_* プレフィックスの env が追加できないことがある。
 * そのため region は REGION を優先し、AWS_REGION が無くても動くようにする。
 * また、import 時に throw しない（SSR/Route handler の事故防止）。
 */

let _ddbDoc: DynamoDBDocumentClient | null = null;

function resolveRegion(): string | undefined {
  // Amplify で設定できる REGION を優先
  return process.env.REGION || process.env.AWS_REGION;
}

export function getDdbDoc(): DynamoDBDocumentClient {
  if (_ddbDoc) return _ddbDoc;

  const region = resolveRegion();

  // region が取れない場合でも、SDK が実行環境から解決できるケースがあるので throw しない
  const client = new DynamoDBClient(region ? { region } : {});

  _ddbDoc = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  return _ddbDoc;
}

// 既存コード互換: `import { ddbDoc } from "@/lib/dynamo"` で使えるようにする
type Sendable = { send: (command: unknown) => Promise<unknown> };
export const ddbDoc: Sendable = {
  send: (command: unknown) => getDdbDoc().send(command as never),
};
