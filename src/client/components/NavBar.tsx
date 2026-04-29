import React from 'react';
import { navigate, type View } from '../utils/navigation';
import './NavBar.css';

interface Props { activeView: View; }

export default function NavBar({ activeView }: Props) {
    return (
        <nav className="nav">
            <div className="nav__brand">
                <div className="nav__icon" aria-hidden="true">
                    <img src="cra.svg" width="1230" height="1230" /> 
                </div>
                <div className="nav__wordmark">
                    <span className="nav__name">Change Risk Analyzer</span>
                </div>
            </div>

            <div className="nav__links">
                <button className={`nav__link${activeView === 'dashboard' ? ' nav__link--on' : ''}`}
                    onClick={() => navigate('dashboard')}>
                    <span className="nav__link-icon">◈</span> Dashboard
                </button>
                <button className={`nav__link${activeView === 'analyze' ? ' nav__link--on' : ''}`}
                    onClick={() => navigate('analyze')}>
                    <span className="nav__link-icon">▶</span> Analyze
                </button>
                <button className={`nav__link${activeView === 'list' ? ' nav__link--on' : ''}`}
                    onClick={() => navigate('list')}>
                    <span className="nav__link-icon">≡</span> Analyses
                </button>
            </div>

            <button className="nav__cta" onClick={() => navigate('analyze')}>
                + New Analysis
            </button>
        </nav>
    );
}
