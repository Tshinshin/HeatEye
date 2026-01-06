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
    { timestamp: "2025-01-01 12:00:00", value: 5.4, deviceId: "pump01" },
    { timestamp: "2025-01-01 12:00:00", value: 8.1, deviceId: "pump02" },
    { timestamp: "2025-01-01 13:00:00", value: 5.5, deviceId: "pump01" },
  ])

  const filteredReadings = readings.filter(
    (r) => r.deviceId === deviceId
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          読み値一覧（{deviceId}）
        </h1>

        <Link href="/dashboard">
          <Button variant="outline">戻る</Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>値</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredReadings.map((r, idx) => (
            <TableRow key={idx}>
              <TableCell>{r.timestamp}</TableCell>
              <TableCell>{r.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
