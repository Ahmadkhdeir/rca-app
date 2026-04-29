import React from 'react';

interface Props {
    score: number;
    color: string;
    label?: string;
    size?: number;
}

export default function ScoreGauge({ score, color, label = 'RISK SCORE', size = 180 }: Props) {
    const r = 68;
    const cx = 90, cy = 90;
    const C = 2 * Math.PI * r;

    // 270° arc gauge — starts at 7:30 (225° CCW rotation from 3 o'clock start)
    const arcFrac = 0.75;
    const trackLen = C * arcFrac;
    const fillLen = trackLen * Math.min(Math.max(score, 0), 100) / 100;
    const rot = `rotate(-225, ${cx}, ${cy})`;

    // Zone markers for Low/Medium/High thresholds at 30% and 65%
    const markerAngles = [30, 65].map(pct => {
        const frac = pct / 100;
        const angleDeg = -225 + frac * 270;
        const rad = (angleDeg * Math.PI) / 180;
        const rx = cx + r * Math.cos(rad);
        const ry = cy + r * Math.sin(rad);
        return { rx, ry };
    });

    return (
        <svg viewBox="0 0 180 180" width={size} height={size}>
            {/* Background track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="16"
                strokeDasharray={`${trackLen} ${C - trackLen}`} strokeLinecap="round" transform={rot} />
            {/* Colored fill */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="16"
                strokeDasharray={`${fillLen} ${C - fillLen}`} strokeLinecap="round" transform={rot}
                style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }} />
            {/* Threshold tick marks */}
            {markerAngles.map(({ rx, ry }, i) => (
                <circle key={i} cx={rx} cy={ry} r={3} fill="#fff" opacity={0.8} />
            ))}
            {/* Center score */}
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="44" fontWeight="900" fill={color}>{score}</text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fontWeight="700" fill="#94a3b8" letterSpacing="1">{label}</text>
        </svg>
    );
}
