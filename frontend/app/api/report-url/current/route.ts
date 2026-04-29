import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

const s3 = new S3Client({
  region: "ap-northeast-1",
});

export async function GET() {
  try {
    const command = new GetObjectCommand({
      Bucket: "oessmart",
      Key: "motor-plot/reports/dashboard.html",
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Failed to create signed URL:", error);

    return NextResponse.json(
      {
        message: "Failed to create signed URL",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}