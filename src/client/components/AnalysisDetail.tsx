import React, { useEffect, useState } from 'react';
import { fetchRiskResult, val, disp, resultName, type RiskResult } from '../services/api';
import { navigate } from '../utils/navigation';
import { getCachedRecord } from '../utils/recordCache';
import ScoreGauge from './ScoreGauge';
import AIExplainPanel from './AIExplainPanel';
import './AnalysisDetail.css';

const META: Record<string, { accent: string; bg: string; text: string; border: string }> = {
    high:   { accent: '#ef4444', bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    medium: { accent: '#f59e0b', bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
    low:    { accent: '#10b981', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
};

interface Factor { label: string; pts: number; }

function parseFactors(reasons: string): Factor[] {
    return reasons.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('•'))
        .map(l => {
            const text = l.replace(/^•\s*/, '');
            const m = text.match(/^(.*?)\s*\(([+-]\d+)\s*pts?\)$/);
            return m
                ? { label: m[1].trim(), pts: parseInt(m[2], 10) }
                : { label: text, pts: 0 };
        });
}

function parseRecs(recs: string): string[] {
    return recs.split('\n').map(l => l.trim()).filter(Boolean);
}

function FactorBar({ label, pts, maxPts }: { label: string; pts: number; maxPts: number }) {
    const pct = maxPts > 0 ? Math.min(Math.abs(pts) / maxPts * 100, 100) : 0;
    const isNeg = pts < 0;
    return (
        <div className="fbar">
            <div className="fbar__label">{label}</div>
            <div className="fbar__row">
                <div className="fbar__track">
                    <div className="fbar__fill"
                        style={{ width: `${pct}%`, background: isNeg ? '#10b981' : '#ef4444' }} />
                </div>
                <span className="fbar__pts" style={{ color: isNeg ? '#065f46' : '#991b1b' }}>
                    {pts > 0 ? '+' : ''}{pts} pts
                </span>
            </div>
        </div>
    );
}

interface Props { sysId: string; }

export default function AnalysisDetail({ sysId }: Props) {
    const [record, setRecord] = useState<RiskResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const cached = getCachedRecord(sysId);
        if (cached) {
            setRecord(cached);
            setLoading(false);
            return;
        }
        setLoading(true);
        fetchRiskResult(sysId)
            .then(r => { setRecord(r); if (!r) setError(true); })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [sysId]);

    if (loading) return (
        <div className="det__center">
            <div className="det__spinner" />
            <p>Loading analysis…</p>
        </div>
    );

    if (error || !record) return (
        <div className="det__center">
            <button className="det__back-btn" onClick={() => navigate('list')}>← Back</button>
            <p style={{ color: '#94a3b8', margin: '8px 0 4px' }}>Could not load this record.</p>
            <p style={{ color: '#cbd5e1', fontSize: 12 }}>
                The analysis may not be saved yet, or you may not have read access.<br />
                Try running the analysis again from the <button
                    style={{ background: 'none', border: 'none', color: '#2D9EDF', cursor: 'pointer', fontSize: 12, padding: 0, textDecoration: 'underline' }}
                    onClick={() => navigate('analyze')}>Analyze page</button>.
            </p>
        </div>
    );

    const level  = val(record.risk_level) || 'low';
    const score  = parseInt(val(record.risk_score) || '0', 10);
    const m      = META[level] ?? META.low;

    const number     = disp(record.number) || '';
    const updateSet  = resultName(record);
    const recCount   = val(record.record_count) || '0';
    const analyzedBy = disp(record.analyzed_by) || '—';
    const analyzedAt = disp(record.analyzed_at) || '—';
    const rawReasons = (val(record.reasons) || '').replace(/^\[[^\]]+\]\n?/, '');
    const rawRecs    = val(record.recommendations) || '';
    const tables     = (val(record.affected_tables) || '').split(',').map(s => s.trim()).filter(Boolean);

    const factors = parseFactors(rawReasons);
    const recs    = parseRecs(rawRecs);
    const maxPts  = factors.reduce((acc, f) => Math.max(acc, Math.abs(f.pts)), 1);

    // Extract summary lines (non-bullet lines from reasons)
    const summaryLines = rawReasons.split('\n').map(l => l.trim())
        .filter(l => l && !l.startsWith('•') && !l.startsWith('Contributing'));

    return (
        <div className="det">
            {/* Top bar */}
            <div className="det__topbar">
                <button className="det__back" onClick={() => navigate('list')}>
                    ← Back to Analyses
                </button>
                <span className="det__num">{number}</span>
            </div>

            {/* Hero */}
            <div className="det__hero" style={{ background: m.bg, borderBottom: `1px solid ${m.border}` }}>
                <div className="det__hero-bar" style={{ background: m.accent }} />
                <div className="det__hero-inner">
                    <div className="det__hero-text">
                        <div className="det__level" style={{ background: m.accent, color: '#fff' }}>
                            {level === 'high' && <span className="det__level-pulse" />}
                            {level.toUpperCase()} RISK
                        </div>
                        <h1 className="det__title">{updateSet}</h1>
                        <p className="det__meta">Analyzed by <strong>{analyzedBy}</strong> · {analyzedAt}</p>
                        <div className="det__quick-stats">
                            <div className="det__qs"><span className="det__qs-n">{recCount}</span><span className="det__qs-l">Records</span></div>
                            <div className="det__qs-div" />
                            <div className="det__qs"><span className="det__qs-n">{tables.length}</span><span className="det__qs-l">Tables</span></div>
                            <div className="det__qs-div" />
                            <div className="det__qs"><span className="det__qs-n" style={{ color: m.text }}>{factors.length}</span><span className="det__qs-l">Factors</span></div>
                        </div>
                    </div>
                    <div className="det__gauge">
                        <ScoreGauge score={score} color={m.accent} />
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="det__body">
                <div className="det__grid">
                    {/* Left: factors + tables */}
                    <div className="det__col">
                        <div className="det__section">
                            <h2 className="det__sec-title">
                                <span className="det__sec-icon" style={{ background: m.bg, color: m.text }}>⚠</span>
                                Risk Factors
                            </h2>
                            {summaryLines.map((l, i) => (
                                <p key={i} className="det__summary-line">{l}</p>
                            ))}
                            {factors.length === 0 && <p className="det__empty">No contributing factors identified.</p>}
                            <div className="det__factors">
                                {factors.map((f, i) => (
                                    <FactorBar key={i} label={f.label} pts={f.pts} maxPts={maxPts} />
                                ))}
                            </div>
                        </div>

                        <div className="det__section">
                            <h2 className="det__sec-title">
                                <span className="det__sec-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>🗂</span>
                                Affected Tables
                            </h2>
                            {tables.length > 0
                                ? <div className="det__tags">{tables.map(t => <span key={t} className="det__tag">{t}</span>)}</div>
                                : <p className="det__empty">No table data recorded.</p>
                            }
                        </div>
                    </div>

                    {/* Right: recommendations + AI panel */}
                    <div className="det__col">
                        <div className="det__section det__section--recs" style={{ borderLeft: `4px solid ${m.accent}` }}>
                            <h2 className="det__sec-title">
                                <span className="det__sec-icon" style={{ background: m.bg, color: m.text }}>✓</span>
                                Recommended Actions
                            </h2>
                            {recs.length === 0 && <p className="det__empty">No recommendations available.</p>}
                            <div className="det__recs">
                                {recs.map((r, i) => (
                                    <div key={i} className="det__rec">
                                        <div className="det__rec-icon" style={{ background: m.bg, color: m.text }}>→</div>
                                        <span>{r}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <AIExplainPanel
                            ctx={{
                                name: updateSet,
                                score,
                                level: (level === 'high' || level === 'medium' || level === 'low') ? level : 'low',
                                factors: factors.map(f => ({ label: f.label, pts: Math.abs(f.pts) })),
                                affectedTables: tables,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
