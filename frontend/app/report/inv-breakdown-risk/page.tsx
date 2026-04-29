export default function VibrationReportPage() {
  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title="INV停止リスク"
        src="https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/1p-inv/dashboard.html"
        className="h-full w-full border-0"
      />
    </div>
  );
}