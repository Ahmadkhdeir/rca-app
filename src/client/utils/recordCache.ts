import { sysId as getSysId, type RiskResult } from '../services/api';

let _record: RiskResult | null = null;

export function cacheRecord(r: RiskResult) { _record = r; }

export function getCachedRecord(id: string): RiskResult | null {
    if (!_record) return null;
    // getSysId safely handles both plain string and {value, display_value} shapes
    return getSysId(_record) === id ? _record : null;
}
