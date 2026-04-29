import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['si-risk-result-writer'],
    name: 'RiskResultWriter',
    active: true,
    accessibleFrom: 'public',
    description: 'Persists risk analysis results to x_488299_change_ri_risk_result. Idempotent — re-analysis overwrites the previous result.',
    script: Now.include('../../server/script-includes/RiskResultWriter.server.js'),
})
