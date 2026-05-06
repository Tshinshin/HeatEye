import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Try environment variables first, then fallback to default credential chain
    const accessKeyId = process.env.HEATEYE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.HEATEYE_AWS_SECRET_ACCESS_KEY;
    const region = process.env.HEATEYE_AWS_REGION || "ap-northeast-1";

    let s3: S3Client;
    
    if (accessKeyId && secretAccessKey) {
      // Use explicit credentials if available
      s3 = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      // Use default credential chain (IAM role, etc.)
      s3 = new S3Client({
        region,
      });
    }

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
    
    // Return detailed error for debugging
    return NextResponse.json(
      {
        message: "Failed to create signed URL",
        error: error instanceof Error ? error.message : String(error),
        credentials: {
          hasAccessKey: !!process.env.HEATEYE_AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.HEATEYE_AWS_SECRET_ACCESS_KEY,
          region: process.env.HEATEYE_AWS_REGION || "ap-northeast-1"
        }
      },
      { status: 500 }
    );
  }
}