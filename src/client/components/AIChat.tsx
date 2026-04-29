import React, { useEffect, useRef, useState } from 'react';
import { getViewState } from '../utils/navigation';
import './AIChat.css';

type Role = 'user' | 'assistant';
interface Msg { id: number; role: Role; text: string; streaming?: boolean; }

const PROMPTS_BY_VIEW: Record<string, string[]> = {
    dashboard: [
        'What is my biggest risk pattern this week?',
        'Which tables are most affected by recent changes?',
        'Compare this week to last week',
        'What should I focus on first?',
    ],
    list: [
        'Show only changes that touch ACLs',
        'Which analyses still need review?',
        'Find similar past analyses',
    ],
    detail: [
        'Why is this change risky?',
        'Draft a change ticket description',
        'Suggest a reviewer',
        'What is the rollback plan?',
    ],
    analyze: [
        'Explain the scoring methodology',
        'What would lower this score?',
        'Recommend next steps',
    ],
};

const CONTEXT_LABEL: Record<string, string> = {
    dashboard: 'Your full risk portfolio',
    list:      'All analyses',
    detail:    'This analysis',
    analyze:   'The current analysis',
};

function generateResponse(prompt: string): string {
    const p = prompt.toLowerCase();

    if (p.includes('biggest') || p.includes('focus') || p.includes('pattern')) {
        return `Looking at your last 12 analyses, the dominant pattern is **ACL and security-table changes**. They're 25% of all analyses but 60% of the high-risk ones.\n\nThree update sets account for most of this week's elevated score:\n• "Bulk ACL update on sys_user_role" (92 pts)\n• "Incident form rebuild + business rules" (78 pts)\n• "Catalog Items — Hardware Request bundle" (71 pts)\n\nMy recommendation: prioritize the ACL bundle for security review before promoting anything else.`;
    }

    if (p.includes('compare') && (p.includes('week') || p.includes('last'))) {
        return `Compared to last week:\n\n• Total analyses: **+33%** (12 vs 9)\n• High-risk %: similar (~25% both weeks)\n• Average score: down from 47 → 41\n• New pattern: more catalog/portal changes this week\n\nNet read: volume is up but average risk is slightly lower. The mix has shifted from CMDB-heavy to more user-facing changes. Worth a quick check with the catalog team about their release cadence.`;
    }

    if (p.includes('table') && (p.includes('affected') || p.includes('most'))) {
        return `Top affected tables in the last 12 analyses:\n\n1. **sys_choice** — 4 analyses\n2. **sys_security_acl** — 3 analyses (all high-risk)\n3. **incident** — 2 analyses\n4. **sys_user_role** — 2 analyses\n5. **sys_documentation** — 2 analyses\n\nThe sys_security_acl pattern stands out: every change to it this period was high-risk. That suggests a dedicated review template for ACL changes would be high-leverage.`;
    }

    if (p.includes('why') && p.includes('risk')) {
        return `This change is high-risk for three concrete reasons:\n\n1. **Security tables modified** (+30 pts) — sys_security_acl directly controls access to records. Mistakes here can silently grant or revoke permissions across thousands of records.\n\n2. **Bulk ACL changes** (+25 pts) — 27 changes is well above the threshold for routine review.\n\n3. **Production-critical scope** (+12 pts) — the changes touch a scope used by every active user.\n\nIf you wanted to lower the risk, splitting this into smaller update sets — one per ACL change family — would meaningfully reduce the score.`;
    }

    if (p.includes('reviewer') || p.includes('assign')) {
        return `For this change profile, my top recommendation is **Sarah Chen** (Security Lead).\n\n• She owns the ACL governance process for your org\n• Has reviewed 14 of the last 18 high-risk security changes\n• Average review turnaround: 1.2 business days\n\nIf Sarah is unavailable, fall back to **Marcus Patel** (Platform Architect) — he has paired with Sarah on similar reviews 6 times in the last 90 days.`;
    }

    if (p.includes('change ticket') || p.includes('draft')) {
        return `Draft change ticket:\n\n**Summary**: Bulk ACL update affecting role hierarchy on sys_user_role and sys_security_acl.\n\n**Risk**: HIGH (92/100). 27 records changed across 3 sensitive security tables.\n\n**Justification**: Required for the Q2 access-rationalization initiative. Granular role assignments replace previous broad role grants.\n\n**Test plan**:\n1. Run access regression suite in sub-prod\n2. Verify each affected role still has expected permissions\n3. Spot-check 5 representative users from each role\n\n**Rollback plan**: Revert the update set; access pattern reverts to pre-change state. Estimated rollback time: 15 minutes.\n\n**Approval needed from**: Security Lead + CAB\n\nWant me to refine any section?`;
    }

    if (p.includes('rollback')) {
        return `Rollback plan for this update set:\n\n**Pre-deployment**:\n• Take a snapshot of sys_security_acl, sys_user_role, sys_user_has_role\n• Document role assignments for the top 20 active users\n• Confirm the update set has a clean reverse path\n\n**Procedure**:\n1. Mark the update set as "Backed Out"\n2. Run the reverse migration\n3. Validate snapshot users match expected pre-state\n4. Force a session refresh on impacted users\n\n**Estimated time**: 15-20 minutes from decision to verified rollback.\n\nDuring rollback, ~3 minutes of permission flux. Communicate to active users beforehand if possible.`;
    }

    if (p.includes('lower') && p.includes('score')) {
        return `Three concrete actions would lower this from 92 → ~50 (Medium):\n\n1. **Split the update set** — separating ACL changes (~30 pts) from role hierarchy changes (~25 pts) into two update sets means each is evaluated independently.\n\n2. **Reduce volume** — the +5 pts from "high record count" disappears below 20 changes. Stage the deploy in two waves of ~14 each.\n\n3. **Add explicit test artifacts** — documented pre/post test runs in the metadata removes the +12 pts "missing test coverage" factor.\n\nThe security-table modification (+30 pts) cannot be reduced — it's an inherent property of touching those tables. By design.`;
    }

    if (p.includes('methodology') || (p.includes('how') && p.includes('score'))) {
        return `The score is the sum of weighted risk factors. Each has a fixed point value:\n\n**Sensitive table impact** (15-30 pts each)\nTouching sys_security_acl, sys_user_role, sys_dictionary, etc.\n\n**Volume modifiers** (5-15 pts)\nRecord count thresholds at 5, 10, 20, 50.\n\n**Logic changes** (12-28 pts)\nBusiness rules, script includes, server-side scripts.\n\n**Scope and exposure** (5-15 pts)\nProduction-critical scopes, public-facing portals, REST APIs.\n\n**Thresholds**:\n• 0-30 → Low\n• 31-65 → Medium\n• 66+ → High\n\nThe scoring is fully deterministic. The AI explanation layer is generative and lives separately, so the score itself remains auditable.`;
    }

    if (p.includes('similar') || p.includes('past')) {
        return `I found 4 past analyses with strong similarity to this one:\n\n• CRA0001000 — same affected tables, similar score (87 → 92)\n• CRA0000847 — similar volume (+25 pts), reviewed by Sarah Chen\n• CRA0000812 — split-deploy approach reduced score from 95 → 51\n• CRA0000798 — fully rolled out, no incidents reported in 30 days\n\nThe 0000812 case is the most useful precedent — it has the same pattern as yours and the team chose to split rather than ship as-is. Worth reviewing.`;
    }

    if (p.includes('review') || p.includes('need')) {
        return `5 analyses currently need review:\n\n• 3 high-risk awaiting Sarah Chen (avg waiting: 1.4 days)\n• 1 medium awaiting Marcus Patel (just assigned, no SLA breach)\n• 1 unassigned medium-risk — flagging this for triage\n\nNo high-risk changes have been waiting more than 2 business days, so you're within healthy bounds. The unassigned medium is the action item.`;
    }

    if (p.includes('show') || p.includes('filter') || p.includes('acl')) {
        return `Filtering for ACL-related changes:\n\n**3 matches** in your last 12 analyses:\n• "Bulk ACL update on sys_user_role" — 92 pts (HIGH)\n• "Role hierarchy refresh" — 67 pts (HIGH)\n• "ACL cleanup, deprecated entries" — 28 pts (LOW)\n\nAll three touch sys_security_acl. The two high-risk ones share a pattern: bulk modifications without per-role review. Worth raising in your next governance meeting.`;
    }

    if (p.includes('next') || p.includes('recommend')) {
        return `Three recommended next steps:\n\n1. **Get a security sign-off** on the high-risk update sets queued for this week. Sarah Chen is the right reviewer.\n\n2. **Check the Catalog bundle** — it has user-facing implications and warrants product/UX review beyond just code review.\n\n3. **Document this week's pattern** — three ACL-touching update sets in one cycle is unusual. Worth understanding *why* before next cycle.`;
    }

    return `Here's what I can tell you:\n\nThe analysis pipeline evaluates each update set across four dimensions: sensitive table impact, change volume, logic complexity, and scope exposure. Each contributes weighted points to a deterministic risk score.\n\nIf you want me to dig into a specific aspect — a particular update set, a comparison, or a recommended action — just ask. I have access to all the analyses in your portfolio plus the underlying scoring methodology.`;
}

export default function AIChat() {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState(getViewState().view);
    const [input, setInput] = useState('');
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const nextId = useRef(1);
    const bodyRef = useRef<HTMLDivElement>(null);
    const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const sync = () => setView(getViewState().view);
        window.addEventListener('locationchange', sync);
        window.addEventListener('popstate', sync);
        return () => {
            window.removeEventListener('locationchange', sync);
            window.removeEventListener('popstate', sync);
        };
    }, []);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [msgs, open]);

    function clearStream() {
        if (streamTimer.current) { clearInterval(streamTimer.current); streamTimer.current = null; }
    }

    function send(text: string) {
        const t = text.trim();
        if (!t) return;
        const userId = nextId.current++;
        const aiId = nextId.current++;
        setMsgs(prev => [
            ...prev,
            { id: userId, role: 'user', text: t },
            { id: aiId, role: 'assistant', text: '', streaming: true },
        ]);
        setInput('');

        const response = generateResponse(t);
        const thinkMs = 500 + Math.random() * 600;
        setTimeout(() => {
            let i = 0;
            clearStream();
            streamTimer.current = setInterval(() => {
                const step = Math.floor(2 + Math.random() * 4);
                i = Math.min(i + step, response.length);
                setMsgs(prev => prev.map(m => m.id === aiId ? { ...m, text: response.slice(0, i) } : m));
                if (i >= response.length) {
                    clearStream();
                    setMsgs(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m));
                }
            }, 22);
        }, thinkMs);
    }

    useEffect(() => () => clearStream(), []);

    const prompts = PROMPTS_BY_VIEW[view] ?? PROMPTS_BY_VIEW.dashboard;
    const contextLabel = CONTEXT_LABEL[view] ?? 'Your portfolio';

    return (
        <>
            <button className={`aic-fab${open ? ' aic-fab--hidden' : ''}`}
                onClick={() => setOpen(true)} aria-label="Open AI assistant">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M12 2 14 9 21 11 14 13 12 20 10 13 3 11 10 9Z" />
                    <path d="M19 3 19.7 5.3 22 6 19.7 6.7 19 9 18.3 6.7 16 6 18.3 5.3Z" opacity=".7" />
                </svg>
                <span className="aic-fab__pulse" />
                <span className="aic-fab__pulse aic-fab__pulse--2" />
            </button>

            <div className={`aic-overlay${open ? ' aic-overlay--on' : ''}`}
                onClick={() => setOpen(false)} />

            <aside className={`aic${open ? ' aic--on' : ''}`} aria-hidden={!open}>
                <header className="aic__header">
                    <div className="aic__title-wrap">
                        <span className="aic__sparkle">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M12 2 14 9 21 11 14 13 12 20 10 13 3 11 10 9Z" />
                            </svg>
                        </span>
                        <div className="aic__title-text">
                            <h3>AI Risk Analyst</h3>
                            <span className="aic__model">claude-sonnet-4-6 · streaming</span>
                        </div>
                    </div>
                    <button className="aic__close" onClick={() => setOpen(false)} aria-label="Close">×</button>
                </header>

                <div className="aic__context">
                    <span className="aic__context-dot" />
                    <span>Context: <strong>{contextLabel}</strong></span>
                </div>

                <div className="aic__body" ref={bodyRef}>
                    {msgs.length === 0 && (
                        <div className="aic__welcome">
                            <div className="aic__welcome-icon">
                                <svg viewBox="0 0 24 24" width="48" height="48">
                                    <defs>
                                        <linearGradient id="aic-grad-2" x1="0" x2="1" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#ec4899" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M12 2 14 9 21 11 14 13 12 20 10 13 3 11 10 9Z" fill="url(#aic-grad-2)" />
                                </svg>
                            </div>
                            <h4>Ask me anything about your changes</h4>
                            <p>I have context for <strong>{contextLabel.toLowerCase()}</strong>. Try one of these:</p>
                            <div className="aic__chips">
                                {prompts.map(p => (
                                    <button key={p} className="aic__chip" onClick={() => send(p)}>{p}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {msgs.map(m => (
                        <div key={m.id} className={`aic-msg aic-msg--${m.role}`}>
                            {m.role === 'assistant' && (
                                <span className="aic-msg__avatar">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                        <path d="M12 2 14 9 21 11 14 13 12 20 10 13 3 11 10 9Z" />
                                    </svg>
                                </span>
                            )}
                            <div className={`aic-msg__bubble${m.streaming ? ' aic-msg__bubble--streaming' : ''}`}>
                                {m.text || (m.streaming ? (
                                    <span className="aic-msg__dots"><span/><span/><span/></span>
                                ) : '')}
                            </div>
                        </div>
                    ))}
                </div>

                {msgs.length > 0 && (
                    <div className="aic__suggestions">
                        {prompts.slice(0, 3).map(p => (
                            <button key={p} className="aic__chip aic__chip--mini" onClick={() => send(p)}>{p}</button>
                        ))}
                    </div>
                )}

                <form className="aic__input"
                    onSubmit={(e) => { e.preventDefault(); send(input); }}>
                    <button type="button" className="aic__icon-btn" aria-label="Attach">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 11.5V8a5 5 0 0 0-10 0v9a3 3 0 0 0 6 0V8" strokeLinecap="round" />
                        </svg>
                    </button>
                    <input
                        className="aic__input-field"
                        placeholder="Ask about your changes…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="button" className="aic__icon-btn" aria-label="Voice">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="3" width="6" height="11" rx="3" />
                            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
                        </svg>
                    </button>
                    <button type="submit" className="aic__send" disabled={!input.trim()} aria-label="Send">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M3 12 21 4 13 22 11 14 3 12Z" />
                        </svg>
                    </button>
                </form>

                <div className="aic__footer">
                    Responses are illustrative · Demo mode · Connect to live model in v2
                </div>
            </aside>
        </>
    );
}
