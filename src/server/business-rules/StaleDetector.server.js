(function detectStaleAnalysis(current, previous) {
    var updateSetSysId = current.update_set.getValue();
    if (!updateSetSysId) return;

    // Find the existing risk result for this Update Set
    var gr = new GlideRecord('x_488299_change_ri_risk_result');
    gr.addQuery('update_set', updateSetSysId);
    gr.setLimit(1);
    gr.query();
    if (!gr.next()) return; // No analysis yet — nothing to stale

    // Reset the analysis result back to unreviewed
    gr.setValue('review_status',  'not_assigned');
    gr.setValue('reviewer',       '');
    gr.setValue('reviewer_note',  '');
    gr.update();

    // Flip the Update Set status fields so the form immediately shows stale state
    var us = new GlideRecord('sys_update_set');
    if (us.get(updateSetSysId)) {
        us.setValue('x_488299_change_ri_analyzed_status', 'not_analyzed');
        us.setValue('x_488299_change_ri_review_status',   'not_reviewed');
        us.update();
    }
})(current, previous);
