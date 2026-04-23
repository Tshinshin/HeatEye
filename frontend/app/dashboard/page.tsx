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
  latest_timestamp?: string | null
  latest_image?: string | null
}

type DeviceView = {
  plantId: string
  id: string
  name: string
  latestValue: number | string | null
  latestTimestamp: string
  imageUrl: string | null
}

export default function DashboardPage() {
  const [plantId, setPlantId] = useState<string>("")
  const [devices, setDevices] = useState<DeviceView[]>([])
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  const [open, setOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const base = process.env.NEXT_PUBLIC_API_BASE_URL

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

        await getCurrentUser()

        const session = await fetchAuthSession()
        const idToken = session.tokens?.idToken?.toString()
        if (!idToken) throw new Error("No idToken. Are you logged in?")

        if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set")
        if (!endpoint) throw new Error("API endpoint is not available")

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        })

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

        const data = (await res.json()) as { items: DeviceFromApi[] }
        const items = data.items ?? []

        const view: DeviceView[] = items.map((d) => ({
          plantId: d.plant_id,
          id: d.device_id,
          name: d.device_name,
          latestValue: d.latest_value,
          latestTimestamp: d.latest_timestamp ?? "",
          imageUrl: d.latest_image ?? null,
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
              <TableHead>報告値</TableHead>
              <TableHead>報告日時</TableHead>
              <TableHead className="text-center">画像</TableHead>
              <TableHead>詳細</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {devices.map((d) => (
              <TableRow key={`${d.plantId}#${d.id}`}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.latestValue ?? "-"}</TableCell>
                <TableCell>{d.latestTimestamp || "-"}</TableCell>

                <TableCell className="text-center">
                  {d.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(d.imageUrl)
                        setOpen(true)
                      }}
                      className="inline-block"
                      aria-label="画像を拡大表示"
                    >
                      <img
                        src={d.imageUrl}
                        alt={`${d.name} の画像`}
                        className="inline-block h-12 w-12 rounded object-cover border"
                        loading="lazy"
                      />
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>

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
                <TableCell colSpan={5} className="text-sm text-muted-foreground">
                  該当データがありません
                </TableCell>
              </TableRow>
            )}

            {!plantId && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-muted-foreground">
                  plantId が指定されていません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      {open && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] max-w-[90vw] bg-white rounded shadow p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                閉じる
              </Button>
            </div>

            <img
              src={selectedImage}
              alt="device large"
              className="max-h-[80vh] max-w-[88vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}