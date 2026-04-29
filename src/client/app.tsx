import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import AnalysisList from './components/AnalysisList';
import AnalysisDetail from './components/AnalysisDetail';
import AnalyzePage from './components/AnalyzePage';
import AIChat from './components/AIChat';
import { getViewState, type ViewState } from './utils/navigation';
import './app.css';

export default function App() {
    const [vs, setVs] = useState<ViewState>(getViewState);

    useEffect(() => {
        const sync = () => setVs(getViewState());
        window.addEventListener('popstate', sync);
        window.addEventListener('locationchange', sync);
        return () => {
            window.removeEventListener('popstate', sync);
            window.removeEventListener('locationchange', sync);
        };
    }, []);

    return (
        <div className="cra-app">
            <NavBar activeView={vs.view} />
            <main className="cra-main">
                {vs.view === 'dashboard' && <Dashboard />}
                {vs.view === 'analyze'   && <AnalyzePage />}
                {vs.view === 'list'      && <AnalysisList initialFilter={vs.filter} />}
                {vs.view === 'detail'    && vs.id && <AnalysisDetail sysId={vs.id} />}
            </main>
            <AIChat />
        </div>
    );
}
