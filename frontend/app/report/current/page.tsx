export default function VibrationReportPage() {
  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title="振動センサー"
        src="https://oessmart.s3.ap-northeast-1.amazonaws.com/motor-plot/reports/dashboard.html"
        className="h-full w-full border-0"
      />
    </div>
  );
}