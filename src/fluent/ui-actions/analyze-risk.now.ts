import '@servicenow/sdk/global'
import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['ua-analyze-risk'],
    name: 'Analyze Risk',
    table: 'sys_update_set',
    active: true,
    showUpdate: true,
    showInsert: false,
    order: 100,
    hint: 'Analyze the risk level of this Update Set',
    condition: "current.state != 'empty'",
    form: {
        showButton: true,
        style: 'primary',
    },
    script: `
var engine = new x_488299_change_ri.ChangeRiskEngine();
var resultSysId = engine.analyze(current.getUniqueValue());

if (resultSysId) {
    action.setRedirectURL('x_488299_change_ri_risk_result.do?sys_id=' + resultSysId);
} else {
    gs.addErrorMessage('Risk analysis failed. Check the system logs for details.');
    action.setRedirectURL(current);
}
`.trim(),
})
