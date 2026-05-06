"use client";

import { useEffect, useState } from "react";

export default function VibrationReportPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUrl() {
      try {
        const res = await fetch("/api/report-url/inv-breakdown-risk", {
          cache: "no-store",
        });

        const text = await res.text();

        if (!res.ok) {
          throw new Error(`API error ${res.status}: ${text}`);
        }

        const data = JSON.parse(text);

        if (!data.url) {
          throw new Error("API response does not contain url");
        }

        setUrl(data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }

    loadUrl();
  }, []);

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 whitespace-pre-wrap">
        INV停止リスク画面の読み込みに失敗しました。
        {"\n\n"}
        {error}
      </div>
    );
  }

  if (!url) {
    return <div className="p-4">読み込み中...</div>;
  }

  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title="INV停止リスク"
        src={url}
        className="h-full w-full border-0"
      />
    </div>
  );
}