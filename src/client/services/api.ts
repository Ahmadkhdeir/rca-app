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

// sys_id can come back as a plain string OR as {value, display_value} with sysparm_display_value=all.
// Always extract the string form before using as a URL parameter or cache key.
export const sysId = (r: { sys_id: string | FieldRef }): string =>
    val(r.sys_id as string | FieldRef);

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

export interface UpdateSet {
    sys_id: string;
    name: string;
    state: string;
    sys_updated_on: string;
}

// --- API calls ---

export async function fetchUpdateSets(search = ''): Promise<UpdateSet[]> {
    const base = 'state!=empty^ORDERBYDESCsys_updated_on';
    const query = search.trim() ? `${base}^nameLIKE${search.trim()}` : base;
    const params = new URLSearchParams({
        sysparm_query: query,
        sysparm_limit: '50',
        sysparm_fields: 'sys_id,name,state,sys_updated_on',
        sysparm_display_value: 'false',
    });
    const res = await fetch(`/api/now/table/sys_update_set?${params}`, {
        headers: JSON_HEADERS,
    });
    const json = await res.json();
    return json?.result ?? [];
}

export async function fetchRiskStats(): Promise<RiskStats> {
    // Use a plain table query instead of the aggregate API — more reliable across SN versions.
    const params = new URLSearchParams({
        sysparm_fields: 'risk_level',
        sysparm_limit: '1000',
        sysparm_display_value: 'false',
    });
    const res = await fetch(`/api/now/table/x_488299_change_ri_risk_result?${params}`, {
        headers: JSON_HEADERS,
    });
    const json = await res.json();
    const records: any[] = json?.result ?? [];
    const stats: RiskStats = { low: 0, medium: 0, high: 0, total: 0 };
    for (const r of records) {
        const level = (r.risk_level ?? '') as string;
        if (level === 'low') stats.low++;
        else if (level === 'medium') stats.medium++;
        else if (level === 'high') stats.high++;
        stats.total++;
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
        sysparm_fields: 'sys_id,number,update_set,risk_level,risk_score,record_count,analyzed_by,analyzed_at,reasons,recommendations,affected_tables',
    });
    const res = await fetch(`/api/now/table/x_488299_change_ri_risk_result?${params}`, {
        headers: JSON_HEADERS,
    });
    const json = await res.json();
    return json?.result ?? [];
}

export interface AnalysisApiResult {
    result_sys_id: string;
    risk_level: 'low' | 'medium' | 'high';
    risk_score: number;
    record_count: number;
    affected_tables: string[];
    sensitive_tables_count: number;
    rules_count: number;
    acl_count: number;
    factors: { label: string; pts: number }[];
    recommendations: string[];
}

export async function analyzeUpdateSet(updateSetSysId: string): Promise<AnalysisApiResult> {
    const res = await fetch('/api/x_488299_change_ri/risk/analyze', {
        method: 'POST',
        headers: { ...TOKEN_HEADER, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ update_set_sys_id: updateSetSysId }),
    });
    let json: any;
    try {
        json = await res.json();
    } catch {
        throw new Error(`HTTP ${res.status} — response was not JSON`);
    }
    if (!res.ok) {
        // SN wraps errors as { error: { message, detail } } or our own { error: string }
        const e = json?.error;
        const msg = typeof e === 'string'
            ? e
            : (e?.message ?? e?.detail ?? `HTTP ${res.status}`);
        throw new Error(msg);
    }
    // SN scripted REST wraps setBody() responses in { result: ... }
    return (json?.result ?? json) as AnalysisApiResult;
}

export interface SysUser {
    sys_id: string;
    name: string;
    email: string;
    title: string;
    photo?: string;
}

export async function fetchUsers(search: string): Promise<SysUser[]> {
    if (!search.trim()) return [];
    const params = new URLSearchParams({
        sysparm_query: `active=true^nameLIKE${search.trim()}`,
        sysparm_limit: '10',
        sysparm_fields: 'sys_id,name,email,title,photo',
        sysparm_display_value: 'false',
    });
    const res = await fetch(`/api/now/table/sys_user?${params}`, { headers: JSON_HEADERS });
    const json = await res.json();
    return json?.result ?? [];
}

export async function assignReviewer(resultSysId: string, reviewerSysId: string, note: string): Promise<void> {
    const res = await fetch(`/api/now/table/x_488299_change_ri_risk_result/${resultSysId}`, {
        method: 'PATCH',
        headers: { ...TOKEN_HEADER, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ reviewer: reviewerSysId, reviewer_note: note }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchRiskResult(sysId: string): Promise<RiskResult | null> {
    // Use query-based list call instead of /{sysId} — avoids per-record ACL restriction
    // and works even when sys_id gets URL-encoded as [object Object].
    const params = new URLSearchParams({
        sysparm_query: `sys_id=${sysId}`,
        sysparm_limit: '1',
        sysparm_display_value: 'all',
        sysparm_fields:
            'sys_id,number,update_set,risk_level,risk_score,record_count,analyzed_by,analyzed_at,reasons,recommendations,affected_tables',
    });
    const res = await fetch(`/api/now/table/x_488299_change_ri_risk_result?${params}`, {
        headers: JSON_HEADERS,
    });
    const json = await res.json();
    const results: RiskResult[] = json?.result ?? [];
    return results[0] ?? null;
}
