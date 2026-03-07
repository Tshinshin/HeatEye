"use client";

import { Suspense } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import AppSidebarMenuContent from "@/components/app-sidebar-menu-content";

export default function AppSidebarMenu() {
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

        <Suspense fallback={<div className="mt-6 text-sm text-muted-foreground">読み込み中...</div>}>
          <AppSidebarMenuContent />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}