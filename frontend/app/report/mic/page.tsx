export default function MicReportPage() {
  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title="マイク音圧センサー"
        src="https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/mic/dashboard.html"
        className="h-full w-full border-0"
      />
    </div>
  );
}
