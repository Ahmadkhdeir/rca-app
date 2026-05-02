import '@servicenow/sdk/global'
import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['br-notify-reviewer'],
    name: 'CRA – Notify Reviewer on Assignment',
    table: 'x_488299_change_ri_risk_result',
    active: true,
    when: 'after',
    order: 100,
    action: ['update'],
    script: Now.include('../../server/business-rules/NotifyReviewer.server.js'),
})
