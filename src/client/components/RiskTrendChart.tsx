import React, { useEffect, useState } from 'react';

interface Bar { score: number; level: string; name: string; }

const COLORS: Record<string, string> = {
    high: '#ef4444', medium: '#f59e0b', low: '#10b981',
};
const GLOW: Record<string, string> = {
    high: 'rgba(239,68,68,0.18)', medium: 'rgba(245,158,11,0.18)', low: 'rgba(16,185,129,0.18)',
};

export default function RiskTrendChart({ data }: { data: Bar[] }) {
    const [drawn, setDrawn] = useState(false);
    const [hover, setHover] = useState<number | null>(null);

    useEffect(() => {
        setDrawn(false);
        const t = setTimeout(() => setDrawn(true), 80);
        return () => clearTimeout(t);
    }, [data]);

    const W = 1000, H = 245;
    const PAD = { t: 56, r: 16, b: 32, l: 40 };
    const cW = W - PAD.l - PAD.r;
    const cH = H - PAD.t - PAD.b;
    const n = Math.max(data.length, 1);
    const slotW = cW / n;
    const bW = Math.min(slotW - 8, 52);

    const xFor = (i: number) => PAD.l + (i + 0.5) * slotW;
    const yFor = (v: number) => PAD.t + cH * (1 - Math.min(v, 100) / 100);

    const thresholds = [
        { v: 30, label: 'Medium', color: '#f59e0b' },
        { v: 65, label: 'High',   color: '#ef4444' },
    ];

    const hovered = hover !== null ? data[hover] : null;

    if (!data.length) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8, color: '#94a3b8', fontSize: 13 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 17l4-8 4 4 4-6 4 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Run analyses to see score trends
            </div>
        );
    }

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
                {(['high', 'medium', 'low'] as const).map(k => (
                    <linearGradient key={k} id={`bar-grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS[k]} stopOpacity="0.95" />
                        <stop offset="100%" stopColor={COLORS[k]} stopOpacity="0.5" />
                    </linearGradient>
                ))}
                <filter id="bar-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Background grid */}
            {[0, 25, 50, 75, 100].map(v => (
                <line key={v}
                    x1={PAD.l} y1={yFor(v)} x2={PAD.l + cW} y2={yFor(v)}
                    stroke={v === 0 ? '#e2e8f0' : '#f1f5f9'} strokeWidth={v === 0 ? 1.5 : 1}
                />
            ))}

            {/* Y-axis labels */}
            {[0, 25, 50, 75, 100].map(v => (
                <text key={v} x={PAD.l - 8} y={yFor(v) + 4} textAnchor="end" fontSize="11" fill="#cbd5e1" fontWeight="500">{v}</text>
            ))}

            {/* Threshold lines — label sits on the left inside the chart */}
            {thresholds.map(({ v, label, color }) => (
                <g key={v}>
                    <line x1={PAD.l} y1={yFor(v)} x2={PAD.l + cW} y2={yFor(v)}
                        stroke={color} strokeWidth="1.5" strokeDasharray="7 5" opacity="0.5" />
                    <rect x={PAD.l + 4} y={yFor(v) - 11} width={label.length * 6 + 10} height={14} rx={4}
                        fill={color} opacity="0.12" />
                    <text x={PAD.l + 9} y={yFor(v) - 1} textAnchor="start" fontSize="10" fill={color} fontWeight="700">{label}</text>
                </g>
            ))}

            {/* Bars */}
            {data.map((d, i) => {
                const x = xFor(i);
                const color = COLORS[d.level] ?? '#6366f1';
                const gradId = `bar-grad-${d.level}`;
                const isHov = hover === i;
                const opacity = hover !== null && !isHov ? 0.3 : isHov ? 1 : 0.85;
                const barVisH = cH * Math.min(d.score, 100) / 100;
                const labelInside = barVisH > 32;
                return (
                    <g key={i}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                        style={{ cursor: 'pointer' }}
                    >
                        {/* Glow background on hover */}
                        {isHov && (
                            <rect
                                x={x - bW / 2 - 4} y={PAD.t}
                                width={bW + 8} height={cH}
                                rx={Math.min(bW / 2, 8)}
                                fill={GLOW[d.level] ?? 'rgba(99,102,241,0.1)'}
                                style={{
                                    transformBox: 'fill-box',
                                    transformOrigin: '50% 100%',
                                    transform: `scaleY(${drawn ? Math.min(d.score, 100) / 100 : 0})`,
                                    transition: 'transform 0.4s ease',
                                }}
                            />
                        )}
                        {/* Bar */}
                        <rect
                            x={x - bW / 2} y={PAD.t}
                            width={bW} height={cH}
                            rx={Math.min(bW / 2, 6)}
                            fill={`url(#${gradId})`}
                            opacity={opacity}
                            filter={isHov ? 'url(#bar-glow)' : undefined}
                            style={{
                                transformBox: 'fill-box',
                                transformOrigin: '50% 100%',
                                transform: `scaleY(${drawn ? Math.min(d.score, 100) / 100 : 0})`,
                                transition: `transform ${0.5 + i * 0.03}s cubic-bezier(.4,0,.2,1), opacity 0.15s`,
                            }}
                        />
                        {/* Score label — inside bar (white) for tall bars, above (colored) for short */}
                        {drawn && d.score > 0 && (
                            <text
                                x={x}
                                y={labelInside
                                    ? yFor(Math.min(d.score, 100)) + Math.min(barVisH * 0.45, 20)
                                    : yFor(Math.min(d.score, 100)) - 5}
                                textAnchor="middle"
                                fontSize="10"
                                fill={labelInside ? 'rgba(255,255,255,0.92)' : color}
                                fontWeight="700"
                                opacity={isHov ? 1 : hover !== null ? 0 : 1}
                                style={{ transition: 'opacity 0.15s' }}
                            >{d.score}</text>
                        )}
                    </g>
                );
            })}

            {/* Hover tooltip */}
            {hovered && hover !== null && (() => {
                const x = xFor(hover);
                const y = yFor(Math.min(hovered.score, 100));
                const color = COLORS[hovered.level] ?? '#6366f1';
                const tipW = 140;
                const tipX = Math.min(Math.max(x - tipW / 2, PAD.l), PAD.l + cW - tipW);
                const tipY = Math.max(y - 52, PAD.t + 2);
                return (
                    <g style={{ pointerEvents: 'none' }}>
                        <rect x={tipX} y={tipY} width={tipW} height={42} rx={8} fill="#0f172a" opacity="0.92" />
                        <text x={tipX + tipW / 2} y={tipY + 18} textAnchor="middle" fontSize="13" fill="#fff" fontWeight="800">{hovered.score} pts</text>
                        <rect x={tipX + tipW / 2 - 18} y={tipY + 24} width={36} height={13} rx={4} fill={color} opacity="0.25" />
                        <text x={tipX + tipW / 2} y={tipY + 34} textAnchor="middle" fontSize="10" fill={color} fontWeight="700">{hovered.level.toUpperCase()}</text>
                    </g>
                );
            })()}
        </svg>
    );
}
