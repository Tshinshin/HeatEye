// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchAuthSession } from "aws-amplify/auth";

type Plant = { plant_id: string; plant_name: string };

export default function Home() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) throw new Error("No idToken. Are you logged in?");

        const res = await fetch("/api/plants", {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message ?? `HTTP ${res.status}`);
        }

        const data = (await res.json()) as { plants: Plant[] };
        setPlants(data.plants ?? []);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">プラント一覧</h1>

      {error && (
        <p className="mb-4 text-sm text-red-600">
          読み込みエラー: {error}
        </p>
      )}

      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">プラント名</th>
            <th className="border border-gray-300 px-4 py-2 text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {plants.map((p) => (
            <tr key={p.plant_id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{p.plant_name}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <Link href={`/dashboard?plantId=${encodeURIComponent(p.plant_id)}`}>
                  <Button size="sm">詳細</Button>
                </Link>
              </td>
            </tr>
          ))}
          {plants.length === 0 && !error && (
            <tr>
              <td className="border border-gray-300 px-4 py-6 text-sm text-gray-500" colSpan={2}>
                表示できるプラントがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
