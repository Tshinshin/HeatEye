export default function Page() {
  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <iframe
        src="https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/vib/dashboard.html"
        className="w-full h-full border-0"
      />
    </div>
  );
}