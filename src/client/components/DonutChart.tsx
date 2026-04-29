import React, { useEffect, useState } from 'react';

interface Props { high: number; medium: number; low: number; }

const SEG = [
    { key: 'high',   color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
    { key: 'medium', color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
    { key: 'low',    color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
] as const;

export default function DonutChart({ high, medium, low }: Props) {
    const [drawn, setDrawn] = useState(false);
    const total = high + medium + low;
    const values: Record<string, number> = { high, medium, low };

    useEffect(() => {
        const t = setTimeout(() => setDrawn(true), 120);
        return () => clearTimeout(t);
    }, [high, medium, low]);

    const r = 64;
    const cx = 90, cy = 90;
    const C = 2 * Math.PI * r;
    const GAP = total > 1 ? 0.018 : 0;
    let cum = 0;

    return (
        <svg viewBox="0 0 180 180" style={{ width: '100%', maxWidth: 210, height: 'auto', display: 'block' }}>
            <defs>
                <filter id="donut-shadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                </filter>
                {SEG.map(({ key, glow }) => (
                    <filter key={key} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feFlood floodColor={glow} result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="glow" />
                        <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                ))}
            </defs>

            {/* Background track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="20" />

            {total === 0 ? (
                <>
                    <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fill="#94a3b8">No data yet</text>
                </>
            ) : (
                <>
                    {SEG.map(({ key, color }) => {
                        const v = values[key];
                        if (v === 0) { cum += v; return null; }
                        const frac = v / total;
                        const dashLen = C * (frac - GAP);
                        const offset = C * (0.25 - cum / total);
                        const el = (
                            <circle
                                key={key}
                                cx={cx} cy={cy} r={r}
                                fill="none"
                                stroke={color}
                                strokeWidth="20"
                                strokeDasharray={drawn ? `${dashLen} ${C - dashLen}` : `0 ${C}`}
                                strokeDashoffset={offset}
                                strokeLinecap="butt"
                                filter={key === 'high' && v > 0 ? `url(#glow-high)` : undefined}
                                style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)' }}
                            />
                        );
                        cum += v;
                        return el;
                    })}

                    {/* White center circle for clean look */}
                    <circle cx={cx} cy={cy} r={r - 12} fill="#fff" />

                    {/* Center text */}
                    <text x={cx} y={cy - 12} textAnchor="middle" fontSize="36" fontWeight="900" fill="#0f172a"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                        {total}
                    </text>
                    <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#94a3b8" letterSpacing="1.2">
                        ANALYZED
                    </text>
                    {high > 0 && (
                        <text x={cx} y={cy + 24} textAnchor="middle" fontSize="10" fontWeight="700" fill="#ef4444">
                            {Math.round(high / total * 100)}% high
                        </text>
                    )}
                </>
            )}
        </svg>
    );
}
