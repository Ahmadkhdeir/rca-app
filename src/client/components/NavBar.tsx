import React from 'react';
import { navigate, type View } from '../utils/navigation';
import './NavBar.css';

interface Props { activeView: View; }

export default function NavBar({ activeView }: Props) {
    return (
        <nav className="nav">
            <div className="nav__brand">
                <div className="nav__icon" aria-hidden="true">
                    <img src="cra-logo.svg" alt="Change Risk Analyzer" />
                </div>
                <div className="nav__wordmark">
                    <span className="nav__name">Change Risk Analyzer</span>
                </div>
            </div>

            <div className="nav__links">
                <button className={`nav__link${activeView === 'dashboard' ? ' nav__link--on' : ''}`}
                    onClick={() => navigate('dashboard')}>
                    <svg className="nav__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                    </svg>
                    Dashboard
                </button>
                <button className={`nav__link${activeView === 'analyze' ? ' nav__link--on' : ''}`}
                    onClick={() => navigate('analyze')}>
                    <svg className="nav__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    Analyze
                </button>
                <button className={`nav__link${activeView === 'list' ? ' nav__link--on' : ''}`}
                    onClick={() => navigate('list')}>
                    <svg className="nav__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
                    </svg>
                    Analyses
                </button>
            </div>

            <button className="nav__cta" onClick={() => navigate('analyze')}>
                + New Analysis
            </button>
        </nav>
    );
}
