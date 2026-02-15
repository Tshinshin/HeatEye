"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";

type Plant = { plant_id: string; plant_name: string };

export default function Home() {
  const router = useRouter();

  const [plants, setPlants] = useState<Plant[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      console.log("Home useEffect started");

      try {
        // 1) ログイン済みチェック（未ログインならログイン画面へ）
        try {
          const user = await getCurrentUser();
          console.log("currentUser", user);
        } catch {
          router.replace(`/login?next=${encodeURIComponent("/")}`);
          return;
        }

        // 2) idToken取得（念のため forceRefresh）
        const session = await fetchAuthSession({ forceRefresh: true });
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) {
          router.replace(`/login?next=${encodeURIComponent("/")}`);
          return;
        }

        // 3) API Base URL（Amplify Consoleの環境変数で設定する）
        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");

        // 4) API Gatewayへアクセス
        const res = await fetch(`${base}/plants`, {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });

        // 5) 401/403 はログインに戻す（セッション不整合対策）
        if (res.status === 401 || res.status === 403) {
          router.replace(`/login?next=${encodeURIComponent("/")}`);
          return;
        }

        // 6) その他エラー処理
        if (!res.ok) {
          const text = await res.text();

          let message = `HTTP ${res.status}`;
          let detail = "";

          try {
            const parsed: unknown = JSON.parse(text);
            if (parsed && typeof parsed === "object") {
              const obj = parsed as Record<string, unknown>;
              if (typeof obj.message === "string") message = obj.message;
              if (typeof obj.detail === "string") detail = obj.detail;
            }
          } catch {
            // JSONでない場合は無視
          }

          throw new Error(detail ? `${message} / ${detail}` : message);
        }

        // 7) 成功
        const data = (await res.json()) as { plants: Plant[] };
        setPlants(data.plants ?? []);
      } catch (e: unknown) {
        console.error("Home load error:", e);
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "string"
            ? e
            : JSON.stringify(e);
        setError(msg);
      }
    })();
  }, [router]);

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">プラント一覧</h1>

      {error && (
        <p className="mb-4 text-sm text-red-600">読み込みエラー: {error}</p>
      )}

      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">
              プラント名
            </th>
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
              <td
                className="border border-gray-300 px-4 py-6 text-sm text-gray-500"
                colSpan={2}
              >
                表示できるプラントがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
