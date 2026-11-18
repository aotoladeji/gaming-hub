import { useEffect, useState } from 'react';

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

/**
 * Ticks down client-side from the server-computed `remainingSeconds`
 * snapshot, so the UI stays live between dashboard refreshes.
 */
export default function CountdownTimer({ remainingSeconds, totalSeconds, size = 64 }) {
  const [remaining, setRemaining] = useState(remainingSeconds);

  useEffect(() => {
    setRemaining(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  const pct = totalSeconds ? Math.max(0, Math.min(1, remaining / totalSeconds)) : 0;
  const isEnding = remaining <= 300; // last 5 minutes
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--border)" strokeWidth="4" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={isEnding ? 'var(--red)' : 'var(--mint)'}
          strokeWidth="4" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div
        className="mono"
        style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size > 80 ? 15 : 10, fontWeight: 700, color: isEnding ? 'var(--red)' : 'var(--text)',
        }}
      >
        {formatTime(remaining)}
      </div>
    </div>
  );
}
