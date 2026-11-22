import type { ReactNode } from 'react';

/** Anillo de progreso fino con contenido centrado (minutos, cuenta atrás…). */
export function Ring({
  size,
  stroke = 3,
  progress,
  color,
  children,
}: {
  size: number;
  stroke?: number;
  /** De 0 a 1. */
  progress: number;
  /** Color CSS del arco, p. ej. `var(--color-edge)`. */
  color: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  const mid = size / 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        {p > 0 && (
          <circle
            className="ring-progress"
            cx={mid}
            cy={mid}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p)}
            transform={`rotate(-90 ${mid} ${mid})`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
        {children}
      </div>
    </div>
  );
}
