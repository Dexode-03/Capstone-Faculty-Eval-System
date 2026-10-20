/**
 * SVG/CSS Chart Components for System Reports (Task 3B.6 / FR-29)
 *
 * Pure SVG + CSS chart components for:
 * 1. DepartmentScoresChart  – Horizontal bar chart of department avg ratings
 * 2. SentimentDonutChart    – Animated donut / ring chart of sentiment distribution
 * 3. PeriodTrendChart       – Line + area chart showing rating trends across academic periods
 */
import { useState } from 'react';

/* ─── Color Palette ──────────────────────────────────────────────── */
const COLORS = {
  primary:      '#1e40af',
  primaryLight: '#3b82f6',
  positive:     '#1e40af',
  neutral:      '#eab308',
  negative:     '#ef4444',
  grid:         '#e5e7eb',
  text:         '#334155',
  muted:        '#94a3b8',
  bg:           '#f8fafc',
  white:        '#ffffff',
  accent:       '#6366f1',
};

const STATUS_COLORS = {
  excellent:         '#059669',
  good:              '#1e40af',
  fair:              '#d97706',
  needs_improvement: '#dc2626',
  insufficient_data: '#94a3b8',
};

/* ═══════════════════════════════════════════════════════════════════
   1. Department Scores Bar Chart
   ═══════════════════════════════════════════════════════════════════ */
export const DepartmentScoresChart = ({ departments = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  if (!departments.length) return null;

  const maxRating = 5;
  const barHeight = 36;
  const gap = 12;
  const labelWidth = 160;
  const chartWidth = 400;
  const totalHeight = departments.length * (barHeight + gap) + gap;
  const svgWidth = labelWidth + chartWidth + 60;

  return (
    <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-psu-border">
        <h2 className="text-[13px] font-semibold text-psu-text">Average Rating by Department</h2>
        <p className="text-[12px] text-psu-muted mt-1">Comparative view of department performance (out of 5.0)</p>
      </div>
      <div className="p-4 sm:p-6 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${totalHeight}`}
          width="100%"
          style={{ maxWidth: svgWidth, minWidth: 440 }}
          role="img"
          aria-label="Department average rating bar chart"
        >
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map(tick => {
            const x = labelWidth + (tick / maxRating) * chartWidth;
            return (
              <g key={tick}>
                <line
                  x1={x} y1={0} x2={x} y2={totalHeight}
                  stroke={COLORS.grid}
                  strokeDasharray="4,4"
                  strokeWidth={1}
                />
                <text x={x} y={totalHeight + 14} textAnchor="middle" fill={COLORS.muted} fontSize={10}>
                  {tick}.0
                </text>
              </g>
            );
          })}

          {departments.map((dept, i) => {
            const y = gap + i * (barHeight + gap);
            const barW = (dept.averageRating / maxRating) * chartWidth;
            const isHovered = hoveredIdx === i;
            const statusColor = STATUS_COLORS[dept.status] || COLORS.primary;

            return (
              <g
                key={dept.department}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Department label */}
                <text
                  x={labelWidth - 8}
                  y={y + barHeight / 2 + 1}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill={isHovered ? COLORS.primary : COLORS.text}
                  fontSize={12}
                  fontWeight={isHovered ? 600 : 500}
                >
                  {dept.department.length > 22
                    ? dept.department.slice(0, 20) + '…'
                    : dept.department}
                </text>

                {/* Background track */}
                <rect
                  x={labelWidth}
                  y={y}
                  width={chartWidth}
                  height={barHeight}
                  rx={6}
                  fill={COLORS.bg}
                />

                {/* Filled bar */}
                <rect
                  x={labelWidth}
                  y={y + 2}
                  width={barW}
                  height={barHeight - 4}
                  rx={5}
                  fill={statusColor}
                  opacity={isHovered ? 1 : 0.85}
                  style={{
                    transition: 'width 0.8s cubic-bezier(.4,0,.2,1), opacity 0.2s',
                  }}
                />

                {/* Value label */}
                <text
                  x={labelWidth + barW + 8}
                  y={y + barHeight / 2 + 1}
                  dominantBaseline="central"
                  fill={COLORS.text}
                  fontSize={12}
                  fontWeight={700}
                >
                  {dept.averageRating}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <text
                    x={labelWidth + barW + 38}
                    y={y + barHeight / 2 + 1}
                    dominantBaseline="central"
                    fill={COLORS.muted}
                    fontSize={10}
                  >
                    {dept.totalEvaluations} evals · {dept.positiveRate}% positive
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════
   2. Sentiment Donut Chart
   ═══════════════════════════════════════════════════════════════════ */
export const SentimentDonutChart = ({ sentimentCounts = {} }) => {
  const [hovered, setHovered] = useState(null);
  const { positive = 0, neutral = 0, negative = 0 } = sentimentCounts;
  const total = positive + neutral + negative;
  if (total === 0) return null;

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 75;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { key: 'positive', value: positive, color: COLORS.positive, label: 'Positive' },
    { key: 'neutral',  value: neutral,  color: COLORS.neutral,  label: 'Neutral'  },
    { key: 'negative', value: negative, color: COLORS.negative, label: 'Negative' },
  ].filter(s => s.value > 0);

  let cumulativeOffset = 0;
  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const length = pct * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += length;
    return { ...seg, pct, length, offset };
  });

  return (
    <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-psu-border">
        <h2 className="text-[13px] font-semibold text-psu-text">Sentiment Distribution</h2>
        <p className="text-[12px] text-psu-muted mt-1">Visual breakdown of evaluation sentiment proportions</p>
      </div>
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        {/* Donut SVG */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            {/* Background ring */}
            <circle
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={COLORS.grid}
              strokeWidth={strokeWidth}
            />
            {/* Segments */}
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={hovered === arc.key ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${cx} ${cy})`}
                onMouseEnter={() => setHovered(arc.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  transition: 'stroke-width 0.2s ease, stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)',
                  cursor: 'pointer',
                }}
                opacity={hovered && hovered !== arc.key ? 0.4 : 1}
              />
            ))}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-psu-text tabular-nums">
              {hovered
                ? `${Math.round((sentimentCounts[hovered] / total) * 100)}%`
                : total}
            </span>
            <span className="text-[10px] text-psu-muted uppercase tracking-wider">
              {hovered ? hovered : 'total'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 min-w-[180px]">
          {arcs.map(arc => {
            const pctVal = Math.round(arc.pct * 100);
            return (
              <div
                key={arc.key}
                className="flex items-center gap-3 group cursor-pointer"
                onMouseEnter={() => setHovered(arc.key)}
                onMouseLeave={() => setHovered(null)}
              >
                <div
                  className="w-3.5 h-3.5 rounded-sm flex-shrink-0 transition-transform group-hover:scale-125"
                  style={{ backgroundColor: arc.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-psu-text">{arc.label}</span>
                    <span className="text-[12px] font-semibold text-psu-text tabular-nums ml-4">
                      {arc.value} <span className="font-normal text-psu-muted">({pctVal}%)</span>
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pctVal}%`, backgroundColor: arc.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════
   3. Period Trend Line Chart
   ═══════════════════════════════════════════════════════════════════ */
export const PeriodTrendChart = ({ periodTrends = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  if (periodTrends.length < 1) return null;

  const padding = { top: 20, right: 30, bottom: 50, left: 45 };
  const chartW = Math.max(periodTrends.length * 100, 360);
  const chartH = 220;
  const svgW = chartW + padding.left + padding.right;
  const svgH = chartH + padding.top + padding.bottom;

  const minY = 0;
  const maxY = 5;
  const rangeY = maxY - minY;

  const xScale = (i) => padding.left + (periodTrends.length === 1
    ? chartW / 2
    : (i / (periodTrends.length - 1)) * chartW);
  const yScale = (v) => padding.top + chartH - ((v - minY) / rangeY) * chartH;

  // Build line path & area path
  const points = periodTrends.map((p, i) => ({ x: xScale(i), y: yScale(p.avgRating) }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePath
    + ` L${points[points.length - 1].x},${yScale(0)}`
    + ` L${points[0].x},${yScale(0)} Z`;

  // Y-axis ticks
  const yTicks = [0, 1, 2, 3, 4, 5];

  return (
    <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-psu-border">
        <h2 className="text-[13px] font-semibold text-psu-text">Rating Trend Over Periods</h2>
        <p className="text-[12px] text-psu-muted mt-1">
          Average rating trajectory across academic periods
        </p>
      </div>
      <div className="p-4 sm:p-6 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          style={{ maxWidth: svgW, minWidth: 320 }}
          role="img"
          aria-label="Average rating trend over academic periods"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.18" />
              <stop offset="100%" stopColor={COLORS.primary} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid + Y axis */}
          {yTicks.map(tick => {
            const y = yScale(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left} y1={y} x2={padding.left + chartW} y2={y}
                  stroke={COLORS.grid} strokeWidth={1}
                  strokeDasharray={tick === 0 ? '' : '4,4'}
                />
                <text
                  x={padding.left - 8} y={y + 1}
                  textAnchor="end" dominantBaseline="central"
                  fill={COLORS.muted} fontSize={10}
                >
                  {tick}.0
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={COLORS.primary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'all 0.5s' }}
          />

          {/* Data points & X labels */}
          {periodTrends.map((p, i) => {
            const pt = points[i];
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={p.periodId}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible hit area */}
                <rect
                  x={pt.x - 20} y={padding.top} width={40} height={chartH}
                  fill="transparent"
                />

                {/* Vertical crosshair on hover */}
                {isHovered && (
                  <line
                    x1={pt.x} y1={padding.top} x2={pt.x} y2={padding.top + chartH}
                    stroke={COLORS.primary} strokeWidth={1} opacity={0.15}
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x} cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={COLORS.white}
                  stroke={p.isActive ? COLORS.accent : COLORS.primary}
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'r 0.15s, stroke-width 0.15s' }}
                />

                {/* Value label on hover */}
                {isHovered && (
                  <>
                    <rect
                      x={pt.x - 34} y={pt.y - 32}
                      width={68} height={22} rx={4}
                      fill={COLORS.text} opacity={0.92}
                    />
                    <text
                      x={pt.x} y={pt.y - 21}
                      textAnchor="middle" dominantBaseline="central"
                      fill={COLORS.white} fontSize={11} fontWeight={600}
                    >
                      {p.avgRating} / 5
                    </text>
                    <text
                      x={pt.x} y={pt.y - 48}
                      textAnchor="middle" fill={COLORS.muted} fontSize={9}
                    >
                      {p.totalEvaluations} evals · {p.positiveRate}% pos
                    </text>
                  </>
                )}

                {/* X label */}
                <text
                  x={pt.x}
                  y={padding.top + chartH + 16}
                  textAnchor="middle"
                  fill={isHovered ? COLORS.primary : COLORS.muted}
                  fontSize={10}
                  fontWeight={isHovered || p.isActive ? 600 : 400}
                >
                  {p.shortLabel}
                </text>
                {p.isActive && (
                  <text
                    x={pt.x}
                    y={padding.top + chartH + 30}
                    textAnchor="middle"
                    fill={COLORS.accent}
                    fontSize={8}
                    fontWeight={700}
                  >
                    ACTIVE
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
