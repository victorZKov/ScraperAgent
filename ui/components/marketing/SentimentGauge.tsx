'use client';

import { motion } from 'framer-motion';

interface SentimentGaugeProps {
  score: number; // -1.0 to +1.0
  label: string;
}

export default function SentimentGauge({ score, label }: SentimentGaugeProps) {
  const angle = ((score + 1) / 2) * 180;
  const radius = 60;
  const cx = 70;
  const cy = 70;

  const toRad = (a: number) => (180 - a) * (Math.PI / 180);

  const needleAngle = toRad(angle);
  const needleX = cx + radius * Math.cos(needleAngle);
  const needleY = cy - radius * Math.sin(needleAngle);

  // Start from neutral (score = 0 → angle = 90°)
  const neutralAngle = toRad(90);
  const neutralX = cx + radius * Math.cos(neutralAngle);
  const neutralY = cy - radius * Math.sin(neutralAngle);

  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  const color =
    score >= 0.3 ? '#22c55e'
    : score >= 0 ? '#eab308'
    : score >= -0.3 ? '#f97316'
    : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.25"
        />
        {/* Animated needle — springs from neutral to actual score */}
        <motion.line
          x1={cx}
          y1={cy}
          initial={{ x2: neutralX, y2: neutralY }}
          animate={{ x2: needleX, y2: needleY }}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          transition={{ type: 'spring', stiffness: 55, damping: 14, delay: 0.4 }}
        />
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
