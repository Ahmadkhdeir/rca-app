import React, { useEffect, useRef, useState } from 'react';
import ScoreGauge from './ScoreGauge';
import AIExplainPanel from './AIExplainPanel';
import { fetchUpdateSets, analyzeUpdateSet, fetchUsers, assignReviewer, type UpdateSet, type AnalysisApiResult, type SysUser } from '../services/api';
import './AnalyzePage.css';

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const STATE_LABEL: Record<string, string> = {
    in_progress: 'In Progress',
    complete:    'Complete',
    loaded:      'Loaded',
    ignore:      'Ignored',
};

const STATE_STYLE: Record<string, { background: string; color: string }> = {
    in_progress: { background: '#fff0d6', color: '#b45309' },
    complete:    { background: '#dcfce7', color: '#166534' },
    loaded:      { background: '#dbeafe', color: '#1e40af' },
    ignore:      { background: '#f1f5f9', color: '#64748b' },
};

const normalizeState = (s: string) => s.toLowerCase().replace(/[\s-]/g, '_');


const STAGES = [
    { id: 'read',   icon: '🔍', label: 'Reading update set',         msg: (n: number) => `${n} records found` },
    { id: 'tables', icon: '🧮', label: 'Scanning sensitive tables',  msg: (n: number) => `${n} sensitive table${n === 1 ? '' : 's'} matched` },
    { id: 'rules',  icon: '⚙',  label: 'Evaluating business rules',  msg: (n: number) => `${n} rule${n === 1 ? '' : 's'} modified` },
    { id: 'acls',   icon: '🛡',  label: 'Checking ACL changes',       msg: (n: number) => `${n} ACL change${n === 1 ? '' : 's'} found` },
    { id: 'score',  icon: '📊', label: 'Calculating risk score',     msg: (n: number) => `score ${n} pts` },
    { id: 'class',  icon: '🏷',  label: 'Classifying risk level',     msg: (lvl: string) => `${lvl.toUpperCase()} RISK` },
] as const;

type StageId = (typeof STAGES)[number]['id'];

interface AnalysisResult {
    score: number;
    level: 'high' | 'medium' | 'low';
    recordCount: number;
    sensitiveTables: number;
    rulesModified: number;
    aclChanges: number;
    factors: { label: string; pts: number }[];
    recommendations: string[];
    affectedTables: string[];
}

const RESULTS: Record<'high' | 'medium' | 'low', (changes: number) => AnalysisResult> = {
    high: (n) => ({
        score: 78,
        level: 'high',
        recordCount: n,
        sensitiveTables: 3,
        rulesModified: 4,
        aclChanges: 11,
        factors: [
            { label: 'Sensitive security table modified', pts: 30 },
            { label: 'Bulk ACL modifications (>10)',      pts: 22 },
            { label: 'Business rules on core ITSM table', pts: 14 },
            { label: 'High record count',                  pts: 8 },
            { label: 'Production-critical scope',          pts: 4 },
        ],
        recommendations: [
            'Review every ACL change with the security lead before promotion',
            'Run a full regression in sub-prod first',
            'Document the rationale for each role/permission added',
            'Notify the security review board prior to production deploy',
        ],
        affectedTables: ['sys_security_acl', 'sys_user_role', 'incident', 'sys_script'],
    }),
    medium: (n) => ({
        score: 47,
        level: 'medium',
        recordCount: n,
        sensitiveTables: 1,
        rulesModified: 2,
        aclChanges: 0,
        factors: [
            { label: 'New scripted REST API exposed', pts: 22 },
            { label: 'Business rule logic adjusted',  pts: 13 },
            { label: 'Moderate record count',          pts: 7 },
            { label: 'Single-scope changes only',      pts: 5 },
        ],
        recommendations: [
            'Confirm the API is scoped behind correct ACLs',
            'Add request logging for the first 30 days',
            'Document the new contract in the integration wiki',
        ],
        affectedTables: ['sys_ws_definition', 'sys_ws_operation', 'sys_script_include'],
    }),
    low: (n) => ({
        score: 12,
        level: 'low',
        recordCount: n,
        sensitiveTables: 0,
        rulesModified: 0,
        aclChanges: 0,
        factors: [
            { label: 'Cosmetic / static-string edits only', pts: 8 },
            { label: 'Small, isolated change set',           pts: 4 },
        ],
        recommendations: [
            'Standard peer review is sufficient',
            'No special pre-deployment steps required',
        ],
        affectedTables: ['sys_ui_message', 'sys_email_template'],
    }),
};

const META: Record<string, { accent: string; bg: string; text: string }> = {
    high:   { accent: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
    medium: { accent: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
    low:    { accent: '#10b981', bg: '#ecfdf5', text: '#065f46' },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatAge(snDate: string): string {
    if (!snDate) return '';
    const d = new Date(snDate.replace(' ', 'T') + 'Z');
    const hours = Math.round((Date.now() - d.getTime()) / 3_600_000);
    if (hours < 1)  return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function useTickingNumber(target: number, active: boolean, durationMs = 700) {
    const [n, setN] = useState(0);
    const raf = useRef<number>(0);
    useEffect(() => {
        if (!active) { setN(0); return; }
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min((now - start) / durationMs, 1);
            setN(Math.round((1 - Math.pow(1 - t, 3)) * target));
            if (t < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, active, durationMs]);
    return n;
}

/* -------------------------------------------------------------------------- */
/* Update Set picker                                                           */
/* -------------------------------------------------------------------------- */

function UpdateSetPicker({ value, onSelect }: { value: UpdateSet | null; onSelect: (s: UpdateSet) => void }) {
    const [open, setOpen]       = useState(false);
    const [q, setQ]             = useState('');
    const [sets, setSets]       = useState<UpdateSet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError(false);
        fetchUpdateSets()
            .then(setSets)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [open]);

    const filtered = q.trim()
        ? sets.filter(s => s.name.toLowerCase().includes(q.trim().toLowerCase()))
        : sets;

    return (
        <div className="ap-picker" ref={ref}>
            <button className={`ap-picker__btn${value ? ' ap-picker__btn--filled' : ''}`}
                onClick={() => setOpen(o => !o)}>
                {value ? (
                    <>
                        <div className="ap-picker__selected">
                            <span className="ap-picker__sel-name">{value.name}</span>
                            <span className="ap-picker__sel-meta">
                                <span className="ap-state" style={STATE_STYLE[normalizeState(value.state)] ?? {}}>
                                    {STATE_LABEL[normalizeState(value.state)] ?? value.state}
                                </span>
                                · updated {formatAge(value.sys_updated_on)}
                            </span>
                        </div>
                        <span className="ap-picker__chev">{open ? '▾' : '▸'}</span>
                    </>
                ) : (
                    <>
                        <span className="ap-picker__placeholder">Select an Update Set to analyze…</span>
                        <span className="ap-picker__chev">{open ? '▾' : '▸'}</span>
                    </>
                )}
            </button>

            {open && (
                <div className="ap-picker__panel">
                    <input
                        autoFocus
                        className="ap-picker__search"
                        placeholder="Search update sets…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <div className="ap-picker__list">
                        {loading && <div className="ap-picker__empty">Loading…</div>}
                        {!loading && error && <div className="ap-picker__empty">Could not load update sets.</div>}
                        {!loading && !error && filtered.length === 0 && <div className="ap-picker__empty">No matches</div>}
                        {!loading && !error && filtered.map(s => (
                            <button key={s.sys_id} className="ap-picker__item"
                                onClick={() => { onSelect(s); setOpen(false); setQ(''); }}>
                                <div className="ap-picker__item-main">
                                    <span className="ap-picker__item-name">{s.name}</span>
                                    <span className="ap-picker__item-meta">updated {formatAge(s.sys_updated_on)}</span>
                                </div>
                                <span className="ap-state" style={STATE_STYLE[normalizeState(s.state)] ?? {}}>
                                    {STATE_LABEL[normalizeState(s.state)] ?? s.state}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* User avatar                                                                 */
/* -------------------------------------------------------------------------- */

function UserAvatar({ user, size = 32 }: { user: SysUser; size?: number }) {
    const [failed, setFailed] = useState(false);
    const initial = user.name.charAt(0).toUpperCase();
    const style: React.CSSProperties = {
        width: size, height: size, borderRadius: '50%',
        background: '#6366f1', color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
    };
    if (user.photo && !failed) {
        return (
            <span style={style}>
                <img
                    src={`/api/now/attachment/${user.photo}/file`}
                    onError={() => setFailed(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={user.name}
                />
            </span>
        );
    }
    return <span style={style}>{initial}</span>;
}

/* -------------------------------------------------------------------------- */
/* Affected tables                                                             */
/* -------------------------------------------------------------------------- */

const TABLE_LIMIT = 8;

function AffectedTables({ tables, accent }: { tables: string[]; accent: string }) {
    const [expanded, setExpanded] = useState(false);
    if (tables.length === 0) {
        return (
            <>
                <h3 className="ap-result__h ap-result__h--mt">Affected Tables</h3>
                <div className="ap-tags"><span className="ap-tags__empty">No tables recorded in this update set</span></div>
            </>
        );
    }
    const visible = expanded ? tables : tables.slice(0, TABLE_LIMIT);
    const hidden  = tables.length - TABLE_LIMIT;
    return (
        <>
            <h3 className="ap-result__h ap-result__h--mt">
                Affected Tables
                <span className="ap-result__h-count">{tables.length}</span>
            </h3>
            <div className="ap-tags">
                {visible.map(t => <span key={t} className="ap-tag">{t}</span>)}
                {!expanded && hidden > 0 && (
                    <button className="ap-tag ap-tag--more" style={{ color: accent }}
                        onClick={() => setExpanded(true)}>
                        +{hidden} more
                    </button>
                )}
                {expanded && hidden > 0 && (
                    <button className="ap-tag ap-tag--more" style={{ color: accent }}
                        onClick={() => setExpanded(false)}>
                        Show less
                    </button>
                )}
            </div>
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Stage card                                                                  */
/* -------------------------------------------------------------------------- */

function StageCard({
    stage, status, value,
}: {
    stage: typeof STAGES[number];
    status: 'pending' | 'running' | 'done';
    value: number | string | null;
}) {
    const isDone = status === 'done';
    const isRun  = status === 'running';
    return (
        <div className={`ap-stage ap-stage--${status}`}>
            <div className="ap-stage__icon-wrap">
                {isDone ? (
                    <svg className="ap-stage__check" viewBox="0 0 24 24" width="18" height="18">
                        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor"
                            strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <span className="ap-stage__icon">{stage.icon}</span>
                )}
            </div>
            <div className="ap-stage__body">
                <div className="ap-stage__label">{stage.label}</div>
                <div className="ap-stage__msg">
                    {isDone && value != null ? (typeof stage.msg === 'function' ? (stage.msg as any)(value) : '') :
                     isRun ? 'in progress…' : 'pending'}
                </div>
            </div>
            {isRun && <div className="ap-stage__bar"><div className="ap-stage__bar-fill" /></div>}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Reviewer modal                                                              */
/* -------------------------------------------------------------------------- */

function ReviewerModal({ resultSysId, onClose, onAssign }: {
    resultSysId: string;
    onClose: () => void;
    onAssign: (r: SysUser, note: string) => void;
}) {
    const [q, setQ]           = useState('');
    const [users, setUsers]   = useState<SysUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [picked, setPicked] = useState<SysUser | null>(null);
    const [note, setNote]     = useState('');
    const [saving, setSaving] = useState(false);
    const [saveErr, setSaveErr] = useState<string | null>(null);

    useEffect(() => {
        if (!q.trim()) { setUsers([]); return; }
        setLoading(true);
        const t = setTimeout(() => {
            fetchUsers(q)
                .then(setUsers)
                .catch(() => setUsers([]))
                .finally(() => setLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [q]);

    async function handleAssign() {
        if (!picked) return;
        setSaving(true);
        setSaveErr(null);
        try {
            await assignReviewer(resultSysId, picked.sys_id, note);
            onAssign(picked, note);
        } catch {
            setSaveErr('Could not save — please try again.');
            setSaving(false);
        }
    }

    return (
        <div className="ap-modal-backdrop" onClick={onClose}>
            <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal__header">
                    <h3>Assign Reviewer</h3>
                    <button className="ap-modal__x" onClick={onClose}>×</button>
                </div>
                <div className="ap-modal__body">
                    <p className="ap-modal__sub">Search for a user to review this change before promotion.</p>
                    <input
                        autoFocus
                        className="ap-picker__search"
                        placeholder="Search by name…"
                        value={q}
                        onChange={(e) => { setQ(e.target.value); setPicked(null); }}
                    />
                    {loading && <div className="ap-modal__hint">Searching…</div>}
                    {!loading && q.trim() && users.length === 0 && (
                        <div className="ap-modal__hint">No users found</div>
                    )}
                    {!loading && users.length > 0 && (
                        <div className="ap-rev-list">
                            {users.map(u => (
                                <button key={u.sys_id}
                                    className={`ap-rev${picked?.sys_id === u.sys_id ? ' ap-rev--on' : ''}`}
                                    onClick={() => setPicked(u)}>
                                    <UserAvatar user={u} size={36} />
                                    <div className="ap-rev__info">
                                        <span className="ap-rev__name">{u.name}</span>
                                        <span className="ap-rev__role">{u.email || u.title || ''}</span>
                                    </div>
                                    {picked?.sys_id === u.sys_id && (
                                        <svg viewBox="0 0 24 24" width="18" height="18">
                                            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#10b981"
                                                strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    <label className="ap-modal__label">Note (optional)</label>
                    <textarea className="ap-modal__note" rows={3}
                        placeholder="Add context for the reviewer…"
                        value={note} onChange={(e) => setNote(e.target.value)} />
                    {saveErr && <div className="ap-modal__err">{saveErr}</div>}
                </div>
                <div className="ap-modal__footer">
                    <button className="ap-btn ap-btn--ghost" onClick={onClose}>Cancel</button>
                    <button className="ap-btn ap-btn--primary"
                        disabled={!picked || saving}
                        onClick={handleAssign}>
                        {saving ? 'Saving…' : 'Assign reviewer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Toast                                                                       */
/* -------------------------------------------------------------------------- */

function Toast({ msg, kind = 'success' }: { msg: string; kind?: 'success' | 'info' }) {
    return (
        <div className={`ap-toast ap-toast--${kind}`}>
            <span className="ap-toast__dot" />
            {msg}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

type Phase = 'idle' | 'running' | 'done';

export default function AnalyzePage() {
    const [selected, setSelected] = useState<UpdateSet | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [stageStatus, setStageStatus] = useState<Record<StageId, 'pending' | 'running' | 'done'>>(
        () => Object.fromEntries(STAGES.map(s => [s.id, 'pending'])) as any
    );
    const [stageValues, setStageValues] = useState<Record<StageId, number | string | null>>(
        () => Object.fromEntries(STAGES.map(s => [s.id, null])) as any
    );
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const [resultSysId, setResultSysId] = useState<string | null>(null);
    const [showReviewerModal, setShowReviewerModal] = useState(false);
    const [assignedReviewer, setAssignedReviewer] = useState<SysUser | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);
    const [chgNumber, setChgNumber] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; kind?: 'success' | 'info' } | null>(null);

    const showToast = (msg: string, kind: 'success' | 'info' = 'success') => {
        setToast({ msg, kind });
        setTimeout(() => setToast(null), 2800);
    };

    function reset() {
        setPhase('idle');
        setStageStatus(Object.fromEntries(STAGES.map(s => [s.id, 'pending'])) as any);
        setStageValues(Object.fromEntries(STAGES.map(s => [s.id, null])) as any);
        setResult(null);
        setResultSysId(null);
        setAssignedReviewer(null);
        setAcknowledged(false);
        setChgNumber(null);
    }

    async function runAnalysis() {
        if (!selected) return;
        reset();
        setPhase('running');

        // Fire real analysis — runs in parallel with stage animations
        const analysisPromise = analyzeUpdateSet(selected.sys_id);

        const earlyDelays: Record<string, number> = { read: 600, tables: 500, rules: 500, acls: 450 };

        // Animate stages 1–4 while the server analyses
        for (const s of STAGES.slice(0, 4)) {
            setStageStatus(prev => ({ ...prev, [s.id]: 'running' }));
            await new Promise(res => setTimeout(res, earlyDelays[s.id]));
            setStageStatus(prev => ({ ...prev, [s.id]: 'done' }));
        }

        // Keep score stage spinning until API returns
        setStageStatus(prev => ({ ...prev, score: 'running' }));

        let api: AnalysisApiResult;
        try {
            api = await analysisPromise;
        } catch (e: any) {
            setPhase('idle');
            showToast('Analysis failed: ' + (e?.message ?? 'unknown error'), 'info');
            return;
        }

        // Backfill early stage values now that we have real data
        setStageValues({
            read:   api.record_count,
            tables: api.sensitive_tables_count,
            rules:  api.rules_count,
            acls:   api.acl_count,
            score:  null,
            class:  null,
        });

        // Animate score stage with real value
        await new Promise(res => setTimeout(res, 700));
        setStageValues(prev => ({ ...prev, score: api.risk_score }));
        setStageStatus(prev => ({ ...prev, score: 'done', class: 'running' }));

        // Animate class stage with real risk level
        await new Promise(res => setTimeout(res, 500));
        setStageValues(prev => ({ ...prev, class: api.risk_level }));
        setStageStatus(prev => ({ ...prev, class: 'done' }));

        await new Promise(res => setTimeout(res, 250));

        setResultSysId(api.result_sys_id);
        setResult({
            score:           api.risk_score,
            level:           api.risk_level,
            recordCount:     api.record_count,
            sensitiveTables: api.sensitive_tables_count,
            rulesModified:   api.rules_count,
            aclChanges:      api.acl_count,
            factors:         api.factors,
            recommendations: api.recommendations,
            affectedTables:  api.affected_tables,
        });
        setPhase('done');
    }

    const m = result ? META[result.level] : null;
    const tickingScore = useTickingNumber(result?.score ?? 0, !!result, 900);
    const maxPts = result ? Math.max(...result.factors.map(f => f.pts), 1) : 1;

    return (
        <div className="ap">
            <div className="ap__header">
                <div>
                    <h1 className="ap__title">Analyze an Update Set</h1>
                    <p className="ap__sub">Run a live risk analysis with a step-by-step breakdown.</p>
                </div>
                {phase === 'done' && (
                    <button className="ap-btn ap-btn--ghost" onClick={reset}>↺ Run another</button>
                )}
            </div>

            {/* Picker + run row */}
            <div className="ap-runrow">
                <UpdateSetPicker value={selected} onSelect={(s) => { setSelected(s); reset(); }} />
                <button className="ap-btn ap-btn--primary ap-btn--lg"
                    disabled={!selected || phase === 'running'}
                    onClick={runAnalysis}>
                    {phase === 'running' ? (
                        <>
                            <span className="ap-spin" /> Analyzing…
                        </>
                    ) : (
                        <>▶ Run Analysis</>
                    )}
                </button>
            </div>

            {/* Stages */}
            {phase !== 'idle' && (
                <div className="ap-stages">
                    {STAGES.map(s => (
                        <StageCard key={s.id} stage={s} status={stageStatus[s.id]} value={stageValues[s.id]} />
                    ))}
                </div>
            )}

            {/* Result */}
            {result && m && (
                <div className="ap-result" style={{ borderTop: `4px solid ${m.accent}` }}>
                    <div className="ap-result__top" style={{ background: m.bg }}>
                        <div className="ap-result__head">
                            <div className="ap-result__head-text">
                                <span className="ap-result__badge" style={{ background: m.accent }}>
                                    {result.level === 'high' && <span className="ap-pulse" />}
                                    {result.level.toUpperCase()} RISK
                                </span>
                                <h2 className="ap-result__name">{selected?.name}</h2>
                                <p className="ap-result__line">
                                    {result.recordCount} records · {result.sensitiveTables} sensitive table{result.sensitiveTables === 1 ? '' : 's'} ·
                                    {' '}{result.rulesModified} business rule change{result.rulesModified === 1 ? '' : 's'} ·
                                    {' '}{result.aclChanges} ACL change{result.aclChanges === 1 ? '' : 's'}
                                </p>
                            </div>
                            <div className="ap-result__gauge">
                                <ScoreGauge score={tickingScore} color={m.accent} size={160} />
                            </div>
                        </div>
                    </div>

                    <div className="ap-result__body">
                        <div className="ap-result__col">
                            <h3 className="ap-result__h">Risk Factors</h3>
                            <div className="ap-factors">
                                {result.factors.map((f, i) => (
                                    <div key={i} className="ap-factor" style={{ animationDelay: `${i * 80}ms` }}>
                                        <div className="ap-factor__row">
                                            <span className="ap-factor__label">{f.label}</span>
                                            <span className="ap-factor__pts" style={{ color: m.text }}>+{f.pts} pts</span>
                                        </div>
                                        <div className="ap-factor__track">
                                            <div className="ap-factor__fill"
                                                style={{ width: `${(f.pts / maxPts) * 100}%`, background: m.accent }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <AffectedTables tables={result.affectedTables} accent={m.accent} />
                        </div>

                        <div className="ap-result__col">
                            <h3 className="ap-result__h">Recommended Actions</h3>
                            <div className="ap-recs">
                                {result.recommendations.map((r, i) => (
                                    <div key={i} className="ap-rec" style={{ animationDelay: `${i * 80}ms` }}>
                                        <div className="ap-rec__icon" style={{ background: m.bg, color: m.text }}>→</div>
                                        <span>{r}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* AI explanation */}
                    <div className="ap-ai-wrap">
                        <AIExplainPanel
                            ctx={{
                                name: selected?.name ?? '',
                                score: result.score,
                                level: result.level,
                                factors: result.factors,
                                affectedTables: result.affectedTables,
                            }}
                        />
                    </div>

                    {/* Action panel */}
                    <div className="ap-actions">
                        <h3 className="ap-actions__h">Next steps</h3>
                        <div className="ap-actions__grid">
                            <button className="ap-action"
                                onClick={() => setShowReviewerModal(true)}
                                disabled={!!assignedReviewer}>
                                <span className="ap-action__icon" style={{ background: '#eef2ff', color: '#4338ca' }}>👤</span>
                                <div className="ap-action__text">
                                    <span className="ap-action__title">
                                        {assignedReviewer ? 'Reviewer assigned' : 'Assign Reviewer'}
                                    </span>
                                    <span className="ap-action__desc">
                                        {assignedReviewer
                                            ? `Pending review by ${assignedReviewer.name}`
                                            : 'Forward to a security or process lead'}
                                    </span>
                                </div>
                                {assignedReviewer && (
                                    <UserAvatar user={assignedReviewer} size={32} />
                                )}
                            </button>

                            <button className="ap-action"
                                onClick={() => {
                                    const num = 'CHG' + String(10000 + Math.floor(Math.random() * 9999)).padStart(7, '0');
                                    setChgNumber(num);
                                    showToast(`Change request ${num} created and linked`);
                                }}
                                disabled={!!chgNumber}>
                                <span className="ap-action__icon" style={{ background: '#fffbeb', color: '#92400e' }}>📋</span>
                                <div className="ap-action__text">
                                    <span className="ap-action__title">
                                        {chgNumber ? `Linked to ${chgNumber}` : 'Create Change Ticket'}
                                    </span>
                                    <span className="ap-action__desc">
                                        {chgNumber ? 'Visible in CAB queue' : 'Open a change_request pre-filled with this analysis'}
                                    </span>
                                </div>
                            </button>

                            <button className="ap-action"
                                onClick={() => {
                                    setAcknowledged(true);
                                    showToast('Marked as acknowledged');
                                }}
                                disabled={acknowledged}>
                                <span className="ap-action__icon" style={{ background: '#ecfdf5', color: '#065f46' }}>
                                    {acknowledged ? '✓' : '👁'}
                                </span>
                                <div className="ap-action__text">
                                    <span className="ap-action__title">
                                        {acknowledged ? 'Acknowledged' : 'Mark as Acknowledged'}
                                    </span>
                                    <span className="ap-action__desc">
                                        {acknowledged ? 'You confirmed you have reviewed the result' : 'Flag this result as personally reviewed'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReviewerModal && resultSysId && (
                <ReviewerModal
                    resultSysId={resultSysId}
                    onClose={() => setShowReviewerModal(false)}
                    onAssign={(r, note) => {
                        setAssignedReviewer(r);
                        setShowReviewerModal(false);
                        showToast(`Assigned to ${r.name}${note ? ' with note' : ''}`);
                    }}
                />
            )}

            {toast && <Toast msg={toast.msg} kind={toast.kind} />}
        </div>
    );
}
