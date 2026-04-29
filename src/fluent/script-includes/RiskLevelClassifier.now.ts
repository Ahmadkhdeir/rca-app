import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['si-risk-level-classifier'],
    name: 'RiskLevelClassifier',
    active: true,
    accessibleFrom: 'public',
    description: 'Maps a numeric risk score to Low/Medium/High and generates plain-English reasons and recommendations.',
    script: Now.include('../../server/script-includes/RiskLevelClassifier.server.js'),
})
