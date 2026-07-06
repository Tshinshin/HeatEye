export default function MicReportPage() {
  return (
    <div className="relative h-[calc(100vh-57px)] w-full overflow-hidden">
      <span className="absolute top-2 right-3 z-10 select-none pointer-events-none
        text-[11px] font-mono text-slate-400 bg-black/50 px-2 py-0.5 rounded">
        最新
      </span>
      <iframe
        title="マイク音圧センサー"
        src="https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/mic/dashboard.html"
        className="h-full w-full border-0"
      />
    </div>
  );
}
