import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['si-update-set-reader'],
    name: 'UpdateSetReader',
    active: true,
    accessibleFrom: 'public',
    description: 'Reads sys_update_xml records for an Update Set and returns a structured summary for the risk analysis pipeline.',
    script: Now.include('../../server/script-includes/UpdateSetReader.server.js'),
})
