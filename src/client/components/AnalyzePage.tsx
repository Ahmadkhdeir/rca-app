import React, { useEffect, useMemo, useRef, useState } from 'react';
import ScoreGauge from './ScoreGauge';
import AIExplainPanel from './AIExplainPanel';
import './AnalyzePage.css';

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

interface MockUpdateSet {
    id: string;
    name: string;
    state: 'in_progress' | 'complete';
    changes: number;
    updatedHoursAgo: number;
    profile: 'high' | 'medium' | 'low';
}

const MOCK_SETS: MockUpdateSet[] = [
    { id: 'us-001', name: 'Bulk ACL update on sys_user_role',          state: 'in_progress', changes: 27, updatedHoursAgo: 2,   profile: 'high' },
    { id: 'us-002', name: 'Incident form rebuild + business rules',    state: 'in_progress', changes: 14, updatedHoursAgo: 5,   profile: 'high' },
    { id: 'us-003', name: 'Catalog Items — Hardware Request bundle',   state: 'in_progress', changes: 9,  updatedHoursAgo: 11,  profile: 'high' },
    { id: 'us-004', name: 'New REST API for asset sync',               state: 'in_progress', changes: 6,  updatedHoursAgo: 22,  profile: 'medium' },
    { id: 'us-005', name: 'Notification template refresh',             state: 'complete',    changes: 11, updatedHoursAgo: 34,  profile: 'medium' },
    { id: 'us-006', name: 'Problem table dictionary additions',        state: 'complete',    changes: 5,  updatedHoursAgo: 50,  profile: 'medium' },
    { id: 'us-007', name: 'CMDB relationship rule tuning',             state: 'complete',    changes: 4,  updatedHoursAgo: 76,  profile: 'medium' },
    { id: 'us-008', name: 'Knowledge base v3 article migration',       state: 'in_progress', changes: 18, updatedHoursAgo: 92,  profile: 'medium' },
    { id: 'us-009', name: 'Field label cleanup on cmdb_ci_server',     state: 'complete',    changes: 3,  updatedHoursAgo: 120, profile: 'low' },
    { id: 'us-010', name: 'Add new choice value to incident state',    state: 'complete',    changes: 2,  updatedHoursAgo: 144, profile: 'low' },
    { id: 'us-011', name: 'Minor copy edits to login page',            state: 'complete',    changes: 2,  updatedHoursAgo: 168, profile: 'low' },
    { id: 'us-012', name: 'Fix typo in welcome email template',        state: 'complete',    changes: 1,  updatedHoursAgo: 200, profile: 'low' },
];

const REVIEWERS = [
    { id: 'u1', name: 'Sarah Chen',    role: 'Security Lead',     initials: 'SC', color: '#ef4444' },
    { id: 'u2', name: 'Marcus Patel',  role: 'Platform Architect', initials: 'MP', color: '#6366f1' },
    { id: 'u3', name: 'Diana Lopez',   role: 'ITSM Process Owner', initials: 'DL', color: '#10b981' },
    { id: 'u4', name: 'Kenji Tanaka',  role: 'Release Manager',    initials: 'KT', color: '#f59e0b' },
    { id: 'u5', name: 'Aisha Hassan',  role: 'CMDB Lead',          initials: 'AH', color: '#8b5cf6' },
];

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

const RESULTS: Record<MockUpdateSet['profile'], (changes: number) => AnalysisResult> = {
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

function formatAge(hours: number): string {
    if (hours < 1)  return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const d = Math.floor(hours / 24);
    return `${d}d ago`;
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

function UpdateSetPicker({ value, onSelect }: { value: MockUpdateSet | null; onSelect: (s: MockUpdateSet) => void }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return MOCK_SETS;
        return MOCK_SETS.filter(s => s.name.toLowerCase().includes(term));
    }, [q]);

    return (
        <div className="ap-picker" ref={ref}>
            <button className={`ap-picker__btn${value ? ' ap-picker__btn--filled' : ''}`}
                onClick={() => setOpen(o => !o)}>
                {value ? (
                    <>
                        <div className="ap-picker__selected">
                            <span className="ap-picker__sel-name">{value.name}</span>
                            <span className="ap-picker__sel-meta">
                                <span className={`ap-state ap-state--${value.state}`}>
                                    {value.state === 'in_progress' ? 'In progress' : 'Complete'}
                                </span>
                                · {value.changes} changes · {formatAge(value.updatedHoursAgo)}
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
                        {filtered.length === 0 && (
                            <div className="ap-picker__empty">No matches</div>
                        )}
                        {filtered.map(s => (
                            <button key={s.id} className="ap-picker__item"
                                onClick={() => { onSelect(s); setOpen(false); setQ(''); }}>
                                <div className="ap-picker__item-main">
                                    <span className="ap-picker__item-name">{s.name}</span>
                                    <span className="ap-picker__item-meta">
                                        {s.changes} changes · updated {formatAge(s.updatedHoursAgo)}
                                    </span>
                                </div>
                                <span className={`ap-state ap-state--${s.state}`}>
                                    {s.state === 'in_progress' ? 'In progress' : 'Complete'}
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

function ReviewerModal({ onClose, onAssign }: { onClose: () => void; onAssign: (r: typeof REVIEWERS[number], note: string) => void }) {
    const [picked, setPicked] = useState<typeof REVIEWERS[number] | null>(null);
    const [note, setNote] = useState('');
    return (
        <div className="ap-modal-backdrop" onClick={onClose}>
            <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal__header">
                    <h3>Assign Reviewer</h3>
                    <button className="ap-modal__x" onClick={onClose}>×</button>
                </div>
                <div className="ap-modal__body">
                    <p className="ap-modal__sub">Select someone to review this high-risk change before promotion.</p>
                    <div className="ap-rev-list">
                        {REVIEWERS.map(r => (
                            <button key={r.id}
                                className={`ap-rev${picked?.id === r.id ? ' ap-rev--on' : ''}`}
                                onClick={() => setPicked(r)}>
                                <span className="ap-rev__avatar" style={{ background: r.color }}>{r.initials}</span>
                                <div className="ap-rev__info">
                                    <span className="ap-rev__name">{r.name}</span>
                                    <span className="ap-rev__role">{r.role}</span>
                                </div>
                                {picked?.id === r.id && (
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#10b981"
                                            strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                    <label className="ap-modal__label">Note (optional)</label>
                    <textarea className="ap-modal__note" rows={3}
                        placeholder="Add context for the reviewer…"
                        value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <div className="ap-modal__footer">
                    <button className="ap-btn ap-btn--ghost" onClick={onClose}>Cancel</button>
                    <button className="ap-btn ap-btn--primary"
                        disabled={!picked}
                        onClick={() => picked && onAssign(picked, note)}>
                        Assign reviewer
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
    const [selected, setSelected] = useState<MockUpdateSet | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [stageStatus, setStageStatus] = useState<Record<StageId, 'pending' | 'running' | 'done'>>(
        () => Object.fromEntries(STAGES.map(s => [s.id, 'pending'])) as any
    );
    const [stageValues, setStageValues] = useState<Record<StageId, number | string | null>>(
        () => Object.fromEntries(STAGES.map(s => [s.id, null])) as any
    );
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const [showReviewerModal, setShowReviewerModal] = useState(false);
    const [assignedReviewer, setAssignedReviewer] = useState<typeof REVIEWERS[number] | null>(null);
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
        setAssignedReviewer(null);
        setAcknowledged(false);
        setChgNumber(null);
    }

    async function runAnalysis() {
        if (!selected) return;
        reset();
        setPhase('running');

        const r = RESULTS[selected.profile](selected.changes);
        const stageValueMap: Record<StageId, number | string> = {
            read:   r.recordCount,
            tables: r.sensitiveTables,
            rules:  r.rulesModified,
            acls:   r.aclChanges,
            score:  r.score,
            class:  r.level,
        };
        const delays: Record<StageId, number> = {
            read: 600, tables: 500, rules: 500, acls: 450, score: 700, class: 500,
        };

        for (const s of STAGES) {
            setStageStatus(prev => ({ ...prev, [s.id]: 'running' }));
            await new Promise(res => setTimeout(res, delays[s.id]));
            setStageValues(prev => ({ ...prev, [s.id]: stageValueMap[s.id] }));
            setStageStatus(prev => ({ ...prev, [s.id]: 'done' }));
        }

        await new Promise(res => setTimeout(res, 250));
        setResult(r);
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

                            <h3 className="ap-result__h ap-result__h--mt">Affected Tables</h3>
                            <div className="ap-tags">
                                {result.affectedTables.map(t => <span key={t} className="ap-tag">{t}</span>)}
                            </div>
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
                                    <span className="ap-action__avatar" style={{ background: assignedReviewer.color }}>
                                        {assignedReviewer.initials}
                                    </span>
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

            {showReviewerModal && (
                <ReviewerModal
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
