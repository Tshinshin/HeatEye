"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  // 今は固定表示
  // 将来ここをログイン状態やプラント選択状態で切り替える
  const menuItems: MenuItem[] = [
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

        <nav className="mt-6">
          <ul className="space-y-2">
            {menuItems.map((item) => (
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
        </nav>
      </SheetContent>
    </Sheet>
  );
}