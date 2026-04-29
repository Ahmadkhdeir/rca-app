You are helping me build a custom scoped ServiceNow application
called "Change Risk Analyzer".

Context:
- ServiceNow SDK (Fluent) project
- Code-first only (no Studio)
- Target users: ServiceNow developers
- Focus: analyzing Update Sets (sys_update_set, sys_update_xml)

Goal (v1):
- Analyze an Update Set
- Risk level: Low / Medium / High
- Explain why
- Suggest next actions

Rules:
- Use Script Includes, Tables, UI Actions
- No external dependencies unless I explicitly ask
- Start with architecture, not code