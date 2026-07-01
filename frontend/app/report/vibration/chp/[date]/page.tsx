"use client"

import { useParams } from "next/navigation";

export default function VibrationCHPDatePage() {
  const { date } = useParams<{ date: string }>();
  const src = `https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/vib/chp/${date}.html`;
  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title={`振動センサー (${date})`}
        src={src}
        className="h-full w-full border-0"
      />
    </div>
  );
}
