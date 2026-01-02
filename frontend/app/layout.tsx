"use client"

import "./globals.css"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <header className="w-full border-b p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">
            HeatEye ダッシュボード
          </h1>
          <Button
            variant="outline"
            onClick={() => {
              // Cookie の削除
              document.cookie = "idToken=; path=/; max-age=0"
              window.location.href = "/login"
            }}
          >
            ログアウト
          </Button>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
