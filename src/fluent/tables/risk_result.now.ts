import '@servicenow/sdk/global'
import {
    Table,
    StringColumn,
    IntegerColumn,
    DateTimeColumn,
    ReferenceColumn,
    MultiLineTextColumn,
} from '@servicenow/sdk/core'

export const x_488299_change_ri_risk_result = Table({
    name: 'x_488299_change_ri_risk_result',
    label: 'Change Risk Result',
    display: 'update_set',
    autoNumber: {
        prefix: 'CRA',
        number: 1000,
        numberOfDigits: 7,
    },
    schema: {
        update_set: ReferenceColumn({
            label: 'Update Set',
            referenceTable: 'sys_update_set',
            mandatory: true,
        }),
        risk_level: StringColumn({
            label: 'Risk Level',
            mandatory: true,
            choices: {
                low: 'Low',
                medium: 'Medium',
                high: 'High',
            },
        }),
        risk_score: IntegerColumn({
            label: 'Risk Score',
        }),
        reasons: MultiLineTextColumn({
            label: 'Reasons',
        }),
        recommendations: MultiLineTextColumn({
            label: 'Recommendations',
        }),
        record_count: IntegerColumn({
            label: 'Record Count',
        }),
        affected_tables: MultiLineTextColumn({
            label: 'Affected Tables',
        }),
        analyzed_by: ReferenceColumn({
            label: 'Analyzed By',
            referenceTable: 'sys_user',
        }),
        analyzed_at: DateTimeColumn({
            label: 'Analyzed At',
        }),
        reviewer: ReferenceColumn({
            label: 'Reviewer',
            referenceTable: 'sys_user',
        }),
        reviewer_note: StringColumn({
            label: 'Reviewer Note',
            maxLength: 500,
        }),
    },
})
