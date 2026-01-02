"use client"

import { useEffect, useState } from "react"
import { Device, Reading } from "@/lib/types"
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

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [readings, setReadings] = useState<Reading[]>([])

  // 👇 今はモックデータ（後でAPIと接続可能）
  useEffect(() => {
    setDevices([
      { id: "pump01", name: "1号ポンプ", location: "ポンプ室 A" },
      { id: "pump02", name: "2号ポンプ", location: "ポンプ室 B" },
    ])

    setReadings([
      { timestamp: "2025-01-01 12:00:00", value: 5.4, deviceId: "pump01" },
      { timestamp: "2025-01-01 12:00:00", value: 8.1, deviceId: "pump02" },
      { timestamp: "2025-01-01 13:00:00", value: 5.5, deviceId: "pump01" },
    ])
  }, [])

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <section>
        <h2 className="text-xl font-semibold mb-3">計器一覧</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>計器名</TableHead>
              <TableHead>設置場所</TableHead>
              <TableHead>詳細</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.location}</TableCell>
                <TableCell>
                  <Link href={`/dashboard/device/${d.id}`}>
                    <Button variant="outline" size="sm">
                      読み値を見る
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">最新の読み値</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日時</TableHead>
              <TableHead>計器</TableHead>
              <TableHead>値</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>{r.timestamp}</TableCell>
                <TableCell>{r.deviceId}</TableCell>
                <TableCell>{r.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
