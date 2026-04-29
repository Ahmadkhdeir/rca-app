import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['si-demo-seeder'],
    name: 'DemoSeeder',
    active: true,
    accessibleFrom: 'package_private',
    description: 'Seeds the risk_result table with realistic demo data for presentations. Call seed() to insert, clean() to remove.',
    script: Now.include('../../server/script-includes/DemoSeeder.server.js'),
})
