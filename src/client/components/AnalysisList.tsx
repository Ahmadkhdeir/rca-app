import React, { useEffect, useState } from 'react';
import { fetchRiskResults, type RiskResult } from '../services/api';
import { navigate } from '../utils/navigation';
import AnalysisCard from './AnalysisCard';

const FILTERS = [
    { key: null,     label: 'All' },
    { key: 'high',   label: '🔴 High' },
    { key: 'medium', label: '🟡 Medium' },
    { key: 'low',    label: '🟢 Low' },
] as const;

interface Props { initialFilter: string | null; }

export default function AnalysisList({ initialFilter }: Props) {
    const [filter, setFilter] = useState<string | null>(initialFilter);
    const [results, setResults] = useState<RiskResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);
        fetchRiskResults(filter)
            .then(setResults)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [filter]);

    function handleFilter(k: string | null) {
        setFilter(k);
        navigate('list', k ? { filter: k } : {});
    }

    return (
        <div style={{ animation: 'fadeUp .3s ease' }}>
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; } }`}</style>

            {/* Header + filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>All Analyses</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                        {loading ? 'Loading…' : `${results.length} result${results.length !== 1 ? 's' : ''}${filter ? ` · ${filter} risk` : ''}`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {FILTERS.map(({ key, label }) => (
                        <button
                            key={String(key)}
                            onClick={() => handleFilter(key)}
                            style={{
                                padding: '7px 16px',
                                borderRadius: 20,
                                border: '1.5px solid',
                                borderColor: filter === key ? '#6366f1' : '#e2e8f0',
                                background: filter === key ? '#6366f1' : '#fff',
                                color: filter === key ? '#fff' : '#374151',
                                fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'all .15s',
                            }}
                        >{label}</button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'spin .8s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ padding: 24, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#991b1b', textAlign: 'center', fontSize: 14 }}>
                    Failed to load analyses.
                </div>
            )}

            {/* Empty */}
            {!loading && !error && results.length === 0 && (
                <div style={{ padding: '56px 24px', background: '#fff', border: '2px dashed #e2e8f0', borderRadius: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                    <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#374151' }}>
                        No analyses found{filter ? ` for ${filter} risk` : ''}.
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                        Open an Update Set and click <strong>"Analyze Risk"</strong> to get started.
                    </p>
                </div>
            )}

            {/* Cards */}
            {!loading && !error && results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {results.map((r, i) => (
                        <div key={r.sys_id} style={{ animationDelay: `${i * 40}ms` }}>
                            <AnalysisCard
                                record={r}
                                onClick={() => navigate('detail', { id: r.sys_id }, `${r.sys_id} Analysis`)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
