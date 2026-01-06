"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { Reading } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"

export default function ReadingPage() {
  const params = useParams<{ deviceId: string }>()
  const deviceId = params.deviceId

  const [readings] = useState<Reading[]>([
    { timestamp: "2025-01-01 12:00:00", value: 5.4, deviceId: "TI001" },
    { timestamp: "2025-01-01 13:00:00", value: 5.5, deviceId: "TI001" },
    { timestamp: "2025-01-01 14:00:00", value: 5.6, deviceId: "TI001" },
    { timestamp: "2025-01-01 15:00:00", value: 5.7, deviceId: "TI001" },
    { timestamp: "2025-01-01 16:00:00", value: 5.8, deviceId: "TI001" },
    { timestamp: "2025-01-01 12:00:00", value: 8.1, deviceId: "TI002" },
    { timestamp: "2025-01-01 13:00:00", value: 5.5, deviceId: "TI002" },
    { timestamp: "2025-01-01 14:00:00", value: 5.6, deviceId: "TI002" },
    { timestamp: "2025-01-01 15:00:00", value: 5.7, deviceId: "TI002" },
    { timestamp: "2025-01-01 16:00:00", value: 5.8, deviceId: "TI002" },
  ])

  const filteredReadings = readings.filter((r) => r.deviceId === deviceId)

  // S3上の画像（公開されている前提）
  const imageUrl =
    "https://infra-images-dev-944510364679.s3.ap-northeast-1.amazonaws.com/sample.jpg"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">読み値一覧（{deviceId}）</h1>

        <Link href="/dashboard">
          <Button variant="outline">戻る</Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>値</TableHead>
            <TableHead className="text-center">画像</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredReadings.map((r, idx) => (
            <TableRow key={idx}>
              <TableCell>{r.timestamp}</TableCell>
              <TableCell>{r.value}</TableCell>

              <TableCell className="text-center">
                {/* サムネクリックでオリジナルを別タブ表示 */}
                <a href={imageUrl} target="_blank" rel="noreferrer">
                  <img
                    src={imageUrl}
                    alt="sample"
                    className="inline-block h-12 w-12 rounded object-cover border"
                    loading="lazy"
                  />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
