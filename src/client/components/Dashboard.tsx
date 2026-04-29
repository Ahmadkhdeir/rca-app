import React, { useEffect, useState, useRef } from 'react';
import { fetchRiskStats, fetchRiskResults, val, disp, resultName, type RiskStats, type RiskResult } from '../services/api';
import { navigate } from '../utils/navigation';
import DonutChart from './DonutChart';
import RiskTrendChart from './RiskTrendChart';
import { MOCK_STATS, MOCK_RESULTS } from '../utils/mockData';
import './Dashboard.css';

const RISK_META: Record<string, { label: string; accent: string; bg: string; text: string; icon: string }> = {
    total:  { label: 'Total Analyses', accent: '#6366f1', bg: '#eef2ff', text: '#4338ca', icon: '◈' },
    high:   { label: 'High Risk',      accent: '#ef4444', bg: '#fef2f2', text: '#991b1b', icon: '⬆' },
    medium: { label: 'Medium Risk',    accent: '#f59e0b', bg: '#fffbeb', text: '#92400e', icon: '◆' },
    low:    { label: 'Low Risk',       accent: '#10b981', bg: '#ecfdf5', text: '#065f46', icon: '⬇' },
};

function useCounter(target: number) {
    const [n, setN] = useState(0);
    const raf = useRef<number>(0);
    useEffect(() => {
        if (target === 0) { setN(0); return; }
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min((now - start) / 900, 1);
            setN(Math.round((1 - Math.pow(1 - t, 3)) * target));
            if (t < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target]);
    return n;
}

function StatCard({ metaKey, value, onClick, index }: { metaKey: string; value: number; onClick: () => void; index: number }) {
    const count = useCounter(value);
    const m = RISK_META[metaKey];
    return (
        <button className="db-stat" onClick={onClick}
            style={{ animationDelay: `${index * 60}ms`, '--accent': m.accent, '--accent-bg': m.bg } as React.CSSProperties}>
            <div className="db-stat__top">
                <span className="db-stat__icon" style={{ background: m.bg, color: m.accent }}>{m.icon}</span>
                <span className="db-stat__num" style={{ color: m.text }}>{count}</span>
            </div>
            <span className="db-stat__label">{m.label}</span>
            <div className="db-stat__bar" style={{ background: m.accent }} />
        </button>
    );
}

function MiniCard({ record, index }: { record: RiskResult; index: number }) {
    const level = val(record.risk_level) || 'low';
    const m = RISK_META[level] ?? RISK_META.low;
    const score = parseInt(val(record.risk_score) || '0', 10);
    const name = resultName(record);
    const at = disp(record.analyzed_at) || '';
    return (
        <button className="db-mini" style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
            onClick={() => navigate('detail', { id: record.sys_id }, name)}>
            <div className="db-mini__stripe" style={{ background: m.accent }} />
            <div className="db-mini__body">
                <span className="db-mini__badge" style={{ background: m.bg, color: m.text }}>
                    {level === 'high' && <span className="db-mini__pulse" style={{ background: m.accent }} />}
                    {m.label.split(' ')[0]}
                </span>
                <span className="db-mini__name">{name}</span>
                {at && <span className="db-mini__time">{at}</span>}
            </div>
            <div className="db-mini__right">
                <span className="db-mini__score" style={{ color: m.text }}>{score}</span>
                <span className="db-mini__pts" style={{ color: m.accent }}>pts</span>
            </div>
            <span className="db-mini__arrow">›</span>
        </button>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState<RiskStats>({ low: 0, medium: 0, high: 0, total: 0 });
    const [recent, setRecent] = useState<RiskResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [usingMock, setUsingMock] = useState(false);

    useEffect(() => {
        Promise.all([fetchRiskStats(), fetchRiskResults(null, 20)])
            .then(([s, r]) => {
                if (s.total === 0 && r.length === 0) {
                    setStats(MOCK_STATS);
                    setRecent(MOCK_RESULTS);
                    setUsingMock(true);
                } else {
                    setStats(s);
                    setRecent(r);
                }
            })
            .catch(() => {
                setStats(MOCK_STATS);
                setRecent(MOCK_RESULTS);
                setUsingMock(true);
            })
            .finally(() => setLoading(false));
    }, []);

    const pct = (n: number) => stats.total > 0 ? Math.round(n / stats.total * 100) : 0;

    const trendData = [...recent].reverse().map(r => ({
        score: parseInt(val(r.risk_score) || '0', 10),
        level: val(r.risk_level) || 'low',
        name: resultName(r),
    }));

    const miniList = recent.slice(0, 6);

    return (
        <div className="db">
            {/* Hero header */}
            <div className="db__hero">
                <div className="db__hero-content">
                    <div className="db__hero-text">
                        <h1 className="db__title">
                            Risk Dashboard
                            {usingMock && <span className="db__demo-tag">DEMO DATA</span>}
                        </h1>
                        <p className="db__sub">Analyze Update Sets and classify change risk before deployment</p>
                    </div>
                    {stats.total > 0 && (
                        <div className="db__hero-bar-wrap">
                            <div className="db__hero-dist">
                                {(['high', 'medium', 'low'] as const).map(k => stats[k] > 0 && (
                                    <div key={k} className="db__hero-seg"
                                        style={{ flex: stats[k], background: RISK_META[k].accent }}
                                        title={`${RISK_META[k].label}: ${pct(stats[k])}%`} />
                                ))}
                            </div>
                            <div className="db__hero-dist-labels">
                                {(['high', 'medium', 'low'] as const).map(k => stats[k] > 0 && (
                                    <span key={k} style={{ color: RISK_META[k].accent, flex: stats[k], textAlign: 'center', fontSize: 10, fontWeight: 700, minWidth: 0 }}>
                                        {pct(stats[k])}%
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stat cards */}
            <div className="db__stats">
                {(['total', 'high', 'medium', 'low'] as const).map((k, i) => (
                    <StatCard key={k} metaKey={k} value={stats[k]} index={i}
                        onClick={() => k === 'total' ? navigate('list') : navigate('list', { filter: k })} />
                ))}
            </div>

            {/* Trend chart — full width */}
            {(recent.length > 0 || !loading) && (
                <div className="db__card db__trend-card">
                    <div className="db__card-header">
                        <div>
                            <h2 className="db__card-title" style={{ marginBottom: 2 }}>Score Trend</h2>
                            <p className="db__card-sub">Last {trendData.length} analys{trendData.length === 1 ? 'is' : 'es'} · oldest → newest · threshold lines at 30 (Medium) and 65 (High)</p>
                        </div>
                        <button className="db__view-all" onClick={() => navigate('list')}>View all →</button>
                    </div>
                    <div className="db__trend-body">
                        <RiskTrendChart data={trendData} />
                    </div>
                </div>
            )}

            {/* Main grid */}
            <div className="db__grid">
                {/* Distribution */}
                <div className="db__card">
                    <h2 className="db__card-title">Risk Distribution</h2>
                    <div className="db__donut-wrap">
                        <DonutChart high={stats.high} medium={stats.medium} low={stats.low} />
                    </div>
                    <div className="db__legend">
                        {(['high', 'medium', 'low'] as const).map(k => (
                            <button key={k} className="db__leg-item" onClick={() => navigate('list', { filter: k })}>
                                <span className="db__leg-dot" style={{ background: RISK_META[k].accent }} />
                                <span className="db__leg-label">{RISK_META[k].label.split(' ')[0]}</span>
                                <div className="db__leg-track">
                                    <div className="db__leg-fill" style={{ width: `${pct(stats[k])}%`, background: RISK_META[k].accent }} />
                                </div>
                                <span className="db__leg-count">{stats[k]}</span>
                                <span className="db__leg-pct">{pct(stats[k])}%</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent analyses */}
                <div className="db__card">
                    <div className="db__card-header">
                        <h2 className="db__card-title">Recent Analyses</h2>
                        <button className="db__view-all" onClick={() => navigate('list')}>View all →</button>
                    </div>
                    {loading && <div className="db__loading"><div className="db__spinner" /></div>}
                    {!loading && miniList.length === 0 && (
                        <div className="db__empty">
                            <div className="db__empty-icon">🔍</div>
                            <p>No analyses yet.</p>
                            <p>Open an Update Set and click <strong>"Analyze Risk"</strong>.</p>
                        </div>
                    )}
                    {!loading && miniList.length > 0 && (
                        <div className="db__mini-list">
                            {miniList.map((r, i) => <MiniCard key={r.sys_id} record={r} index={i} />)}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
