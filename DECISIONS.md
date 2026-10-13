# Key Decisions

## Who I Prioritised

**Project Director first.** The brief asks "will the line open on time, is the next tranche at risk." That question is answerable from the data:

M4 (doors/trains/ventilation) releases T3 (₹13.46 Cr, ~20% of grant) and is due 26 Oct 2026. As of the data date (15 Sep 2026), the tasks it depends on (RST-05, RST-07, TVS-06) are all `not_started`. That is 41 days away. The dashboard surfaces this as a milestone "at risk" flag in the first table a user sees.

The critical chain (CVL-04 → TRP-04 → TRP-05 → RST-04 → OCC-05 → OPS-04) is the spine of the programme. I show it as a visual chain with status badges on the Dependencies page so any department head can immediately see whether they are blocking a downstream colleague.

Finance and audit come second: the Budget page puts tranche release status and expenditure records in one place, and the Anomalies page calls out every rule violation with a plain-language explanation.

## What Counts as an Anomaly

I implemented 12 checks against the 7 project rules. Priority order:

| Rule | Check | Severity | Why it matters most |
|------|-------|----------|---------------------|
| RULE3a | Self-approval | High | Clearest fraud/error signal; one person cannot audit their own spend |
| RULE1 | Spend against unreleased tranche | High | Funding agency risk; if discovered during audit, T3/T4 could be blocked |
| RULE2b | PO overspend | High | Contractual breach |
| RULE7 | Milestone achieved but tasks incomplete | High | Self-reported status is the only source for tranche release; a false achieved is highest risk |
| RULE2a | Large equipment without PO | High | Procurement control failure |
| RULE3b/3c | Approved by exited person | High | Access control failure |
| RULE4 | FTS dependency violation | Medium | Indicates planning data is stale, not necessarily illegal |
| RULE5 | Component installed before dependency | Medium | May be a data entry error |
| RULE3d | Exited researcher logging hours | Medium | Payroll control |
| RULE6 | Timesheet overallocation | Low | Data quality; 10% tolerance applied |
| RULE_BUDGET | Dept overspend | High | Budget control |

I chose not to implement "fuzzy" anomalies (e.g. unusually large invoices with no peer) because there is no reference distribution in the data to calibrate against, and false positives would erode user trust quickly.

## Data Cleaning Decisions

- Normalised status strings case-insensitively (e.g. `"In Progress"` → `"in_progress"`, `"Not Started"` → `"not_started"`)
- Treated empty strings as `None` for optional foreign keys (`po_id`, `left_on`, `actual_end`, etc.)
- The CSV is the source of truth; `component_hierarchy.json` is not used (the CSV has the same tree via `parent_component_id`)
- Date comparisons are lexicographic (ISO 8601 strings sort correctly)
- Amounts are stored as float; monetary display is formatted in Crore (÷ 1e7) for readability

## What I Rejected

**Interactive Gantt chart.** Would have taken 4+ hours and a library like react-gantt-chart adds significant bundle weight. The milestone table with "at risk" flags and the critical chain visualisation convey the same time-critical information more clearly for a non-engineer.

**"What-if" slip analysis.** The HIERARCHY.md explicitly calls this a stretch goal. The dependency table gives the same intuition (find the successor chain manually) without simulation complexity.

**Role-based views.** There is no authentication data in the CSVs, so any RBAC would be cosmetic. Better to do it properly with a real auth layer when the time comes.

## What I Would Do Next

1. **Email/Slack digest** when a new RULE1 or RULE7 anomaly appears (a Node.js cron service could watch for new expenditures and re-run detection)
2. **CSV hot-reload** — inotify watcher that re-loads DataStore when any CSV is modified, useful for daily uploads
3. **Role-based access** — Project Director sees everything; department head sees only their department; Ministry cell gets read-only milestone/tranche view
4. **Gantt timeline** for tasks that have both `planned_start` and `planned_end`, once a good React library is chosen
5. **Export** — a single-page PDF of the dashboard for ministry submission (using headless Chrome)
