import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import page from '../../client/index.html'

export const dashboard = UiPage({
    $id: Now.ID['ui-page-dashboard'],
    endpoint: 'x_488299_change_ri_dashboard.do',
    html: page,
    direct: true,
})
