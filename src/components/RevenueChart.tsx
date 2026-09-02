type RevenuePoint = {
  /** x축에 표시할 라벨 (예: "09/02") */
  label: string;
  amount: number;
};

/**
 * 외부 차트 라이브러리 없이 순수 SVG로 그리는 최근 매출 막대 그래프입니다.
 * 데모/관리자 대시보드 용도로 가볍게 구현했습니다.
 */
export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const width = 700;
  const height = 220;
  const paddingLeft = 56;
  const paddingBottom = 28;
  const paddingTop = 16;

  const chartWidth = width - paddingLeft - 12;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const barGap = 6;
  const barWidth = data.length > 0 ? chartWidth / data.length - barGap : 0;

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxAmount / yTicks) * i);

  function formatTick(v: number) {
    if (v >= 10000) return `${Math.round(v / 10000)}만`;
    return Math.round(v).toLocaleString("ko-KR");
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="최근 14일 매출 추이 그래프"
        className="w-full min-w-[560px]"
      >
        {/* y축 그리드 라인 + 라벨 */}
        {tickValues.map((v, i) => {
          const y = paddingTop + chartHeight - (v / maxAmount) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                x2={width - 8}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                {formatTick(v)}
              </text>
            </g>
          );
        })}

        {/* 막대 */}
        {data.map((d, i) => {
          const barHeight = maxAmount > 0 ? (d.amount / maxAmount) * chartHeight : 0;
          const x = paddingLeft + i * (barWidth + barGap);
          const y = paddingTop + chartHeight - barHeight;
          return (
            <g key={i}>
              <title>
                {d.label}: {d.amount.toLocaleString("ko-KR")}원
              </title>
              <rect
                x={x}
                y={y}
                width={Math.max(barWidth, 1)}
                height={Math.max(barHeight, 1)}
                rx={3}
                fill="#e0211c"
                opacity={d.amount > 0 ? 1 : 0.15}
              />
              <text
                x={x + barWidth / 2}
                y={height - paddingBottom + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#9ca3af"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
