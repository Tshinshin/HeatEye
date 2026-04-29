"use client";

import { useEffect, useState } from "react";

export default function CurrentReportPage() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUrl = async () => {
      const res = await fetch("/api/report-url/current");
      const data = await res.json();
      setUrl(data.url);
    };

    loadUrl();
  }, []);

  if (!url) {
    return <div className="p-4">読み込み中...</div>;
  }

  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title="電流センサー"
        src={url}
        className="h-full w-full border-0"
      />
    </div>
  );
}