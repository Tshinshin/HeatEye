import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 認証が必要なパス
const protectedRoutes = ["/dashboard"]

export function middleware(req: NextRequest) {
  const idToken = req.cookies.get("idToken")?.value

  // ログインしていない場合 → /login へ
  if (protectedRoutes.some((p) => req.nextUrl.pathname.startsWith(p))) {
    if (!idToken) {
      const loginUrl = new URL("/login", req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}
