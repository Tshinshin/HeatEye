// app/dashboard/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth"

type DeviceFromApi = {
  plant_id: string
  device_id: string
  device_name: string
  latest_value: number | string | null
  location: string | null
}

type DeviceView = {
  plantId: string
  id: string
  name: string
  latestval: number | string | null
  location: string
}

export default function DashboardPage() {
  const [plantId, setPlantId] = useState<string>("")
  const [devices, setDevices] = useState<DeviceView[]>([])
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  // API Base URL（Amplify Consoleの環境変数で設定する）
  const base = process.env.NEXT_PUBLIC_API_BASE_URL

  // クエリ取得（useSearchParamsは使わない）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    setPlantId(sp.get("plantId") ?? "")
  }, [])

  const endpoint = useMemo(() => {
    if (!base || !plantId) return ""
    return `${base}/devices?plantId=${encodeURIComponent(plantId)}`
  }, [base, plantId])

  useEffect(() => {
    ;(async () => {
      setError("")
      setDevices([])

      if (!plantId) return

      try {
        setLoading(true)

        // 1) ログイン済みチェック
        const user = await getCurrentUser()
        console.log("currentUser", user)

        // 2) idToken取得
        const session = await fetchAuthSession()
        const idToken = session.tokens?.idToken?.toString()
        if (!idToken) throw new Error("No idToken. Are you logged in?")

        // 3) API Base URL確認
        if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set")

        // 4) API Gatewayへアクセス
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        })

        // 5) エラー処理（Homeと同じ流儀）
        if (!res.ok) {
          const text = await res.text()

          let message = `HTTP ${res.status}`
          let detail = ""

          try {
            const parsed: unknown = JSON.parse(text)
            if (parsed && typeof parsed === "object") {
              const obj = parsed as Record<string, unknown>
              if (typeof obj.message === "string") message = obj.message
              if (typeof obj.detail === "string") detail = obj.detail
            }
          } catch {
            // JSONでない場合は無視
          }

          throw new Error(detail ? `${message} / ${detail}` : message)
        }

        // 6) 成功
        const data = (await res.json()) as { items: DeviceFromApi[] }
        const items = data.items ?? []

        const view: DeviceView[] = items.map((d) => ({
          plantId: d.plant_id,
          id: d.device_id,
          name: d.device_name,
          latestval: d.latest_value,
          location: d.location ?? "",
        }))

        setDevices(view)
      } catch (e: unknown) {
        console.error("Dashboard load error:", e)
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "string"
              ? e
              : JSON.stringify(e)
        setError(msg)
      } finally {
        setLoading(false)
      }
    })()
  }, [plantId, base, endpoint])

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">日報</h1>
        <div className="text-sm text-muted-foreground">
          Plant ID: <span className="font-mono">{plantId || "(none)"}</span>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">計器一覧</h2>

        {loading && <div className="text-sm">読み込み中...</div>}

        {error && (
          <div className="text-sm text-red-600 whitespace-pre-wrap">
            読み込みエラー: {error}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>計器名</TableHead>
              <TableHead>最新値</TableHead>
              <TableHead>設置場所</TableHead>
              <TableHead>詳細</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {devices.map((d) => (
              <TableRow key={`${d.plantId}#${d.id}`}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.latestval ?? "-"}</TableCell>
                <TableCell>{d.location}</TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/reading/${encodeURIComponent(d.plantId)}/${encodeURIComponent(d.id)}`}
                  >
                    <Button variant="outline" size="sm">
                      読み値履歴
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}

            {!loading && !error && devices.length === 0 && plantId && (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  該当データがありません
                </TableCell>
              </TableRow>
            )}

            {!plantId && (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  plantId が指定されていません（URLの ?plantId=... を確認してください）
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}