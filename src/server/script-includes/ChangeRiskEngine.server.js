var ChangeRiskEngine = Class.create();
ChangeRiskEngine.prototype = {
    initialize: function() {},

    /**
     * Orchestrates the full risk analysis pipeline for a given Update Set.
     * Returns the sys_id of the persisted risk result record.
     *
     * @param {string} updateSetSysId - sys_id of the sys_update_set record
     * @returns {string} sys_id of the x_488299_change_ri_risk_result record
     */
    analyze: function(updateSetSysId) {
        if (!updateSetSysId) {
            gs.error('ChangeRiskEngine.analyze: updateSetSysId is required', 'ChangeRiskEngine');
            return null;
        }

        var reader = new x_488299_change_ri.UpdateSetReader();
        var summary = reader.read(updateSetSysId);

        var calculator = new x_488299_change_ri.RiskScoreCalculator();
        var scoreResult = calculator.calculate(summary);

        var classifier = new x_488299_change_ri.RiskLevelClassifier();
        var classification = classifier.classify(scoreResult, summary);

        var writer = new x_488299_change_ri.RiskResultWriter();
        var resultSysId = writer.write(updateSetSysId, summary, scoreResult, classification);

        gs.info(
            'ChangeRiskEngine: Analyzed update set "' + summary.updateSetName +
            '" — score=' + scoreResult.total + ', level=' + classification.level,
            'ChangeRiskEngine'
        );

        return resultSysId;
    },

    type: 'ChangeRiskEngine',
};
