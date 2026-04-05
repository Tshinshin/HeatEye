"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
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

type ReadingFromApi = {
  plant_device_id?: string
  device_id?: string
  timestamp: string
  image: string | null
  reading: number | string | null
}

type RowView = {
  timestamp: string
  value: number | string | null
  imageUrl: string | null
}

export default function ReadingPage() {
  const params = useParams<{ plantId: string; deviceId: string }>()
  const plantId = params.plantId
  const deviceId = params.deviceId

  const [rows, setRows] = useState<RowView[]>([])
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  // クリック拡大用
  const [open, setOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const base = process.env.NEXT_PUBLIC_API_BASE_URL

  const plantDeviceId = useMemo(() => {
    if (!plantId || !deviceId) return ""
    return `${plantId}#${deviceId}`
  }, [plantId, deviceId])

  const endpoint = useMemo(() => {
    if (!base || !plantDeviceId) return ""
    return `${base}/readings?plantDeviceId=${encodeURIComponent(plantDeviceId)}`
  }, [base, plantDeviceId])

  function formatNowForFileName(date: Date = new Date()) {
    const yyyy = date.getFullYear().toString()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    const hh = String(date.getHours()).padStart(2, "0")
    const mi = String(date.getMinutes()).padStart(2, "0")
    const ss = String(date.getSeconds()).padStart(2, "0")
    return `${yyyy}${mm}${dd}${hh}${mi}${ss}`
  }

  function escapeCsvValue(value: unknown) {
    if (value === null || value === undefined) return ""
    const str = String(value)
    return `"${str.replace(/"/g, '""')}"`
  }

  function handleDownloadCsv() {
    if (!plantId || !deviceId) return

    if (rows.length === 0) {
      alert("ダウンロード対象のデータがありません")
      return
    }

    const header = ["timestamp", "reading"]
    const body = rows.map((r) => [
      escapeCsvValue(r.timestamp),
      escapeCsvValue(r.value),
    ])

    const csv = [header.join(","), ...body.map((line) => line.join(","))].join("\r\n")

    // Excelで開くことも考えてBOM付きにする
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const timestamp = formatNowForFileName()
    const fileName = `${plantId}_${deviceId}_${timestamp}.csv`

    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()

    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    ;(async () => {
      setError("")
      setRows([])

      if (!plantId || !deviceId || !plantDeviceId) return

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

        const data = (await res.json()) as { items: ReadingFromApi[] }
        const items = data.items ?? []

        const view: RowView[] = items
          .map((r) => ({
            timestamp: r.timestamp,
            value: r.reading,
            imageUrl: r.image ?? null,
          }))
          .sort((a, b) => {
            if (a.timestamp < b.timestamp) return 1
            if (a.timestamp > b.timestamp) return -1
            return 0
          })

        setRows(view)
      } catch (e: unknown) {
        console.error("Readings load error:", e)
        const msg =
          e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e)
        setError(msg)
      } finally {
        setLoading(false)
      }
    })()
  }, [plantId, deviceId, plantDeviceId, base, endpoint])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          読み値一覧（{plantId} / {deviceId}）
        </h1>

        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={handleDownloadCsv}
            disabled={loading || rows.length === 0}
          >
            CSVダウンロード
          </Button>

          <Link href={`/dashboard?plantId=${encodeURIComponent(plantId)}`}>
            <Button variant="outline">戻る</Button>
          </Link>
        </div>
      </div>

      {loading && <div className="text-sm">読み込み中...</div>}

      {error && (
        <div className="text-sm text-red-600 whitespace-pre-wrap">
          読み込みエラー: {error}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>値</TableHead>
            <TableHead className="text-center">画像</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={idx}>
              <TableCell>{r.timestamp}</TableCell>
              <TableCell>{r.value ?? "-"}</TableCell>

              <TableCell className="text-center">
                {r.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(r.imageUrl)
                      setOpen(true)
                    }}
                    className="inline-block"
                    aria-label="画像を拡大表示"
                  >
                    <img
                      src={r.imageUrl}
                      alt="reading"
                      className="inline-block h-12 w-12 rounded object-cover border"
                      loading="lazy"
                    />
                  </button>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}

          {!loading && !error && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-sm text-muted-foreground">
                該当データがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
              alt="reading large"
              className="max-h-[80vh] max-w-[88vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}