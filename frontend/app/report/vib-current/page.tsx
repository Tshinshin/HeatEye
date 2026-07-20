export default function VibCurrentReportPage() {
  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title="振動×電流 相関"
        src="https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/vib-current/dashboard.html"
        className="h-full w-full border-0"
      />
    </div>
  );
}
