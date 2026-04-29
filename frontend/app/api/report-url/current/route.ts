import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

export async function GET() {
  try {
    const accessKeyId = process.env.HEATEYE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.HEATEYE_AWS_SECRET_ACCESS_KEY;
    const region = process.env.HEATEYE_AWS_REGION || "ap-northeast-1";

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        {
          message: "AWS credentials are not set",
        },
        { status: 500 }
      );
    }

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

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