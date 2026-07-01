"use client"

import { useParams } from "next/navigation";

export default function MicDateReportPage() {
  const { date } = useParams<{ date: string }>();
  const src = `https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/mic/${date}.html`;
  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title={`マイク音圧センサー (${date})`}
        src={src}
        className="h-full w-full border-0"
      />
    </div>
  );
}
