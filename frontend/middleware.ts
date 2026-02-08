// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Amplify Auth はブラウザ側(localStorage等)でセッションを管理するため、
 * middleware で Cookie を見てログイン判定すると状態がズレて事故る。
 *
 * そのため middleware では認証リダイレクトを行わない。
 * 認証が必要なページはクライアント側で getCurrentUser() でガードする。
 * API は Authorization: Bearer <idToken> で route.ts 側が検証して守る。
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
