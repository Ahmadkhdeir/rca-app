(function process(request, response) {
    try {
        var body = request.body.data;
        var updateSetSysId = body && body.update_set_sys_id;

        if (!updateSetSysId) {
            response.setStatus(400);
            response.setBody({ error: 'update_set_sys_id is required' });
            return;
        }

        var reader = new UpdateSetReader();
        var summary = reader.read(updateSetSysId);

        var calculator = new RiskScoreCalculator();
        var scoreResult = calculator.calculate(summary);

        var classifier = new RiskLevelClassifier();
        var classification = classifier.classify(scoreResult, summary);

        var writer = new RiskResultWriter();
        var resultSysId = writer.write(updateSetSysId, summary, scoreResult, classification);

        // Count business rule modifications
        // sys_update_xml.name is "<table>_<sys_id>", so use STARTSWITH not exact match
        var rulesGa = new GlideAggregate('sys_update_xml');
        rulesGa.addQuery('update_set', updateSetSysId);
        rulesGa.addQuery('name', 'STARTSWITH', 'sys_business_rule_');
        rulesGa.addAggregate('COUNT');
        rulesGa.query();
        var rulesCount = rulesGa.next() ? parseInt(rulesGa.getAggregate('COUNT')) : 0;

        // Count ACL modifications
        var aclGa = new GlideAggregate('sys_update_xml');
        aclGa.addQuery('update_set', updateSetSysId);
        aclGa.addQuery('name', 'STARTSWITH', 'sys_security_acl_');
        aclGa.addAggregate('COUNT');
        aclGa.query();
        var aclCount = aclGa.next() ? parseInt(aclGa.getAggregate('COUNT')) : 0;

        var factors = [];
        for (var i = 0; i < scoreResult.factors.length; i++) {
            factors.push({
                label: scoreResult.factors[i].label,
                pts: scoreResult.factors[i].points,
            });
        }

        var recs = classification.recommendations
            .split('\n')
            .filter(function (s) { return s.trim().length > 0; });

        response.setStatus(200);
        response.setBody({
            result_sys_id: resultSysId,
            risk_level: classification.level,
            risk_score: scoreResult.total,
            record_count: summary.recordCount,
            affected_tables: summary.affectedTables,
            sensitive_tables_count: summary.criticalTablesFound.length,
            rules_count: rulesCount,
            acl_count: aclCount,
            factors: factors,
            recommendations: recs,
        });
    } catch (e) {
        response.setStatus(500);
        response.setBody({ error: e.message || 'Analysis failed' });
    }
})(request, response);
