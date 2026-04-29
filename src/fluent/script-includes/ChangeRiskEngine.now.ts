import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['si-change-risk-engine'],
    name: 'ChangeRiskEngine',
    active: true,
    accessibleFrom: 'public',
    description: 'Orchestrates the full risk analysis pipeline: reads update set → scores → classifies → persists result. Entry point for all callers.',
    script: Now.include('../../server/script-includes/ChangeRiskEngine.server.js'),
})
