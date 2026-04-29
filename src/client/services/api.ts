const TOKEN_HEADER = { 'X-UserToken': (window as any).g_ck || '' };

const JSON_HEADERS = { ...TOKEN_HEADER, Accept: 'application/json' };

// --- Types ---

export interface RiskStats {
    low: number;
    medium: number;
    high: number;
    total: number;
}

export interface FieldRef {
    value: string;
    display_value: string;
}

export interface RiskResult {
    sys_id: string;
    number: string | FieldRef;
    update_set: FieldRef;
    risk_level: FieldRef;
    risk_score: string | FieldRef;
    record_count: string | FieldRef;
    analyzed_by: FieldRef;
    analyzed_at: FieldRef;
    reasons?: string | FieldRef;
    recommendations?: string | FieldRef;
    affected_tables?: string | FieldRef;
}

// Safely read value from a plain string or a {value, display_value} object
export const val = (f: string | FieldRef | undefined): string =>
    typeof f === 'object' && f !== null ? f.value ?? '' : (f as string) ?? '';

export const disp = (f: string | FieldRef | undefined): string =>
    typeof f === 'object' && f !== null ? f.display_value ?? f.value ?? '' : (f as string) ?? '';

// If the reasons text starts with "[Title]\n", returns the bracketed title.
// Used by the demo seeder so multiple demo records sharing one underlying
// update set still show distinct titles in the dashboard.
export const titleFromReasons = (reasons: string): string => {
    const m = reasons.match(/^\[([^\]]+)\]/);
    return m ? m[1].trim() : '';
};

// Returns the best available display name for a result record:
// the bracketed title from reasons (demo data) or the update set's display.
export const resultName = (r: RiskResult): string => {
    const reasons = val(r.reasons);
    return titleFromReasons(reasons) || disp(r.update_set) || 'Unknown Update Set';
};

// --- API calls ---

export async function fetchRiskStats(): Promise<RiskStats> {
    const params = new URLSearchParams({
        sysparm_count: 'true',
        sysparm_group_by: 'risk_level',
    });
    const res = await fetch(`/api/now/stats/x_488299_change_ri_risk_result?${params}`, {
        headers: JSON_HEADERS,
    });
    const json = await res.json();
    const stats: RiskStats = { low: 0, medium: 0, high: 0, total: 0 };
    const groups: any[] = json?.result?.stats?.count ?? [];
    for (const g of groups) {
        const level = g['groupby_fields']?.[0]?.value ?? '';
        const count = parseInt(g.count ?? '0', 10);
        if (level === 'low') stats.low = count;
        if (level === 'medium') stats.medium = count;
        if (level === 'high') stats.high = count;
        stats.total += count;
    }
    return stats;
}

export async function fetchRiskResults(filterLevel?: string | null, limit = 25): Promise<RiskResult[]> {
    const query = filterLevel
        ? `risk_level=${filterLevel}^ORDERBYDESCanalyzed_at`
        : 'ORDERBYDESCanalyzed_at';
    const params = new URLSearchParams({
        sysparm_query: query,
        sysparm_limit: String(limit),
        sysparm_display_value: 'all',
        sysparm_fields: 'sys_id,number,update_set,risk_level,risk_score,record_count,analyzed_by,analyzed_at,reasons',
    });
    const res = await fetch(`/api/now/table/x_488299_change_ri_risk_result?${params}`, {
        headers: JSON_HEADERS,
    });
    const json = await res.json();
    return json?.result ?? [];
}

export async function fetchRiskResult(sysId: string): Promise<RiskResult | null> {
    const params = new URLSearchParams({
        sysparm_display_value: 'all',
        sysparm_fields:
            'sys_id,number,update_set,risk_level,risk_score,record_count,analyzed_by,analyzed_at,reasons,recommendations,affected_tables',
    });
    const res = await fetch(`/api/now/table/x_488299_change_ri_risk_result/${sysId}?${params}`, {
        headers: JSON_HEADERS,
    });
    const json = await res.json();
    return json?.result ?? null;
}
