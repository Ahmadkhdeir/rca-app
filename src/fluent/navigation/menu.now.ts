import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'

const appMenu = ApplicationMenu({
    $id: Now.ID['app-menu-cra'],
    title: 'Change Risk Analyzer',
    active: true,
})

Record({
    $id: Now.ID['app-module-dashboard'],
    table: 'sys_app_module',
    data: {
        title: 'Risk Dashboard',
        application: appMenu,
        link_type: 'DIRECT',
        query: 'x_488299_change_ri_dashboard.do',
        hint: 'View the risk analysis dashboard',
        active: true,
        order: 100,
    },
})

Record({
    $id: Now.ID['app-module-analyze'],
    table: 'sys_app_module',
    data: {
        title: 'Analyze Update Set',
        application: appMenu,
        link_type: 'DIRECT',
        query: 'x_488299_change_ri_dashboard.do?view=analyze',
        hint: 'Run a live risk analysis on an Update Set',
        active: true,
        order: 150,
    },
})

Record({
    $id: Now.ID['app-module-update-sets'],
    table: 'sys_app_module',
    data: {
        title: 'Update Sets',
        application: appMenu,
        link_type: 'LIST',
        name: 'sys_update_set',
        hint: 'Manage and analyze Update Sets',
        active: true,
        order: 200,
    },
})

Record({
    $id: Now.ID['app-module-results'],
    table: 'sys_app_module',
    data: {
        title: 'Risk Results',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_488299_change_ri_risk_result',
        hint: 'View all risk analysis results',
        active: true,
        order: 300,
    },
})
