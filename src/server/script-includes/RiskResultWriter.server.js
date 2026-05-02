var RiskResultWriter = Class.create();
RiskResultWriter.prototype = {
    initialize: function() {},

    TABLE:    'x_488299_change_ri_risk_result',
    US_TABLE: 'sys_update_set',

    /**
     * Upserts a risk analysis result for the given Update Set.
     * One result per Update Set — re-analysis overwrites the previous result
     * and resets the reviewer so the new result can be reviewed fresh.
     *
     * @param {string} updateSetSysId - sys_id of the analyzed Update Set
     * @param {object} summary        - from UpdateSetReader.read()
     * @param {object} scoreResult    - from RiskScoreCalculator.calculate()
     * @param {object} classification - from RiskLevelClassifier.classify()
     * @returns {string} sys_id of the result record
     */
    write: function(updateSetSysId, summary, scoreResult, classification) {
        var gr = new GlideRecord(this.TABLE);
        gr.addQuery('update_set', updateSetSysId);
        gr.setLimit(1);
        gr.query();

        var isNew = !gr.next();
        if (isNew) gr.initialize();

        gr.setValue('update_set',       updateSetSysId);
        gr.setValue('risk_level',       classification.level);
        gr.setValue('risk_score',       scoreResult.total);
        gr.setValue('reasons',          classification.reasons);
        gr.setValue('recommendations',  classification.recommendations);
        gr.setValue('record_count',     summary.recordCount);
        gr.setValue('affected_tables',  summary.affectedTables.join(', '));
        gr.setValue('analyzed_by',      gs.getUserID());
        gr.setValue('analyzed_at',      new GlideDateTime().getValue());
        // Reset review on re-analysis — new result needs a fresh review
        gr.setValue('review_status',    'not_assigned');
        gr.setValue('reviewer',         '');
        gr.setValue('reviewer_note',    '');

        var resultSysId;
        if (isNew) {
            resultSysId = gr.insert();
        } else {
            gr.update();
            resultSysId = gr.getUniqueValue();
        }

        try { this._stampUpdateSet(updateSetSysId, 'analyzed', 'not_reviewed'); } catch (e) { /* cross-scope write may be blocked until access policy is configured */ }
        return resultSysId;
    },

    _stampUpdateSet: function(updateSetSysId, analyzedStatus, reviewStatus) {
        var us = new GlideRecord(this.US_TABLE);
        if (!us.get(updateSetSysId)) return;
        us.setValue('x_488299_change_ri_analyzed_status', analyzedStatus);
        us.setValue('x_488299_change_ri_review_status',  reviewStatus);
        us.update();
    },

    type: 'RiskResultWriter',
};
