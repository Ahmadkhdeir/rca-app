var RiskScoreCalculator = Class.create();
RiskScoreCalculator.prototype = {
    initialize: function() {},

    /**
     * Applies weighted scoring rules to the UpdateSetReader summary.
     * Returns a score object with a total and a breakdown of contributing factors.
     *
     * @param {object} summary - output from UpdateSetReader.read()
     * @returns {object} { total: number, factors: Array<{label, points}> }
     */
    calculate: function(summary) {
        var factors = [];
        var total = 0;

        function add(label, points) {
            if (points !== 0) {
                factors.push({ label: label, points: points });
                total += points;
            }
        }

        // Record volume
        if (summary.recordCount > 100) {
            add('More than 100 update records', 30);
        } else if (summary.recordCount > 50) {
            add('More than 50 update records', 20);
        } else if (summary.recordCount > 20) {
            add('More than 20 update records', 10);
        }

        // Table diversity
        var tableCount = summary.affectedTables.length;
        if (tableCount > 15) {
            add('Touches more than 15 distinct tables', 20);
        } else if (tableCount > 10) {
            add('Touches more than 10 distinct tables', 10);
        } else if (tableCount > 5) {
            add('Touches more than 5 distinct tables', 5);
        }

        // Critical infrastructure tables
        if (summary.criticalTablesFound.length > 0) {
            var criticalNames = summary.criticalTablesFound.join(', ');
            add('Modifies critical platform tables (' + criticalNames + ')', summary.criticalTablesFound.length * 20);
        }

        // Security records
        if (summary.hasSecurityRecords) {
            add('Contains security / access control changes', 25);
        }

        // Script records (business rules, script includes, etc.)
        if (summary.hasScriptRecords) {
            add('Contains server-side script changes', 15);
        }

        // DELETE operations
        if (summary.hasDeleteActions) {
            add('Includes record deletion actions', 20);
        }

        // Pure config bonus (no scripts — lower risk)
        if (!summary.hasScriptRecords && !summary.hasCriticalTables && summary.recordCount <= 20) {
            add('Configuration-only changes (no scripts)', -10);
        }

        if (total < 0) total = 0;

        return { total: total, factors: factors };
    },

    type: 'RiskScoreCalculator',
};
