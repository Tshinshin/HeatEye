// app/api/plants/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    env: {
      NEXT_PUBLIC_COGNITO_USER_POOL_ID: !!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      NEXT_PUBLIC_COGNITO_CLIENT_ID: !!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      DDB_USER_PLANT_TABLE: !!process.env.DDB_USER_PLANT_TABLE,
      DDB_PLANTS_TABLE: !!process.env.DDB_PLANTS_TABLE,
      REGION: process.env.REGION ?? null,
      AWS_REGION: process.env.AWS_REGION ?? null,
    },
  });
}
