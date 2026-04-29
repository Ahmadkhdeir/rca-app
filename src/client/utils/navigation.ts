export type View = 'dashboard' | 'list' | 'detail' | 'analyze';

export interface ViewState {
    view: View;
    id: string | null;
    filter: string | null;
}

export function getViewState(): ViewState {
    const p = new URLSearchParams(window.location.search);
    return {
        view: (p.get('view') as View) || 'dashboard',
        id: p.get('id'),
        filter: p.get('filter'),
    };
}

export function navigate(view: View, extra: Record<string, string> = {}, title = 'Change Risk Analyzer') {
    const p = new URLSearchParams({ view, ...extra });
    const path = `${window.location.pathname}?${p}`;

    if (window.self !== window.top) {
        (window as any).CustomEvent?.fireTop?.('magellanNavigator.permalink.set', { relativePath: path, title });
    }
    window.history.pushState({}, '', path);
    document.title = title;
    window.dispatchEvent(new Event('locationchange'));
}
