import "./globals.css";
import LogoutButton from "../components/logout-button";
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
          <header className="w-full border-b p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">HeatEye ダッシュボード</h1>
            <LogoutButton />
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
