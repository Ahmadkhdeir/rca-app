var RiskResultWriter = Class.create();
RiskResultWriter.prototype = {
    initialize: function() {},

    TABLE: 'x_488299_change_ri_risk_result',

    /**
     * Inserts or updates a risk analysis result for a given Update Set.
     * Idempotent — re-analyzing the same Update Set overwrites the previous result.
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
        gr.query();

        if (!gr.next()) {
            gr.initialize();
        }

        gr.setValue('update_set', updateSetSysId);
        gr.setValue('risk_level', classification.level);
        gr.setValue('risk_score', scoreResult.total);
        gr.setValue('reasons', classification.reasons);
        gr.setValue('recommendations', classification.recommendations);
        gr.setValue('record_count', summary.recordCount);
        gr.setValue('affected_tables', summary.affectedTables.join(', '));
        gr.setValue('analyzed_by', gs.getUserID());
        gr.setValue('analyzed_at', new GlideDateTime().getValue());

        var resultSysId;
        if (gr.isNewRecord()) {
            resultSysId = gr.insert();
        } else {
            gr.update();
            resultSysId = gr.getUniqueValue();
        }

        return resultSysId;
    },

    type: 'RiskResultWriter',
};
