(function syncReviewerAndStatus(current, previous) {
    var updateSetSysId = current.update_set.getValue();

    // Fire in-app notification when reviewer is newly assigned
    if (current.reviewer.changes() && !current.reviewer.nil()) {
        try {
            gs.eventQueue(
                'x_488299_change_ri.reviewer_assigned',
                current,
                current.reviewer.getValue(),
                current.update_set.getDisplayValue()
            );
        } catch (e) { /* event registry entry not yet created — configure in System Policy > Events > Registry */ }
    }

    // Sync review_status to the Update Set whenever it changes on the result
    if (current.review_status.changes() && updateSetSysId) {
        var statusMap = {
            'not_assigned':   'not_reviewed',
            'pending_review': 'pending_review',
            'approved':       'approved',
            'rejected':       'rejected',
        };
        var usStatus = statusMap[current.review_status.getValue()] || 'not_reviewed';

        try {
            var us = new GlideRecord('sys_update_set');
            if (us.get(updateSetSysId)) {
                us.setValue('x_488299_change_ri_review_status', usStatus);
                us.update();
            }
        } catch (e) { /* cross-scope write blocked until access policy is configured */ }
    }
})(current, previous);
