import "./globals.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("idToken")?.value;

  // 現在のパスを取得（App Router では headers から）
  const pathname = cookieStore
    .get("next-pathname")
    ?.value;

  // login ページは例外で通す
  if (!idToken && pathname !== "/login") {
    redirect("/login");
  }

  return (
    <html lang="ja">
      <body className="min-h-screen">
        <header className="w-full border-b p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">HeatEye ダッシュボード</h1>
          {idToken && <LogoutButton />}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
