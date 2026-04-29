import React from 'react';
import './RiskBadge.css';

interface Props {
    level: 'low' | 'medium' | 'high' | string;
    size?: 'sm' | 'lg';
}

const LABELS: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
};

export default function RiskBadge({ level, size = 'sm' }: Props) {
    const normalized = level?.toLowerCase() ?? '';
    return (
        <span className={`risk-badge risk-badge--${normalized} risk-badge--${size}`}>
            {LABELS[normalized] ?? level}
        </span>
    );
}
