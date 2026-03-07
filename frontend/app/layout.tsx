import "./globals.css";
import LogoutButton from "../components/logout-button";
import AppSidebarMenu from "../components/app-sidebar-menu";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <Providers>
          <header className="w-full border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppSidebarMenu />
              <h1 className="text-xl font-bold">HeatEye ダッシュボード</h1>
            </div>

            <LogoutButton />
          </header>

          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}