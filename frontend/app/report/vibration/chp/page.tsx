export default function VibrationCHPReportPage() {
  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title="振動センサー (US-CHP1/2/3)"
        src="https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/vib/chp/dashboard.html"
        className="h-full w-full border-0"
      />
    </div>
  );
}
