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

type DeviceFromApi = {
  plant_id: string
  device_id: string
  device_name: string
  latest_value: number | string | null
  location: string | null
}

type DeviceView = {
  id: string
  name: string
  latestval: number | string | null
  location: string
}

type Props = {
  // /dashboard?plantId=xxx で渡される想定
  searchParams?: { plantId?: string }
}

export default function DashboardPage({ searchParams }: Props) {
  const plantId = searchParams?.plantId

  const [devices, setDevices] = useState<DeviceView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 例: https://xxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  const endpoint = useMemo(() => {
    if (!apiBaseUrl || !plantId) return null
    return `${apiBaseUrl}/devices?plantId=${encodeURIComponent(plantId)}`
  }, [apiBaseUrl, plantId])

  useEffect(() => {
    const run = async () => {
      setError(null)

      if (!plantId) {
        setDevices([])
        setError("plantId が指定されていません（トップからの遷移URLを確認してください）")
        return
      }

      if (!endpoint) {
        setDevices([])
        setError("APIのURLが未設定です（NEXT_PUBLIC_API_BASE_URL を設定してください）")
        return
      }

      setLoading(true)

      try {
        // ★Cognito認証が必要ならここでトークンを付ける必要があります
        // 現時点では「トップページの plants 取得」と同じ方式になるはずなので、
        // トップページ側で付けている Authorization の付け方に合わせてください。
        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(
            `API error: ${res.status} ${res.statusText}\n${text}`
          )
        }

        const json = await res.json()
        const items: DeviceFromApi[] = json?.items ?? []

        const view: DeviceView[] = items.map((d) => ({
          id: d.device_id,
          name: d.device_name,
          latestval: d.latest_value,
          location: d.location ?? "",
        }))

        setDevices(view)
      } catch (e: any) {
        setDevices([])
        setError(e?.message ?? "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [plantId, endpoint])

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="text-sm text-muted-foreground">
          Plant ID: <span className="font-mono">{plantId ?? "(none)"}</span>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">計器一覧</h2>

        {loading && <div className="text-sm">読み込み中...</div>}

        {error && (
          <div className="text-sm text-red-600 whitespace-pre-wrap">
            {error}
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
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.latestval ?? "-"}</TableCell>
                <TableCell>{d.location}</TableCell>
                <TableCell>
                  <Link href={`/dashboard/reading/${encodeURIComponent(d.id)}`}>
                    <Button variant="outline" size="sm">
                      読み値履歴
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}

            {!loading && !error && devices.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  該当データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
