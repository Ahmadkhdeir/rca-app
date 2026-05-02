import '@servicenow/sdk/global'
import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['br-stale-detector'],
    name: 'CRA – Reset Analysis Status on Update Set Change',
    table: 'sys_update_xml',
    active: true,
    when: 'after',
    order: 100,
    action: ['insert', 'update'],
    script: Now.include('../../server/business-rules/StaleDetector.server.js'),
})
