import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'app-menu-cra': {
                        table: 'sys_app_application'
                        id: 'fc9d0920e5c744f384c27d5d51e38cd9'
                    }
                    'app-module-analyze': {
                        table: 'sys_app_module'
                        id: 'b8e25c4f7a134d629c8e1f3a45d62e91'
                    }
                    'app-module-dashboard': {
                        table: 'sys_app_module'
                        id: 'd319820b0ba04c588de13a0ae38c61a0'
                    }
                    'app-module-results': {
                        table: 'sys_app_module'
                        id: '58dabbf8d72c4068bae889ec12656efa'
                    }
                    'app-module-update-sets': {
                        table: 'sys_app_module'
                        id: '0df53a981ac94aaf8cb6ac9332276268'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '4855d5927131475dae6985ef3130a49a'
                    }
                    br0: {
                        table: 'sys_script'
                        id: '29c75bd0949345c9aa16d423f827b745'
                        deleted: true
                    }
                    'components/AnalyzePage.css': {
                        table: 'sys_ux_theme_asset'
                        id: '5ca610e74450483a94bce51faba356ca'
                    }
                    cs0: {
                        table: 'sys_script_client'
                        id: 'ccc7261873ca423797b79af663a96343'
                        deleted: true
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '61667f874c2d47fb935b2c4e0e1cbd4b'
                    }
                    'si-change-risk-engine': {
                        table: 'sys_script_include'
                        id: '2d4e6e9bb090444c998e6ab5c1563fad'
                    }
                    'si-demo-seeder': {
                        table: 'sys_script_include'
                        id: 'a3f7c92e1b8d4e6f95b27c4a6d3e8f12'
                    }
                    'si-risk-level-classifier': {
                        table: 'sys_script_include'
                        id: '658116d5aa8a40a3914edca4c364cdef'
                    }
                    'si-risk-result-writer': {
                        table: 'sys_script_include'
                        id: '6a5f9eb0013545af88846cf36fd534c6'
                    }
                    'si-risk-score-calculator': {
                        table: 'sys_script_include'
                        id: '461a252447aa4e189d6ff91b17f280eb'
                    }
                    'si-update-set-reader': {
                        table: 'sys_script_include'
                        id: '39eadbc2463046958a5c9934c31905c7'
                    }
                    src_server_script_js: {
                        table: 'sys_module'
                        id: 'b74a2799a81946b98ba4f68641064d74'
                        deleted: true
                    }
                    'src_server_script-includes_ChangeRiskEngine_server_js': {
                        table: 'sys_module'
                        id: '9a1e35f9cf1041579eec0851ec4f17b9'
                        deleted: false
                    }
                    'src_server_script-includes_DemoSeeder_server_js': {
                        table: 'sys_module'
                        id: '7e0cd18a52184d419c64eb8e3863c288'
                    }
                    'src_server_script-includes_RiskLevelClassifier_server_js': {
                        table: 'sys_module'
                        id: '65b27c7663f742d1a1ddc7b1ca973baf'
                        deleted: false
                    }
                    'src_server_script-includes_RiskResultWriter_server_js': {
                        table: 'sys_module'
                        id: 'b7a31c42932d488583c9a9ac020017fa'
                        deleted: false
                    }
                    'src_server_script-includes_RiskScoreCalculator_server_js': {
                        table: 'sys_module'
                        id: 'e1fe71bbaa4843c1806b5d1d91549511'
                        deleted: false
                    }
                    'src_server_script-includes_UpdateSetReader_server_js': {
                        table: 'sys_module'
                        id: '9efcf1a754bf464cb965c09ccacc85dd'
                        deleted: false
                    }
                    'ua-analyze-risk': {
                        table: 'sys_ui_action'
                        id: 'c10e8ce4af96468abeb94998ad971b0a'
                    }
                }
                composite: [
                    {
                        table: 'sys_documentation'
                        id: '0045775cc3fe4ddc840e5a700139bf53'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'update_set'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '0340781585484dec84e339c632269fe3'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '05c32c34b11143648155dd64c5109f39'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'update_set'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0d51bfa069ca44a9b96e7db631ea4001'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'affected_tables'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '14adc73aac64464ea20ee781f85c2731'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'risk_level'
                            value: 'medium'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '250a923409e84df0bbff748bc545a038'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '29f8202ae91d471192078ca73302e3ef'
                        key: {
                            application_file: 'a7c2a8202e1645ed97be704564d2be3c'
                            source_artifact: '99f245b8bada4e90a27342964090c7bf'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3b158a84290c44d38c5f5b562a68bd60'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'analyzed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4bdd0ae18b73414a8e1fded2cb57f61b'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'reasons'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '50295924631e4391979ccfa94d1ed61b'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'risk_score'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '51cc592271e14f928c1fccf4016e207e'
                        key: {
                            application_file: 'e71301f883ab4bc0adc7789c57597c7d'
                            source_artifact: '99f245b8bada4e90a27342964090c7bf'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '57d28bec23c146eb9d75dd77cb9dda36'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'record_count'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5c84d22ffe974768a9a35257a05a6a43'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'risk_level'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '612aa5b6442c4ced89c2e461040cf7a8'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'analyzed_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '698a9a8eab6f4a408dd3b605a94de3b6'
                        key: {
                            application_file: 'add79c31b59343d78d3581a2648ee47a'
                            source_artifact: '99f245b8bada4e90a27342964090c7bf'
                        }
                    },
                    {
                        table: 'sys_number'
                        id: '6f86d35b831a4c4391cf98fe718f98e1'
                        key: {
                            category: 'x_488299_change_ri_risk_result'
                            prefix: 'CRA'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '83cf5166e2ac43ecbfda04326f0e070e'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '86b94e7c53b14b0a897dba6580899a1d'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'record_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '96f7d47e8d6b44bcbf7ffd87227d2e20'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'risk_level'
                            value: 'low'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9743b9f5fc3648b98035dfe916d9a8e1'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'affected_tables'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: '99f245b8bada4e90a27342964090c7bf'
                        key: {
                            name: 'x_488299_change_ri_dashboard.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'a75ddf87e20c43e9b0397a3baa16b545'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'risk_level'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: 'a7c2a8202e1645ed97be704564d2be3c'
                        key: {
                            endpoint: 'x_488299_change_ri_dashboard.do'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'add79c31b59343d78d3581a2648ee47a'
                        key: {
                            name: 'x_488299_change_ri/main'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ae7cf9cf4c0841e48a3fee10cc0cc54a'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'reasons'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'afbd6d857ecf41679892bb3aeae31b0c'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'risk_level'
                            value: 'high'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b150293cb3f24ae8986bcd0129fab443'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'analyzed_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c9c19030b2a841909fd4264943f25f17'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'recommendations'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ceadb589ed7d415db32800b622d21ae9'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'recommendations'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cfa407cb2e5a48388b1132640f8953cc'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'risk_score'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd9d3f2831663418ea824258ee26ab1e5'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'risk_level'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dccd09b416a141938ada999cc2b884d5'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'analyzed_by'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e71301f883ab4bc0adc7789c57597c7d'
                        key: {
                            name: 'x_488299_change_ri/main.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fdd486c5dea34966aca7df40e6dd83b6'
                        key: {
                            name: 'x_488299_change_ri_risk_result'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                ]
            }
        }
    }
}
