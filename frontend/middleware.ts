import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 認証不要ページ（ログインページ）は必ず通す
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next();
  }

  // ✅ Next.js内部や静的ファイルは必ず通す
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/assets") ||
    /\.(png|jpg|jpeg|gif|webp|svg|css|js|map|ico|txt)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ✅ Cookie チェック（cookie名は実態に合わせる。あなたの例は idToken）
  const idToken = req.cookies.get("idToken")?.value;

  if (!idToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // 任意：ログイン後に戻す
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
