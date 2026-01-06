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
    { id: "pump01", name: "1号ポンプ", location: "ポンプ室 A" },
    { id: "pump02", name: "2号ポンプ", location: "ポンプ室 B" },
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
                  <Link href={`/dashboard/reading/${d.id}`}>
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
    </div>
  )
}
