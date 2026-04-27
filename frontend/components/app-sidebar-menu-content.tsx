"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Separator } from "@/components/ui/separator";

type MenuItem = {
  label: string;
  href: string;
};

export default function AppSidebarMenuContent() {
  const searchParams = useSearchParams();
  const plantId = searchParams.get("plantId");

  const withPlantId = (path: string) => {
    if (!plantId) return path;
    return `${path}?plantId=${encodeURIComponent(plantId)}`;
  };

  const sensorMenus: MenuItem[] = [
    { label: "日報", href: "/dashboard" },
    { label: "振動センサー", href: "https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/vib/dashboard.html" },
    { label: "電流センサー", href: "https://oessmart.s3.ap-northeast-1.amazonaws.com/motor-plot/reports/dashboard.html" },
    { label: "温度センサー", href: "/temperature-sensor" },
  ];

  return (
    <nav className="mt-6 space-y-4">
      <ul className="space-y-2">
        {sensorMenus.map((item) => (
          <li key={item.href}>
            <Link
              href={withPlantId(item.href)}
              className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <Separator />

      <ul className="space-y-2">
        <li>
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            プラント一覧
          </Link>
        </li>
      </ul>
    </nav>
  );
}