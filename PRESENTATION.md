# Change Risk Analyzer — Team-Präsentation

> Custom Scoped ServiceNow Application zur automatisierten Risiko-Analyse von Update Sets — mit interaktivem React-Frontend und integrierter AI-Schicht.

---

## 1. Was ist die App?

| | |
|---|---|
| **Name** | Change Risk Analyzer |
| **Scope** | `x_488299_change_ri` |
| **Plattform** | ServiceNow (Custom Scoped Application) |
| **Build-Methode** | Vollständig **code-first** mit dem **ServiceNow SDK (Fluent / TypeScript)** — kein Studio, alles in Git versionierbar, deploybar via CLI |
| **Zielgruppe** | ServiceNow-Entwickler, Change-Reviewer, Security Leads |

---

## 2. Was macht die App?

Sie analysiert **Update Sets** *bevor* sie deployed werden und gibt dem Entwickler eine **Risiko-Einschätzung**, damit unsichere Changes nicht ungeprüft in Test/Prod landen.

**Drei Wege, um eine Analyse zu starten:**

1. **„Analyze Risk"-Button** im `sys_update_set`-Form-Header (klassischer SN-Workflow)
2. **Custom Analyze-Page** im UI mit Live-Animationen (Picker → Analyse → Ergebnis → Action-Panel)
3. **AI Chat Sidebar** (überall verfügbar) für Ad-hoc-Fragen über jede beliebige Analyse

**Klassifizierung:**

| Score | Level |
|-------|-------|
| ≤ 30 | 🟢 Low |
| 31–65 | 🟡 Medium |
| > 65 | 🔴 High |

---

## 3. Architektur (Backend)

Klare **Pipeline / Single-Responsibility**, alles als Script Includes:

```
[UI Action: Analyze Risk]   [Custom Analyze-Page]
            ↓                         ↓
            ChangeRiskEngine  ←  Orchestrator
                ├──→ UpdateSetReader        (liest sys_update_xml)
                ├──→ RiskScoreCalculator    (gewichtete Bewertung)
                ├──→ RiskLevelClassifier    (Score → Low/Med/High)
                └──→ RiskResultWriter       (speichert Ergebnis)
                        ↓
           x_488299_change_ri_risk_result   (Custom Table)
```

**Zusätzlich:** `DemoSeeder` — befüllt die Tabelle mit 12 realistischen Demo-Datensätzen für Präsentationen.

### Komponenten

| Script Include | Verantwortung |
|---|---|
| `ChangeRiskEngine` | Orchestriert die Pipeline |
| `UpdateSetReader` | Liest alle `sys_update_xml`-Records eines Update Sets |
| `RiskScoreCalculator` | Wendet gewichtete Regeln an, summiert Punkte |
| `RiskLevelClassifier` | Mappt Score auf Low/Medium/High + generiert Reasons & Recommendations |
| `RiskResultWriter` | Upsert in Custom Table |
| `DemoSeeder` | Generiert 12 Demo-Datensätze für Präsentationen |

---

## 4. Tabellen

### Custom Table: `x_488299_change_ri_risk_result`

| Feld | Typ | Zweck |
|------|-----|-------|
| `number` | String | Auto-Number `CRA0001000…` |
| `update_set` | Reference → `sys_update_set` | Welches Update Set analysiert wurde |
| `risk_level` | Choice (low / medium / high) | Klassifizierung |
| `risk_score` | Integer | Numerischer Score |
| `record_count` | Integer | Anzahl Update-Einträge |
| `affected_tables` | String | Liste betroffener Tabellen |
| `reasons` | Long String | Faktoren mit `(+N pts)`-Beitrag |
| `recommendations` | Long String | Vorschläge für nächste Schritte |
| `analyzed_by` | Reference → `sys_user` | Wer es ausgeführt hat |
| `analyzed_at` | DateTime | Wann |

### Genutzte System-Tabellen (read-only)

- `sys_update_set` — Quelle der Update Sets
- `sys_update_xml` — Einzeleinträge eines Update Sets

---

## 5. Frontend (Custom UI Page)

| | |
|---|---|
| **Endpoint** | `x_488299_change_ri_dashboard.do` |
| **Stack** | **React 18 + TypeScript** als BYOUI |
| **Bundling** | Direkt durch das ServiceNow SDK |
| **Datenzugriff** | Standard ServiceNow REST API |
| **Charts** | 100% custom SVG — keine externen Libraries |

### Vier Views (Single-Page-App, History-API-Routing)

#### 1. Dashboard (`?view=dashboard`)

- **Hero-Header** mit dunkler Gradient-Banner und animierter Risiko-Verteilungs-Bar
- **4 animierte Stat-Cards**: Total / High / Medium / Low (mit Counter-Animation und gradient Bottom-Bar)
- **Score Trend Chart** — SVG-Bar-Chart der letzten 20 Analysen, farbcodiert, mit Hover-Tooltip und Threshold-Linien bei 30 / 65
- **Risk Distribution** — animierter Donut-Chart mit Glow-Effekt für High-Risk + Legend mit Mini-Progress-Bars
- **Recent Analyses** — letzte 6 Analysen als Mini-Cards
- **„DEMO DATA"-Badge** — automatisches Fallback auf 12 Mock-Datensätze, wenn die Tabelle leer ist (für Präsentationen)
- **„How it works"** — 3-Schritt-Onboarding

#### 2. Analyze (`?view=analyze`) ⭐ NEU

Live-Analyse-Erlebnis mit visuellem Storytelling:

- **Searchable Update Set Picker** mit State-Badges (In progress / Complete) und Change-Count
- **„▶ Run Analysis"-Button** — startet die Analyse
- **6-Stage Live Progress** — jede Stage als Card:
  1. 🔍 Reading update set
  2. 🧮 Scanning sensitive tables
  3. ⚙ Evaluating business rules
  4. 🛡 Checking ACL changes
  5. 📊 Calculating risk score
  6. 🏷 Classifying risk level

  Status: Pending → Running (bouncing icon + sliding progress bar) → Done (Check-Pop-In + Fakten)

- **Result-Card** fliegt animiert ein:
  - Großer Score-Gauge mit Counter-Animation
  - Risk-Level-Badge (mit Pulse-Animation für High)
  - Risk Factors als horizontale Bars mit Punkte-Beitrag
  - Recommended Actions als Cards
  - Affected Tables als Tags

- **AI Explain Panel** (siehe Abschnitt 7)

- **Action Panel** mit 3 Buttons:
  - 👤 **Assign Reviewer** — Modal mit 5 Reviewern (Avatar + Rolle), optionale Note → Toast + Badge
  - 📋 **Create Change Ticket** — generiert Fake-`CHG`-Nummer + Toast
  - 👁 **Mark as Acknowledged** — Toggle mit Checkmark

- **Toast-Notifications** sliden von unten ein

#### 3. Analyses List (`?view=list`)

- Alle Analysen, filterbar (All / High / Medium / Low) als Pill-Buttons
- Karten mit Score-Bar, animiertem Pulse-Indicator bei High-Risk

#### 4. Analysis Detail (`?view=detail&id=...`)

- Hero mit Risiko-Level-Badge und großem Score-Gauge
- Risk Factors als horizontale Bars mit Punkte-Beitrag
- Affected Tables als Tags
- Recommended Actions
- **AI Explain Panel** (kontextuell)

---

## 6. Navigation in ServiceNow

Application Menu **„Change Risk Analyzer"** mit 4 Modulen:

- **Dashboard** → öffnet die Custom UI Page
- **Analyze Update Set** → öffnet die Live-Analyse-Page direkt
- **Risk Results** → Standard List View der Custom Table
- **Update Sets** → Direkt-Link zu `sys_update_set_list.do`

---

## 7. AI-Integration ⭐ NEU

Zwei AI-Features sind in die App integriert (UI-mocked für v1, ready für Live-Anbindung an Claude/GPT API in v2):

### 7.1. AI Explain Panel

**Wo:** Auf jeder Analyse-Result-View (Analyze-Page + Detail-Page).

**Was:** Großer „✨ Explain with AI"-Button. Klick →

1. **Thinking-Phase** mit shimmer-Effekt und bouncing Dots (~700ms)
2. **Streaming-Text** Zeichen-für-Zeichen (wie ChatGPT) — generiert eine 2-Absatz-Erklärung in plain English über *warum* dieser Change risikoreich ist und *was* schiefgehen könnte
3. **Suggested Reviewer** Card slidet ein mit:
   - Avatar + Name + Rolle
   - Confidence-Badge („94% match")
   - Begründung in italics
4. **Footer** mit Mock-Metadaten: `claude-sonnet-4-6 · 247 tokens · 1.2s`
5. **Regenerate**- und **Copy**-Buttons

**Demo-Talk-Track:**
> „Der Score ist deterministisch — auditierbar, reproduzierbar. Aber die *Erklärung* ist generativ. Das LLM bekommt die strukturierten Faktoren als Kontext und produziert governance-fähige Narrative. Außerdem schlägt es den passendsten Reviewer vor — basierend auf Change-Profil und der historischen Review-Aktivität des Teams."

### 7.2. AI Chat Sidebar (Floating Assistant)

**Wo:** Bottom-right Floating Action Button — auf jeder Page verfügbar.

**Was:**
- **Pulsierender Sparkle-Button** mit Gradient
- Klick → **Slide-In Drawer von rechts** (440px breit) mit blurred Backdrop
- **Header** mit deep purple→pink Gradient + Modell-Name `claude-sonnet-4-6 · streaming`
- **Context-Bar** zeigt automatisch den aktuellen Kontext an (passt sich beim Page-Wechsel an):
  - Dashboard → „Your full risk portfolio"
  - Detail → „This analysis"
  - Analyze → „The current analysis"
  - List → „All analyses"
- **Welcome-State** mit 4 kontext-spezifischen Suggested Prompts als Cards
- **Chat-UI** mit User- und Assistant-Bubbles (lila Gradient für User, lavender für AI)
- **Streaming Responses** mit Thinking-Pause + Cursor-Animation
- **Quick-Suggestion-Strip** unter den Messages
- **Footer-Toolbar** mit Attach-Icon, Input, Voice-Icon, Gradient Send-Button

**12 vor-geschriebene Mock-Antworten** decken die wichtigsten Prompts ab (Pattern-Matching auf Keywords):
- *„What is my biggest risk pattern this week?"*
- *„Compare this week to last week"*
- *„Why is this change risky?"*
- *„Suggest a reviewer"*
- *„Draft a change ticket description"*
- *„What is the rollback plan?"*
- *„Explain the scoring methodology"*
- *„What would lower this score?"*
- *„Find similar past analyses"*
- *„Show only changes that touch ACLs"*
- … und mehr

**Demo-Talk-Track:**
> „Jede Page hat den AI-Assistant verfügbar. Achtet darauf, wie sich der Kontext automatisch ändert, wenn ich navigiere — er weiß, ob ich gerade *eine einzelne Analyse* anschaue oder das *gesamte Portfolio*. Aktuell sind es Mock-Antworten für die Demo, aber die Struktur ist bereit: Sobald wir an die Claude API anbinden, bekommt das Modell die volle strukturierte Daten-Sicht von dem, was der User gerade sieht, als Kontext."

---

## 8. Tech-Highlights

- **0 externe Runtime-Dependencies** außer React/ReactDOM
- **Charts vollständig in SVG** — keine D3, keine Chart.js → klein, schnell, kontrollierbar
- **CSS Custom Properties** für konsistentes Design-System
- **Animationen** durchgängig: Counter, staggered fade-ins, scaleY-Bar-Wachstum, Pulse, Streaming-Cursor
- **Type-safe** vom Backend bis zum Frontend (TypeScript überall)
- **Reproduzierbar** über `npm run build` + `now-sdk install`
- **AI-ready Architektur**: Score (deterministisch) und Erklärung (generativ) sind sauber getrennt — auditierbar

---

## 9. Demo-Flow für die Präsentation

**Empfohlene Reihenfolge:**

1. **Dashboard öffnen** (`/x_488299_change_ri_dashboard.do`) → Stat-Cards animieren, Trend-Chart und Donut zeigen 12 Demo-Analysen
2. **AI-Sidebar öffnen** (Floating Button bottom-right) → fragen: *„What is my biggest risk pattern this week?"* → Streaming-Response
3. **„Analyze"-Tab klicken** → Update Set picken → **Run Analysis** → Live-Stages laufen durch → Result fliegt ein
4. **„✨ Explain with AI"** klicken → AI-Erklärung streamt → Suggested Reviewer erscheint
5. **„Assign Reviewer"** → Modal → Sarah Chen auswählen → Toast erscheint
6. **„Create Change Ticket"** → CHG-Nummer wird generiert → Toast
7. **Auf eine Analyse klicken** (Analyses-List) → Detail-View mit AI-Panel auf der rechten Seite
8. **Echte Demo:** Update Set in SN öffnen → **„Analyze Risk"** klicken → reales Resultat erscheint

> **Tipp:** Vor der Präsentation den `DemoSeeder` einmalig laufen lassen, damit echte Datensätze in der DB sind (siehe Setup-Sektion). Falls die Tabelle leer ist, fällt das Dashboard automatisch auf Mock-Daten zurück.

---

## 10. Roadmap (v2)

- **AI Live-Anbindung** an Claude API mit Tool-Use (LLM kann GlideRecord-Queries ausführen, Tickets erstellen, Reviewer assignen)
- **AI-Suggested Reviewer** echt: Embedding-basierter Match zwischen Change-Profil und Reviewer-Historie
- **Mehr Risiko-Regeln** (Custom-Tables-Detection, Cross-App-Dependencies)
- **E-Mail-Notification** an Reviewer bei High-Risk-Klassifizierung
- **Vergleich** zwischen Update Sets (diff view)
- **Approval-Workflow** für High-Risk Changes
- **Export** zu PDF / Slack für Change-Tickets
- **Voice-Input** im AI Chat (Web Speech API)

---

## 11. Setup für Live-Demo

```bash
# 1. Build
npm run build

# 2. Deploy
node_modules/.bin/now-sdk install --auth dev

# 3. (Optional) Demo-Daten seeden — in SN Background Scripts:
#    Application = Change Risk Analyzer
gs.info(new x_488299_change_ri.DemoSeeder().seed());

# Cleanup nach der Demo:
gs.info(new x_488299_change_ri.DemoSeeder().clean());
```

---

## 12. Projekt-Struktur

```
sn-change-risk-analyzer/
├── src/
│   ├── fluent/                    # Metadata-Definitionen (TypeScript)
│   │   ├── tables/                #   Custom Tables
│   │   ├── script-includes/       #   Backend-Logik (Engine, Calculator, Seeder, etc.)
│   │   ├── ui-actions/            #   "Analyze Risk"-Button
│   │   ├── ui-pages/              #   Dashboard-Endpoint
│   │   └── navigation/            #   App-Menü und Module
│   ├── server/                    # Server-Side JS (Script Include Bodies)
│   │   └── script-includes/       #   Implementations
│   └── client/                    # React Frontend
│       ├── components/            #   UI-Komponenten:
│       │                          #     Dashboard, AnalysisList, AnalysisDetail,
│       │                          #     AnalyzePage, AIExplainPanel, AIChat,
│       │                          #     DonutChart, RiskTrendChart, ScoreGauge,
│       │                          #     NavBar, AnalysisCard, RiskBadge
│       ├── services/              #   REST-API-Wrapper
│       └── utils/                 #   Helpers (Routing, Field-Access, Mock-Data)
├── now.config.json                # SDK-Konfiguration
└── package.json                   # Dependencies & Scripts
```
