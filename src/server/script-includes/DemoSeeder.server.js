var DemoSeeder = Class.create();
DemoSeeder.prototype = {
    initialize: function () {},

    /**
     * Seeds the risk_result table with realistic-looking demo data
     * for presentations.
     *
     * Because scoped apps cannot insert into sys_update_set (cross-scope policy),
     * this seeder REFERENCES existing update sets in the instance instead of
     * creating them. It picks up to 12 existing update sets (any state, ordered
     * by recent activity) and round-robins through them.
     *
     * Tip: before running this, manually create a few empty update sets in
     * "System Update Sets > Local Update Sets" with the names you want to see
     * on the dashboard (e.g. "ACL Bulk Update", "Catalog Items v3" etc).
     *
     * Usage (Scripts - Background, Application = Change Risk Analyzer):
     *   gs.info(new x_488299_change_ri.DemoSeeder().seed());
     *
     * Cleanup (only removes risk_results, not the update sets):
     *   gs.info(new x_488299_change_ri.DemoSeeder().clean());
     */
    seed: function () {
        var updateSetIds = this._collectUpdateSets();
        if (updateSetIds.length === 0) {
            return 'No sys_update_set records found in the instance — create at least one first.';
        }

        var samples = this._samples();
        var inserted = 0;

        for (var i = 0; i < samples.length; i++) {
            var s = samples[i];
            var usId = updateSetIds[i % updateSetIds.length];

            var rr = new GlideRecord('x_488299_change_ri_risk_result');
            rr.initialize();
            rr.update_set = usId;
            rr.risk_level = s.level;
            rr.risk_score = s.score;
            rr.record_count = s.recordCount;
            rr.affected_tables = s.tables.join(', ');
            rr.reasons = '[' + s.name + ']\n' + s.reasons;
            rr.recommendations = s.recommendations;
            rr.analyzed_by = gs.getUserID();
            rr.analyzed_at = this._daysAgo(s.daysAgo);
            if (rr.insert()) inserted++;
        }

        return 'Seeded ' + inserted + ' demo risk results across ' + updateSetIds.length + ' existing update set(s).';
    },

    clean: function () {
        var removed = 0;
        var rr = new GlideRecord('x_488299_change_ri_risk_result');
        rr.addQuery('reasons', 'STARTSWITH', '[');
        rr.query();
        while (rr.next()) {
            rr.deleteRecord();
            removed++;
        }
        return 'Removed ' + removed + ' demo risk results.';
    },

    _collectUpdateSets: function () {
        var ids = [];
        var us = new GlideRecord('sys_update_set');
        us.orderByDesc('sys_updated_on');
        us.setLimit(12);
        us.query();
        while (us.next()) ids.push(us.getUniqueValue());
        return ids;
    },

    _daysAgo: function (days) {
        var gdt = new GlideDateTime();
        gdt.addSeconds(-1 * days * 86400);
        return gdt.getValue();
    },

    _samples: function () {
        return [
            {
                name: 'Bulk ACL update on sys_user_role',
                level: 'high', score: 92, recordCount: 27, daysAgo: 0,
                tables: ['sys_security_acl', 'sys_user_role', 'sys_user_has_role'],
                reasons:
                    'Risk profile based on 27 changes across 3 sensitive tables.\n\n' +
                    'Contributing factors:\n' +
                    '• Sensitive security table modified: sys_security_acl (+30 pts)\n' +
                    '• Role hierarchy changes detected (+25 pts)\n' +
                    '• Bulk ACL modifications (>20) (+20 pts)\n' +
                    '• Production-critical scope (+12 pts)\n' +
                    '• High record count (27 changes) (+5 pts)',
                recommendations:
                    'Review every ACL change individually with the security lead.\n' +
                    'Run a full regression in sub-prod before promotion.\n' +
                    'Document the rationale for each role/permission added.\n' +
                    'Notify the security review board prior to production deployment.'
            },
            {
                name: 'Incident form layout + business rule rewrite',
                level: 'high', score: 78, recordCount: 14, daysAgo: 1,
                tables: ['incident', 'sys_script', 'sys_ui_form'],
                reasons:
                    'Risk profile based on 14 changes across 3 tables.\n\n' +
                    'Contributing factors:\n' +
                    '• Business rules modified on core ITSM table (+28 pts)\n' +
                    '• Form layout changes on incident (+20 pts)\n' +
                    '• Server-side script logic rewritten (+18 pts)\n' +
                    '• Missing test coverage indicators (+12 pts)',
                recommendations:
                    'Add unit tests around the rewritten business rule.\n' +
                    'Run incident workflow regression in test instance.\n' +
                    'Coordinate with ITSM process owner before deploying.\n' +
                    'Stage rollout: pilot group first, then full deployment.'
            },
            {
                name: 'Custom Catalog Items — Hardware Request bundle',
                level: 'high', score: 71, recordCount: 9, daysAgo: 2,
                tables: ['sc_cat_item', 'sc_cat_item_option', 'item_option_new', 'sc_category'],
                reasons:
                    'Risk profile based on 9 changes across 4 catalog tables.\n\n' +
                    'Contributing factors:\n' +
                    '• Multiple catalog item variables added (+24 pts)\n' +
                    '• Workflow attachment changes (+20 pts)\n' +
                    '• Pricing-relevant fields modified (+15 pts)\n' +
                    '• Public-facing portal changes (+12 pts)',
                recommendations:
                    'Verify approval workflows still trigger correctly.\n' +
                    'Confirm pricing logic with finance / procurement.\n' +
                    'Test the end-to-end request flow as a regular user.\n' +
                    'Update the service catalog documentation.'
            },
            {
                name: 'New REST API endpoint for asset sync',
                level: 'medium', score: 58, recordCount: 6, daysAgo: 3,
                tables: ['sys_ws_definition', 'sys_ws_operation', 'sys_script_include'],
                reasons:
                    'Risk profile based on 6 changes across 3 tables.\n\n' +
                    'Contributing factors:\n' +
                    '• New scripted REST API exposed (+22 pts)\n' +
                    '• Server-side script include added (+15 pts)\n' +
                    '• Authentication scheme uses basic (+12 pts)\n' +
                    '• Limited record count, isolated scope (+9 pts)',
                recommendations:
                    'Confirm the API is scoped behind correct ACLs.\n' +
                    'Switch to OAuth/token authentication where possible.\n' +
                    'Add request logging for the first 30 days.\n' +
                    'Document the contract in the integration wiki.'
            },
            {
                name: 'Notification template refresh — outage comms',
                level: 'medium', score: 49, recordCount: 11, daysAgo: 4,
                tables: ['sysevent_email_action', 'sys_email_template', 'sys_choice'],
                reasons:
                    'Risk profile based on 11 changes across 3 tables.\n\n' +
                    'Contributing factors:\n' +
                    '• Email notification rules altered (+18 pts)\n' +
                    '• Template wording changes affect outbound comms (+15 pts)\n' +
                    '• Choice-list values added (+10 pts)\n' +
                    '• Moderate record count (+6 pts)',
                recommendations:
                    'Send sample notifications to a test group first.\n' +
                    'Verify mail-merge fields render correctly.\n' +
                    'Have communications/marketing approve the wording.\n' +
                    'Schedule deployment outside of peak email hours.'
            },
            {
                name: 'Problem table dictionary additions',
                level: 'medium', score: 42, recordCount: 5, daysAgo: 5,
                tables: ['sys_dictionary', 'sys_documentation', 'problem'],
                reasons:
                    'Risk profile based on 5 changes across 3 tables.\n\n' +
                    'Contributing factors:\n' +
                    '• Dictionary changes on problem table (+18 pts)\n' +
                    '• New custom fields added (+15 pts)\n' +
                    '• Field labels changed (translation impact) (+9 pts)',
                recommendations:
                    'Verify reports and dashboards still render after schema change.\n' +
                    'Update training materials with new field meanings.\n' +
                    'Confirm i18n translations are queued for ops languages.'
            },
            {
                name: 'CMDB relationship rule tuning',
                level: 'medium', score: 38, recordCount: 4, daysAgo: 6,
                tables: ['cmdb_rel_type', 'cmdb_ci', 'sys_relationship'],
                reasons:
                    'Risk profile based on 4 changes across 3 tables.\n\n' +
                    'Contributing factors:\n' +
                    '• CMDB topology rules modified (+20 pts)\n' +
                    '• Relationship type definitions changed (+12 pts)\n' +
                    '• Discovery side-effects possible (+6 pts)',
                recommendations:
                    'Run a CMDB integrity check before & after deploy.\n' +
                    'Coordinate with the discovery / asset team.\n' +
                    'Take a CMDB snapshot prior to promotion.'
            },
            {
                name: 'Knowledge base v3 article migration',
                level: 'medium', score: 35, recordCount: 18, daysAgo: 7,
                tables: ['kb_knowledge', 'kb_category', 'kb_uc_block_content'],
                reasons:
                    'Risk profile based on 18 changes across 3 tables.\n\n' +
                    'Contributing factors:\n' +
                    '• High volume of content updates (+15 pts)\n' +
                    '• Category re-structuring (+12 pts)\n' +
                    '• HTML/rich-text content changes (+8 pts)',
                recommendations:
                    'Spot-check 10% of migrated articles for formatting issues.\n' +
                    'Validate search relevance has not regressed.\n' +
                    'Communicate the new taxonomy to end users.'
            },
            {
                name: 'Field label cleanup on cmdb_ci_server',
                level: 'low', score: 22, recordCount: 3, daysAgo: 8,
                tables: ['sys_documentation', 'cmdb_ci_server'],
                reasons:
                    'Risk profile based on 3 changes across 2 tables.\n\n' +
                    'Contributing factors:\n' +
                    '• Cosmetic label updates only (+12 pts)\n' +
                    '• No data-model impact detected (+6 pts)\n' +
                    '• Small, isolated change set (+4 pts)',
                recommendations:
                    'Standard peer review is sufficient.\n' +
                    'No special pre-deployment steps required.'
            },
            {
                name: 'Add new choice value to incident state',
                level: 'low', score: 18, recordCount: 2, daysAgo: 9,
                tables: ['sys_choice'],
                reasons:
                    'Risk profile based on 2 changes on 1 table.\n\n' +
                    'Contributing factors:\n' +
                    '• Single new choice value (+10 pts)\n' +
                    '• Existing values untouched (+5 pts)\n' +
                    '• No workflow dependency on the new value (+3 pts)',
                recommendations:
                    'Verify the new state appears in filtered list views.\n' +
                    'Confirm reports referencing state are updated.'
            },
            {
                name: 'Minor copy edits to login page',
                level: 'low', score: 12, recordCount: 2, daysAgo: 10,
                tables: ['sys_ui_macro', 'sys_ui_message'],
                reasons:
                    'Risk profile based on 2 changes across 2 tables.\n\n' +
                    'Contributing factors:\n' +
                    '• Static-string edits only (+8 pts)\n' +
                    '• No script logic changes (+4 pts)',
                recommendations:
                    'Visual QA on the login page before promotion.\n' +
                    'No further review required.'
            },
            {
                name: 'Fix typo in welcome email template',
                level: 'low', score: 6, recordCount: 1, daysAgo: 12,
                tables: ['sys_email_template'],
                reasons:
                    'Risk profile based on 1 change on 1 table.\n\n' +
                    'Contributing factors:\n' +
                    '• Single template typo correction (+6 pts)',
                recommendations:
                    'Send a test email to confirm fix.\n' +
                    'Safe to deploy.'
            }
        ];
    },

    type: 'DemoSeeder'
};
