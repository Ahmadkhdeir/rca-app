import React, { useEffect, useState } from 'react';
import { fetchRiskStats, type RiskStats } from '../services/api';
import './StatsHeader.css';

interface Props {
    onFilterByLevel: (level: string | null) => void;
    activeFilter: string | null;
}

export default function StatsHeader({ onFilterByLevel, activeFilter }: Props) {
    const [stats, setStats] = useState<RiskStats>({ low: 0, medium: 0, high: 0, total: 0 });

    useEffect(() => {
        fetchRiskStats().then(setStats).catch(() => {});
    }, []);

    const pct = (n: number) => stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;

    return (
        <header className="sh">
            {/* Brand row */}
            <div className="sh__brand">
                <div className="sh__logo">
                    <span className="sh__logo-icon">🔬</span>
                </div>
                <div>
                    <h1 className="sh__title">Change Risk Analyzer</h1>
                    <p className="sh__subtitle">Analyze ServiceNow Update Sets before deployment</p>
                </div>
                {activeFilter && (
                    <button className="sh__clear" onClick={() => onFilterByLevel(null)}>
                        ✕ Clear filter
                    </button>
                )}
            </div>

            {/* Stat cards */}
            <div className="sh__cards">
                {([
                    { key: 'high',   label: 'High',   count: stats.high,   cls: 'high'   },
                    { key: 'medium', label: 'Medium', count: stats.medium, cls: 'medium' },
                    { key: 'low',    label: 'Low',    count: stats.low,    cls: 'low'    },
                    { key: null,     label: 'Total',  count: stats.total,  cls: 'all'    },
                ] as const).map(({ key, label, count, cls }) => (
                    <button
                        key={String(key)}
                        className={`sh__card sh__card--${cls}${activeFilter === key ? ' sh__card--active' : ''}`}
                        onClick={() => onFilterByLevel(key)}
                    >
                        <span className="sh__card-count">{count}</span>
                        <span className="sh__card-label">{label}</span>
                    </button>
                ))}
            </div>

            {/* Distribution bar */}
            {stats.total > 0 && (
                <div className="sh__dist">
                    <p className="sh__dist-label">Risk Distribution</p>
                    <div className="sh__dist-bar">
                        {stats.high > 0 && (
                            <div
                                className="sh__dist-seg sh__dist-seg--high"
                                style={{ flex: stats.high }}
                                title={`High: ${stats.high} (${pct(stats.high)}%)`}
                            >
                                <span>{pct(stats.high)}%</span>
                            </div>
                        )}
                        {stats.medium > 0 && (
                            <div
                                className="sh__dist-seg sh__dist-seg--medium"
                                style={{ flex: stats.medium }}
                                title={`Medium: ${stats.medium} (${pct(stats.medium)}%)`}
                            >
                                <span>{pct(stats.medium)}%</span>
                            </div>
                        )}
                        {stats.low > 0 && (
                            <div
                                className="sh__dist-seg sh__dist-seg--low"
                                style={{ flex: stats.low }}
                                title={`Low: ${stats.low} (${pct(stats.low)}%)`}
                            >
                                <span>{pct(stats.low)}%</span>
                            </div>
                        )}
                    </div>
                    <div className="sh__dist-legend">
                        <span className="sh__leg sh__leg--high">■ High ({stats.high})</span>
                        <span className="sh__leg sh__leg--medium">■ Medium ({stats.medium})</span>
                        <span className="sh__leg sh__leg--low">■ Low ({stats.low})</span>
                    </div>
                </div>
            )}
        </header>
    );
}
