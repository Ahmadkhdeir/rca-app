import { type RiskStats, type RiskResult } from '../services/api';

export const MOCK_STATS: RiskStats = { high: 3, medium: 5, low: 4, total: 12 };

function ago(hours: number): { value: string; display_value: string } {
    const d = new Date(Date.now() - hours * 3600 * 1000);
    const iso = d.toISOString().slice(0, 19).replace('T', ' ');
    return { value: iso, display_value: iso };
}

function ref(value: string, display_value: string) { return { value, display_value }; }
function str(s: string) { return { value: s, display_value: s }; }

interface MockSeed {
    name: string;
    level: 'high' | 'medium' | 'low';
    score: number;
    count: number;
    hoursAgo: number;
    tables: string[];
    reasons: string;
}

const SEEDS: MockSeed[] = [
    {
        name: 'Bulk ACL update on sys_user_role', level: 'high', score: 92, count: 27, hoursAgo: 2,
        tables: ['sys_security_acl', 'sys_user_role', 'sys_user_has_role'],
        reasons: 'Risk profile based on 27 changes across 3 sensitive tables.\n\nContributing factors:\n• Sensitive security table modified: sys_security_acl (+30 pts)\n• Role hierarchy changes detected (+25 pts)\n• Bulk ACL modifications (>20) (+20 pts)\n• Production-critical scope (+12 pts)\n• High record count (27 changes) (+5 pts)',
    },
    {
        name: 'Incident form layout + business rule rewrite', level: 'high', score: 78, count: 14, hoursAgo: 26,
        tables: ['incident', 'sys_script', 'sys_ui_form'],
        reasons: 'Risk profile based on 14 changes across 3 tables.\n\nContributing factors:\n• Business rules modified on core ITSM table (+28 pts)\n• Form layout changes on incident (+20 pts)\n• Server-side script logic rewritten (+18 pts)\n• Missing test coverage indicators (+12 pts)',
    },
    {
        name: 'Custom Catalog Items — Hardware Request bundle', level: 'high', score: 71, count: 9, hoursAgo: 50,
        tables: ['sc_cat_item', 'sc_cat_item_option', 'item_option_new', 'sc_category'],
        reasons: 'Risk profile based on 9 changes across 4 catalog tables.\n\nContributing factors:\n• Multiple catalog item variables added (+24 pts)\n• Workflow attachment changes (+20 pts)\n• Pricing-relevant fields modified (+15 pts)\n• Public-facing portal changes (+12 pts)',
    },
    {
        name: 'New REST API endpoint for asset sync', level: 'medium', score: 58, count: 6, hoursAgo: 74,
        tables: ['sys_ws_definition', 'sys_ws_operation', 'sys_script_include'],
        reasons: 'Risk profile based on 6 changes across 3 tables.\n\nContributing factors:\n• New scripted REST API exposed (+22 pts)\n• Server-side script include added (+15 pts)\n• Authentication scheme uses basic (+12 pts)\n• Limited record count, isolated scope (+9 pts)',
    },
    {
        name: 'Notification template refresh — outage comms', level: 'medium', score: 49, count: 11, hoursAgo: 98,
        tables: ['sysevent_email_action', 'sys_email_template', 'sys_choice'],
        reasons: 'Risk profile based on 11 changes across 3 tables.\n\nContributing factors:\n• Email notification rules altered (+18 pts)\n• Template wording changes affect outbound comms (+15 pts)\n• Choice-list values added (+10 pts)\n• Moderate record count (+6 pts)',
    },
    {
        name: 'Problem table dictionary additions', level: 'medium', score: 42, count: 5, hoursAgo: 122,
        tables: ['sys_dictionary', 'sys_documentation', 'problem'],
        reasons: 'Risk profile based on 5 changes across 3 tables.\n\nContributing factors:\n• Dictionary changes on problem table (+18 pts)\n• New custom fields added (+15 pts)\n• Field labels changed (+9 pts)',
    },
    {
        name: 'CMDB relationship rule tuning', level: 'medium', score: 38, count: 4, hoursAgo: 146,
        tables: ['cmdb_rel_type', 'cmdb_ci', 'sys_relationship'],
        reasons: 'Risk profile based on 4 changes across 3 tables.\n\nContributing factors:\n• CMDB topology rules modified (+20 pts)\n• Relationship type definitions changed (+12 pts)\n• Discovery side-effects possible (+6 pts)',
    },
    {
        name: 'Knowledge base v3 article migration', level: 'medium', score: 35, count: 18, hoursAgo: 170,
        tables: ['kb_knowledge', 'kb_category', 'kb_uc_block_content'],
        reasons: 'Risk profile based on 18 changes across 3 tables.\n\nContributing factors:\n• High volume of content updates (+15 pts)\n• Category re-structuring (+12 pts)\n• HTML/rich-text content changes (+8 pts)',
    },
    {
        name: 'Field label cleanup on cmdb_ci_server', level: 'low', score: 22, count: 3, hoursAgo: 194,
        tables: ['sys_documentation', 'cmdb_ci_server'],
        reasons: 'Risk profile based on 3 changes across 2 tables.\n\nContributing factors:\n• Cosmetic label updates only (+12 pts)\n• No data-model impact detected (+6 pts)\n• Small, isolated change set (+4 pts)',
    },
    {
        name: 'Add new choice value to incident state', level: 'low', score: 18, count: 2, hoursAgo: 218,
        tables: ['sys_choice'],
        reasons: 'Risk profile based on 2 changes on 1 table.\n\nContributing factors:\n• Single new choice value (+10 pts)\n• Existing values untouched (+5 pts)\n• No workflow dependency (+3 pts)',
    },
    {
        name: 'Minor copy edits to login page', level: 'low', score: 12, count: 2, hoursAgo: 242,
        tables: ['sys_ui_macro', 'sys_ui_message'],
        reasons: 'Risk profile based on 2 changes across 2 tables.\n\nContributing factors:\n• Static-string edits only (+8 pts)\n• No script logic changes (+4 pts)',
    },
    {
        name: 'Fix typo in welcome email template', level: 'low', score: 6, count: 1, hoursAgo: 290,
        tables: ['sys_email_template'],
        reasons: 'Risk profile based on 1 change on 1 table.\n\nContributing factors:\n• Single template typo correction (+6 pts)',
    },
];

export const MOCK_RESULTS: RiskResult[] = SEEDS.map((s, i) => ({
    sys_id: `mock-${String(i).padStart(3, '0')}`,
    number: ref('CRA' + String(1000 + i).padStart(7, '0'), 'CRA' + String(1000 + i).padStart(7, '0')),
    update_set: ref('mock-us-' + i, s.name),
    risk_level: ref(s.level, s.level.charAt(0).toUpperCase() + s.level.slice(1)),
    risk_score: str(String(s.score)),
    record_count: str(String(s.count)),
    analyzed_by: ref('admin', 'System Administrator'),
    analyzed_at: ago(s.hoursAgo),
    reasons: str('[' + s.name + ']\n' + s.reasons),
    affected_tables: str(s.tables.join(', ')),
}));
