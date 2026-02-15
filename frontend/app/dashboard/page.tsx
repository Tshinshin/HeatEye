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
  searchParams?: { plantId?: string }
}

// any禁止対策：unknown を安全に文字列化
function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  try {
    return JSON.stringify(err)
  } catch {
    return "Unknown error"
  }
}

export default function DashboardPage({ searchParams }: Props) {
  const plantId = searchParams?.plantId

  const [devices, setDevices] = useState<DeviceView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          throw new Error(`API error: ${res.status} ${res.statusText}\n${text}`)
        }

        const json: unknown = await res.json()

        // { items: [...] } と [...] の両対応
        const items = Array.isArray(json)
          ? (json as DeviceFromApi[])
          : ((json as { items?: DeviceFromApi[] })?.items ?? [])

        const view: DeviceView[] = items.map((d) => ({
          id: d.device_id,
          name: d.device_name,
          latestval: d.latest_value,
          location: d.location ?? "",
        }))

        setDevices(view)
      } catch (e: unknown) {
        setDevices([])
        setError(toErrorMessage(e))
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
