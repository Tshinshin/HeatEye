type Props = { params: { date: string } };

export default function VibrationCHPDatePage({ params }: Props) {
  const src = `https://oes-sensors.s3.ap-northeast-1.amazonaws.com/reports/vib/chp/${params.date}.html`;
  return (
    <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
      <iframe
        title={`振動センサー (${params.date})`}
        src={src}
        className="h-full w-full border-0"
      />
    </div>
  );
}
