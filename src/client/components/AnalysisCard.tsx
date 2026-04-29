import React from 'react';
import { val, disp, resultName, type RiskResult } from '../services/api';
import './AnalysisCard.css';

const META: Record<string, { accent: string; bg: string; text: string }> = {
    high:   { accent: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
    medium: { accent: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
    low:    { accent: '#10b981', bg: '#ecfdf5', text: '#065f46' },
};

interface Props { record: RiskResult; onClick: () => void; }

export default function AnalysisCard({ record, onClick }: Props) {
    const level  = val(record.risk_level) || 'low';
    const score  = parseInt(val(record.risk_score) || '0', 10);
    const m      = META[level] ?? META.low;
    const name   = resultName(record);
    const num    = disp(record.number) || '';
    const count  = val(record.record_count) || '0';
    const by     = disp(record.analyzed_by) || '—';
    const at     = disp(record.analyzed_at) || '';
    const barW   = `${Math.min(score, 100)}%`;

    return (
        <button className="ac" onClick={onClick}>
            <div className="ac__stripe" style={{ background: m.accent }} />
            <div className="ac__body">
                <div className="ac__row">
                    <div className="ac__info">
                        <span className="ac__num">{num}</span>
                        <h3 className="ac__name">{name}</h3>
                    </div>
                    <span className="ac__badge" style={{ background: m.bg, color: m.text }}>
                        {level === 'high' && <span className="ac__pulse" style={{ background: m.accent }} />}
                        {level.toUpperCase()}
                    </span>
                </div>
                <div className="ac__bar-row">
                    <div className="ac__track">
                        <div className="ac__fill" style={{ width: barW, background: m.accent }} />
                    </div>
                    <span className="ac__pts" style={{ color: m.text }}>{score} pts</span>
                </div>
                <div className="ac__meta">
                    <span>📄 {count} records</span>
                    <span className="ac__sep">·</span>
                    <span>👤 {by}</span>
                    <span className="ac__sep">·</span>
                    <span>🕐 {at}</span>
                </div>
            </div>
            <div className="ac__chevron">›</div>
        </button>
    );
}
