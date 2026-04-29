import React, { useEffect, useRef, useState } from 'react';
import './AIExplainPanel.css';

export interface AIContext {
    name: string;
    score: number;
    level: 'high' | 'medium' | 'low';
    factors: { label: string; pts: number }[];
    affectedTables: string[];
}

type Phase = 'idle' | 'thinking' | 'streaming' | 'done';

const REVIEWERS: Record<string, { name: string; role: string; initials: string; color: string; reason: string }> = {
    high: {
        name: 'Sarah Chen', role: 'Security Lead', initials: 'SC', color: '#ef4444',
        reason: 'Owns the ACL governance process and has approved 14 of the last 18 high-risk security changes.',
    },
    medium: {
        name: 'Marcus Patel', role: 'Platform Architect', initials: 'MP', color: '#6366f1',
        reason: 'Strongest pattern match against the affected tables — has reviewed similar integration changes recently.',
    },
    low: {
        name: 'Diana Lopez', role: 'ITSM Process Owner', initials: 'DL', color: '#10b981',
        reason: 'Routine review owner for low-risk cosmetic changes; no escalation needed.',
    },
};

function summary(ctx: AIContext): string {
    const top = [...ctx.factors].sort((a, b) => b.pts - a.pts)[0];
    const tableList = ctx.affectedTables.slice(0, 3).join(', ');

    const intros: Record<string, string> = {
        high:   `This change is high-risk primarily because of the impact on ${ctx.affectedTables[0] || 'multiple sensitive tables'}. The combination of "${top?.label.toLowerCase() ?? 'broad changes'}" and ${ctx.factors.length - 1} other factors pushes the score to ${ctx.score} — well above the 65-point threshold for High classification.`,
        medium: `This is a medium-risk change. The dominant factor is "${top?.label.toLowerCase() ?? 'integration changes'}" (+${top?.pts ?? 0} pts). Risk is bounded — ${tableList ? `the affected tables (${tableList}) are scoped` : 'the change set is limited'} — but reviewable changes are present that warrant a deliberate look.`,
        low:    `This is a low-risk change. The factors are cosmetic or narrowly-scoped, the score (${ctx.score}) is well under the 30-point Medium threshold, and ${tableList ? `the only affected tables (${tableList}) carry no business logic` : 'no critical tables are touched'}. Standard peer review is appropriate.`,
    };

    const impacts: Record<string, string> = {
        high:   `\n\nWhat could go wrong: ACL or role changes can silently grant or revoke access across thousands of records. Business rule modifications on core ITSM tables propagate to every incident, change, and request created from the moment of deployment. A bad rollout is hard to reverse without a full restore.\n\nMy recommendation: do not promote past test without an explicit security review and a documented rollback plan. Treat the affected tables as production-critical even in sub-prod.`,
        medium: `\n\nWhat to watch: integrations and form-layer changes are usually safe in isolation, but they often interact with downstream consumers (reporting, automation, customer-facing portals). Validate end-to-end flows in test, not just the changed surface.\n\nMy recommendation: a single-reviewer sign-off and one full integration smoke-test should be enough. No need to engage the security board.`,
        low:    `\n\nWhat to watch: even cosmetic changes can be reverted if you don't like how they read in production. Have someone do a 5-minute visual QA after deploy.\n\nMy recommendation: ship it during normal release windows. No special process required.`,
    };

    return intros[ctx.level] + impacts[ctx.level];
}

function ThinkingDots() {
    return (
        <span className="ai-dots" aria-label="thinking">
            <span /><span /><span />
        </span>
    );
}

export default function AIExplainPanel({ ctx }: { ctx: AIContext }) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [text, setText] = useState('');
    const fullRef = useRef('');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    function clearTimer() {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }

    function run() {
        clearTimer();
        setPhase('thinking');
        setText('');
        fullRef.current = summary(ctx);

        // Brief "thinking" pause to mimic latency before tokens arrive.
        const thinkingMs = 700 + Math.random() * 600;
        const thinkingTimer = setTimeout(() => {
            setPhase('streaming');
            let i = 0;
            timerRef.current = setInterval(() => {
                // Stream 2-5 chars per tick for variable rhythm.
                const step = Math.floor(2 + Math.random() * 4);
                i = Math.min(i + step, fullRef.current.length);
                setText(fullRef.current.slice(0, i));
                if (i >= fullRef.current.length) {
                    clearTimer();
                    setPhase('done');
                }
            }, 22);
        }, thinkingMs);

        return () => clearTimeout(thinkingTimer);
    }

    useEffect(() => () => clearTimer(), []);

    const reviewer = REVIEWERS[ctx.level];

    return (
        <div className="ai-panel">
            <div className="ai-panel__header">
                <div className="ai-panel__title">
                    <span className="ai-panel__sparkle" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12 2 14 9 21 11 14 13 12 20 10 13 3 11 10 9Z" />
                            <path d="M19 3 19.7 5.3 22 6 19.7 6.7 19 9 18.3 6.7 16 6 18.3 5.3Z" opacity=".7" />
                        </svg>
                    </span>
                    AI Risk Analyst
                    <span className="ai-panel__pill">Beta</span>
                </div>
                {phase === 'done' && (
                    <button className="ai-panel__regen" onClick={run}>↻ Regenerate</button>
                )}
            </div>

            {phase === 'idle' && (
                <div className="ai-panel__cta">
                    <p>Get a plain-English explanation of <strong>why this change is {ctx.level} risk</strong>, what could go wrong, and a recommended reviewer.</p>
                    <button className="ai-panel__btn" onClick={run}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2 14 9 21 11 14 13 12 20 10 13 3 11 10 9Z"/></svg>
                        Explain with AI
                    </button>
                </div>
            )}

            {phase !== 'idle' && (
                <div className="ai-panel__body">
                    {phase === 'thinking' && (
                        <div className="ai-panel__thinking">
                            <span className="ai-panel__shimmer">Analyzing factors</span>
                            <ThinkingDots />
                        </div>
                    )}

                    {(phase === 'streaming' || phase === 'done') && (
                        <div className={`ai-panel__text${phase === 'streaming' ? ' ai-panel__text--cursor' : ''}`}>
                            {text}
                        </div>
                    )}

                    {phase === 'done' && reviewer && (
                        <div className="ai-rev">
                            <div className="ai-rev__label">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2 14 9 21 11 14 13 12 20 10 13 3 11 10 9Z"/></svg>
                                Suggested reviewer
                            </div>
                            <div className="ai-rev__card">
                                <span className="ai-rev__avatar" style={{ background: reviewer.color }}>{reviewer.initials}</span>
                                <div className="ai-rev__info">
                                    <span className="ai-rev__name">{reviewer.name}</span>
                                    <span className="ai-rev__role">{reviewer.role}</span>
                                </div>
                                <span className="ai-rev__conf">94% match</span>
                            </div>
                            <p className="ai-rev__reason">{reviewer.reason}</p>
                        </div>
                    )}

                    {phase === 'done' && (
                        <div className="ai-panel__footer">
                            <span className="ai-panel__model">
                                <span className="ai-panel__model-dot" />
                                Generated by <strong>claude-sonnet-4-6</strong> · {Math.round(text.length / 4)} tokens · 1.2s
                            </span>
                            <button className="ai-panel__copy"
                                onClick={() => navigator.clipboard?.writeText(text)}>
                                ⧉ Copy
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
