import React, { useState, useEffect, useRef } from 'react';
import {
    fetchUsers, assignReviewer, updateReviewStatus, clearReviewer,
    val, disp, sysId as getSysId,
    type RiskResult, type SysUser,
} from '../services/api';
import './ReviewerPanel.css';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    not_assigned:   { label: 'Not Assigned',   color: '#64748b', bg: '#f1f5f9' },
    pending_review: { label: 'Pending Review',  color: '#d97706', bg: '#fffbeb' },
    approved:       { label: 'Approved',        color: '#059669', bg: '#ecfdf5' },
    rejected:       { label: 'Rejected',        color: '#dc2626', bg: '#fef2f2' },
};

interface Props {
    record: RiskResult;
    onUpdated: (patch: Partial<RiskResult>) => void;
}

export default function ReviewerPanel({ record, onUpdated }: Props) {
    const currentUserId: string = (window as any).g_user_id ?? '';

    const reviewerRef  = val(record.reviewer);
    const reviewerName = disp(record.reviewer);
    const note         = val(record.reviewer_note);
    const status       = val(record.review_status) || 'not_assigned';
    const meta         = STATUS_META[status] ?? STATUS_META.not_assigned;
    const isAssigned   = status !== 'not_assigned' && !!reviewerRef;
    const isReviewer   = isAssigned && reviewerRef === currentUserId;
    const resultId     = getSysId(record);

    // Assignment form state
    const [assigning, setAssigning]     = useState(false);
    const [query, setQuery]             = useState('');
    const [users, setUsers]             = useState<SysUser[]>([]);
    const [selected, setSelected]       = useState<SysUser | null>(null);
    const [noteText, setNoteText]       = useState('');
    const [searching, setSearching]     = useState(false);
    const [saving, setSaving]           = useState(false);
    const [deciding, setDeciding]       = useState(false);
    const [error, setError]             = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (!query.trim()) { setUsers([]); return; }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearching(true);
            fetchUsers(query).then(setUsers).finally(() => setSearching(false));
        }, 280);
    }, [query]);

    async function handleAssign() {
        if (!selected) return;
        setSaving(true);
        setError('');
        try {
            await assignReviewer(resultId, selected.sys_id, noteText.trim());
            onUpdated({
                reviewer:      { value: selected.sys_id, display_value: selected.name },
                reviewer_note: { value: noteText.trim(), display_value: noteText.trim() },
                review_status: { value: 'pending_review', display_value: 'Pending Review' },
            });
            setAssigning(false);
            setQuery('');
            setSelected(null);
            setNoteText('');
        } catch {
            setError('Failed to assign reviewer. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDecision(decision: 'approved' | 'rejected') {
        setDeciding(true);
        setError('');
        try {
            await updateReviewStatus(resultId, decision);
            const label = decision === 'approved' ? 'Approved' : 'Rejected';
            onUpdated({ review_status: { value: decision, display_value: label } });
        } catch {
            setError('Failed to update status. Please try again.');
        } finally {
            setDeciding(false);
        }
    }

    async function handleClear() {
        setSaving(true);
        setError('');
        try {
            await clearReviewer(resultId);
            onUpdated({
                reviewer:      { value: '', display_value: '' },
                reviewer_note: { value: '', display_value: '' },
                review_status: { value: 'not_assigned', display_value: 'Not Assigned' },
            });
            setAssigning(false);
        } catch {
            setError('Failed to clear reviewer.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rvp">
            {/* Header */}
            <div className="rvp__header">
                <div className="rvp__header-left">
                    <svg className="rvp__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    <span className="rvp__title">Reviewer</span>
                </div>
                <span className="rvp__status-badge" style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                </span>
            </div>

            {/* Assigned state */}
            {isAssigned && !assigning && (
                <div className="rvp__assigned">
                    <div className="rvp__reviewer-row">
                        <div className="rvp__avatar">{reviewerName.charAt(0).toUpperCase()}</div>
                        <div className="rvp__reviewer-info">
                            <span className="rvp__reviewer-name">{reviewerName}</span>
                            {note && <span className="rvp__reviewer-note">"{note}"</span>}
                        </div>
                    </div>

                    {/* Reviewer decision buttons */}
                    {isReviewer && status === 'pending_review' && (
                        <div className="rvp__decisions">
                            <p className="rvp__decision-prompt">You are the assigned reviewer. Your call:</p>
                            <div className="rvp__decision-btns">
                                <button className="rvp__btn rvp__btn--approve" onClick={() => handleDecision('approved')} disabled={deciding}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Approve
                                </button>
                                <button className="rvp__btn rvp__btn--reject" onClick={() => handleDecision('rejected')} disabled={deciding}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    Reject
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Re-assign / clear */}
                    <div className="rvp__actions">
                        <button className="rvp__link-btn" onClick={() => { setAssigning(true); setQuery(''); setSelected(null); setNoteText(note); }}>
                            Re-assign
                        </button>
                        <button className="rvp__link-btn rvp__link-btn--danger" onClick={handleClear} disabled={saving}>
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Not assigned — show assign button */}
            {!isAssigned && !assigning && (
                <div className="rvp__empty">
                    <p className="rvp__empty-text">No reviewer assigned yet.</p>
                    <button className="rvp__btn rvp__btn--primary" onClick={() => setAssigning(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Assign Reviewer
                    </button>
                </div>
            )}

            {/* Assignment form */}
            {assigning && (
                <div className="rvp__form">
                    {/* User search */}
                    <div className="rvp__field">
                        <label className="rvp__label">Search user</label>
                        <div className="rvp__search-wrap">
                            <input
                                className="rvp__input"
                                type="text"
                                placeholder="Type a name…"
                                value={selected ? selected.name : query}
                                onChange={e => { setSelected(null); setQuery(e.target.value); }}
                                autoFocus
                            />
                            {searching && <span className="rvp__spin" />}
                            {selected && (
                                <button className="rvp__clear-sel" onClick={() => { setSelected(null); setQuery(''); }}>×</button>
                            )}
                        </div>

                        {/* Dropdown */}
                        {!selected && users.length > 0 && (
                            <div className="rvp__dropdown">
                                {users.map(u => (
                                    <button key={u.sys_id} className="rvp__dropdown-item" onClick={() => { setSelected(u); setUsers([]); }}>
                                        <span className="rvp__dd-avatar">{u.name.charAt(0).toUpperCase()}</span>
                                        <span className="rvp__dd-info">
                                            <span className="rvp__dd-name">{u.name}</span>
                                            {u.title && <span className="rvp__dd-title">{u.title}</span>}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div className="rvp__field">
                        <label className="rvp__label">Note <span className="rvp__optional">(optional)</span></label>
                        <textarea
                            className="rvp__textarea"
                            placeholder="e.g. Please review the ACL changes carefully…"
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            rows={2}
                            maxLength={500}
                        />
                    </div>

                    {error && <p className="rvp__error">{error}</p>}

                    <div className="rvp__form-actions">
                        <button className="rvp__btn rvp__btn--primary" onClick={handleAssign} disabled={!selected || saving}>
                            {saving ? 'Assigning…' : 'Assign'}
                        </button>
                        <button className="rvp__btn rvp__btn--ghost" onClick={() => { setAssigning(false); setError(''); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
