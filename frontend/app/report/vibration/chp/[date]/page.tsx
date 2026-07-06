"use client"

import { useParams } from "next/navigation";

export default function VibrationCHPDatePage() {
  const { date } = useParams<{ date: string }>();
  const src = `https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/vib/chp/${date}.html`;
  return (
    <div className="relative h-[calc(100vh-57px)] w-full overflow-hidden">
      <span className="absolute top-2 right-3 z-10 select-none pointer-events-none
        text-[11px] font-mono text-slate-400 bg-black/50 px-2 py-0.5 rounded">
        {date}
      </span>
      <iframe
        title={`振動センサー (${date})`}
        src={src}
        className="h-full w-full border-0"
      />
    </div>
  );
}
