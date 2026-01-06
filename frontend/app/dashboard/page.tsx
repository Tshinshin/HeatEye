"use client"

import { useState } from "react"
import { Device } from "@/lib/types"
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
  const [devices] = useState<Device[]>([
    { id: "TI001", name: "温度計001", latestval: 5.1, location: "ボイラー室" },
    { id: "TI002", name: "温度計002", latestval: 15.3, location: "ボイラー室" },
    { id: "TI003", name: "温度計003", latestval: 7.8, location: "ボイラー室" },
    { id: "TI004", name: "温度計004", latestval: 22.0, location: "ボイラー室" },
    { id: "TI005", name: "温度計005", latestval: 11.3, location: "ボイラー室" },
    { id: "TI006", name: "温度計006", latestval: 15.4, location: "13F" },
    { id: "TI007", name: "温度計007", latestval: 8.8, location: "13F" },
    { id: "TI008", name: "温度計008", latestval: 9.9, location: "14F" },
    { id: "TI009", name: "温度計009", latestval: 4.1, location: "14F" },
    { id: "TI010", name: "温度計010", latestval: 22.6, location: "14F" },
  ])

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <section>
        <h2 className="text-xl font-semibold mb-3">計器一覧</h2>

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
                <TableCell>{d.latestval}</TableCell>                
                <TableCell>{d.location}</TableCell>
                <TableCell>
                  <Link href={`/dashboard/reading/${d.id}`}>
                    <Button variant="outline" size="sm">
                      読み値履歴
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
