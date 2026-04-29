var RiskLevelClassifier = Class.create();
RiskLevelClassifier.prototype = {
    initialize: function() {},

    THRESHOLDS: {
        LOW_MAX: 30,
        MEDIUM_MAX: 65,
    },

    /**
     * Converts a raw score and factor list into a risk level, a plain-English
     * reason summary, and actionable recommendations.
     *
     * @param {object} scoreResult - output from RiskScoreCalculator.calculate()
     * @param {object} summary     - output from UpdateSetReader.read()
     * @returns {object} { level, reasons, recommendations }
     */
    classify: function(scoreResult, summary) {
        var total = scoreResult.total;
        var factors = scoreResult.factors;
        var level;

        if (total <= this.THRESHOLDS.LOW_MAX) {
            level = 'low';
        } else if (total <= this.THRESHOLDS.MEDIUM_MAX) {
            level = 'medium';
        } else {
            level = 'high';
        }

        var reasons = this._buildReasons(level, total, factors, summary);
        var recommendations = this._buildRecommendations(level, scoreResult, summary);

        return {
            level: level,
            reasons: reasons,
            recommendations: recommendations,
        };
    },

    _buildReasons: function(level, total, factors, summary) {
        var lines = [];
        lines.push('Risk score: ' + total + ' (' + level.toUpperCase() + ')');
        lines.push('Update Set "' + summary.updateSetName + '" contains ' + summary.recordCount + ' change record(s) across ' + summary.affectedTables.length + ' table(s).');

        if (factors.length === 0) {
            lines.push('No significant risk factors were identified.');
        } else {
            lines.push('Contributing factors:');
            for (var i = 0; i < factors.length; i++) {
                var sign = factors[i].points > 0 ? '+' : '';
                lines.push('  • ' + factors[i].label + ' (' + sign + factors[i].points + ' pts)');
            }
        }

        return lines.join('\n');
    },

    _buildRecommendations: function(level, scoreResult, summary) {
        var recs = [];

        if (level === 'low') {
            recs.push('Standard review is sufficient.');
            recs.push('Deploy to a sub-production environment and run basic smoke tests before pushing to production.');
        } else if (level === 'medium') {
            recs.push('Peer review by a second developer is recommended before deployment.');
            recs.push('Run full ATF test suite in a sub-production environment.');
            if (summary.hasScriptRecords) {
                recs.push('Review all server-side script changes for logic errors and missing null checks.');
            }
            recs.push('Schedule deployment during a low-traffic window.');
        } else {
            recs.push('Mandatory change advisory board (CAB) review required before deployment.');
            recs.push('Full regression test suite must pass in a production-equivalent environment.');
            if (summary.hasSecurityRecords) {
                recs.push('Security team sign-off required — this Update Set modifies access control records.');
            }
            if (summary.hasCriticalTables) {
                recs.push('Platform architect review required — critical platform tables are being modified: ' + summary.criticalTablesFound.join(', ') + '.');
            }
            if (summary.hasDeleteActions) {
                recs.push('Verify all DELETE operations are intentional and will not orphan related records.');
            }
            recs.push('Consider splitting this Update Set into smaller, targeted sets to reduce blast radius.');
            recs.push('Prepare and test a rollback plan before deploying.');
        }

        return recs.join('\n');
    },

    type: 'RiskLevelClassifier',
};
