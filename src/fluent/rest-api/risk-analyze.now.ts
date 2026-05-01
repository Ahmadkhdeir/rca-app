import '@servicenow/sdk/global'
import { RestApi } from '@servicenow/sdk/core'

RestApi({
    $id: Now.ID['api-risk-analyze'],
    name: 'Change Risk Analyzer',
    serviceId: 'risk',
    active: true,
    routes: [
        {
            $id: Now.ID['api-risk-analyze-post'],
            name: 'Analyze Update Set',
            method: 'POST',
            path: '/analyze',
            active: true,
            authentication: true,
            script: Now.include('../../server/rest-api/RiskAnalyzeApi.server.js'),
        },
    ],
})
