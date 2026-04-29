import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

const s3 = new S3Client({
  region: "ap-northeast-1",
});

export async function GET() {
  const command = new GetObjectCommand({
    Bucket: "oessmart",
    Key: "motor-plot/reports/dashboard.html",
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 3600,
  });

  return NextResponse.json({ url });
}