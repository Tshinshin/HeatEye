"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MenuItem = {
  label: string;
  href: string;
};

export default function AppSidebarMenu() {
  const sensorMenus: MenuItem[] = [
    { label: "日報", href: "/daily-report" },
    { label: "温度センサー", href: "/temperature-sensor" },
    { label: "振動センサー", href: "/vibration-sensor" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="メニューを開く">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[260px] sm:w-[300px]">
        <SheetHeader>
          <SheetTitle>メニュー</SheetTitle>
        </SheetHeader>

        <nav className="mt-6 space-y-4">

          {/* センサー関連 */}
          <ul className="space-y-2">
            {sensorMenus.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* 分割線 */}
          <Separator />

          {/* プラント */}
          <ul className="space-y-2">
            <li>
              <Link
                href="/plants"
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                プラント一覧
              </Link>
            </li>
          </ul>

        </nav>
      </SheetContent>
    </Sheet>
  );
}