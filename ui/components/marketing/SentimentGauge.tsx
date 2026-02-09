'use client';

interface SentimentGaugeProps {
  score: number; // -1.0 to +1.0
  label: string;
}

export default function SentimentGauge({ score, label }: SentimentGaugeProps) {
  // Map score from [-1, 1] to angle [0, 180]
  const angle = ((score + 1) / 2) * 180;
  const radius = 60;
  const cx = 70;
  const cy = 70;

  // Calculate needle endpoint
  const needleAngle = (180 - angle) * (Math.PI / 180);
  const needleX = cx + radius * Math.cos(needleAngle);
  const needleY = cy - radius * Math.sin(needleAngle);

  // Arc path for the gauge background
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  // Color based on score
  const color =
    score >= 0.3
      ? '#22c55e'
      : score >= 0
        ? '#eab308'
        : score >= -0.3
          ? '#f97316'
          : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Gauge background arc */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        <path
          d={arcPath}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill={color} />
      </svg>
      <div className="text-center">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        <span className="text-xs text-text-muted ml-1.5 font-mono">
          ({score > 0 ? '+' : ''}{score.toFixed(2)})
        </span>
      </div>
    </div>
  );
}
