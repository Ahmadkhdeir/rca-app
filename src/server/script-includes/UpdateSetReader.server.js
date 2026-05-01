var UpdateSetReader = Class.create();
UpdateSetReader.prototype = {
    initialize: function() {},

    /**
     * Reads all sys_update_xml records for a given update set and returns a
     * structured summary used by the scoring pipeline.
     *
     * @param {string} updateSetSysId - sys_id of the sys_update_set record
     * @returns {object} summary
     */
    read: function(updateSetSysId) {
        var summary = {
            updateSetSysId: updateSetSysId,
            updateSetName: '',
            recordCount: 0,
            affectedTables: [],
            updateTypes: [],
            payloadTypes: [],
            hasScriptRecords: false,
            hasCriticalTables: false,
            hasSecurityRecords: false,
            hasDeleteActions: false,
            criticalTablesFound: [],
        };

        // Critical table list — changes to these indicate higher risk
        var criticalTables = [
            'sys_script_include',
            'sys_business_rule',
            'sys_security_acl',
            'sys_db_object',
            'sys_ui_policy',
            'sys_transform_map',
            'sys_transform_script',
            'sys_ws_definition',
            'sys_ws_operation',
            'sys_scope',
        ];

        var securityTables = [
            'sys_security_acl',
            'sys_user_role',
            'sys_group_has_role',
            'sys_user_has_role',
        ];

        var scriptTables = [
            'sys_script_include',
            'sys_business_rule',
            'sys_script',
            'sys_script_fix',
        ];

        // Fetch the update set name
        var updateSetGr = new GlideRecord('sys_update_set');
        if (updateSetGr.get(updateSetSysId)) {
            summary.updateSetName = updateSetGr.getDisplayValue('name');
        }

        // Aggregate table and type info from sys_update_xml
        var tableSet = {};
        var typeSet = {};
        var payloadTypeSet = {};
        var criticalSet = {};

        var xmlGr = new GlideRecord('sys_update_xml');
        xmlGr.addQuery('update_set', updateSetSysId);
        xmlGr.query();

        while (xmlGr.next()) {
            summary.recordCount++;

            var rawName = xmlGr.getValue('name') || '';
            // sys_update_xml.name is "<table_name>_<32-char-sys_id>" — strip the sys_id suffix
            var table = rawName.replace(/_[0-9a-f]{32}$/i, '') || rawName;
            var action = xmlGr.getValue('action') || '';
            var type = xmlGr.getValue('type') || '';

            if (table) tableSet[table] = true;
            if (action) typeSet[action] = true;
            if (type) payloadTypeSet[type] = true;

            if (action === 'DELETE') {
                summary.hasDeleteActions = true;
            }

            if (criticalTables.indexOf(table) !== -1) {
                summary.hasCriticalTables = true;
                criticalSet[table] = true;
            }

            if (securityTables.indexOf(table) !== -1) {
                summary.hasSecurityRecords = true;
            }

            if (scriptTables.indexOf(table) !== -1) {
                summary.hasScriptRecords = true;
            }
        }

        summary.affectedTables = Object.keys(tableSet);
        summary.updateTypes = Object.keys(typeSet);
        summary.payloadTypes = Object.keys(payloadTypeSet);
        summary.criticalTablesFound = Object.keys(criticalSet);

        return summary;
    },

    type: 'UpdateSetReader',
};
