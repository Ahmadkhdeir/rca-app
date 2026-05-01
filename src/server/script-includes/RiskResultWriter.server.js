var RiskResultWriter = Class.create();
RiskResultWriter.prototype = {
    initialize: function() {},

    TABLE: 'x_488299_change_ri_risk_result',

    /**
     * Inserts a new risk analysis result record for a given Update Set.
     * Each analysis run produces its own record — history is preserved.
     *
     * @param {string} updateSetSysId - sys_id of the analyzed Update Set
     * @param {object} summary        - from UpdateSetReader.read()
     * @param {object} scoreResult    - from RiskScoreCalculator.calculate()
     * @param {object} classification - from RiskLevelClassifier.classify()
     * @returns {string} sys_id of the new result record
     */
    write: function(updateSetSysId, summary, scoreResult, classification) {
        var gr = new GlideRecord(this.TABLE);
        gr.initialize();

        gr.setValue('update_set', updateSetSysId);
        gr.setValue('risk_level', classification.level);
        gr.setValue('risk_score', scoreResult.total);
        gr.setValue('reasons', classification.reasons);
        gr.setValue('recommendations', classification.recommendations);
        gr.setValue('record_count', summary.recordCount);
        gr.setValue('affected_tables', summary.affectedTables.join(', '));
        gr.setValue('analyzed_by', gs.getUserID());
        gr.setValue('analyzed_at', new GlideDateTime().getValue());

        return gr.insert();
    },

    type: 'RiskResultWriter',
};
