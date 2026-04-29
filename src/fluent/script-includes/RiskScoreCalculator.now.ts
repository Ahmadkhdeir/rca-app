import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['si-risk-score-calculator'],
    name: 'RiskScoreCalculator',
    active: true,
    accessibleFrom: 'public',
    description: 'Applies weighted scoring rules to an UpdateSetReader summary and returns a numeric risk score with factor breakdown.',
    script: Now.include('../../server/script-includes/RiskScoreCalculator.server.js'),
})
