# Wireframe — K02 Metro Airport Link Dashboard

Sketched before coding, 13 October 2026.

---

## Overall layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px)             │  MAIN CONTENT AREA                           │
│  ─────────────────────────── │                                               │
│  🚆 DMRC-Pune                │                                               │
│     Airport Link K02         │                                               │
│                              │                                               │
│  [●] Dashboard               │                                               │
│  [ ] Departments             │                                               │
│  [ ] Budget                  │                                               │
│  [ ] Dependencies            │                                               │
│  [ ] People                  │                                               │
│  [ ] Anomalies               │                                               │
│                              │                                               │
│  Data as of 15 Sep 2026      │                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Page 1 — Dashboard (Project Director view)

**Primary question this page answers:** "Will the line open on time, and is the next tranche at risk?"

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Programme Dashboard   K02 Metro Airport Link · Data as of 15 September 2026 │
├──────────────┬──────────────┬──────────────┬──────────────────────────────────┤
│ TOTAL GRANT  │ TOTAL SPENT  │   TASKS      │    ANOMALIES                     │
│ ₹67.28 Cr    │ ₹X.XX Cr     │ 26 / 51      │  [RED] 12 high                   │
│ Released:    │ XX% of rel.  │ 7 in prog.   │  [ORG]  5 medium                 │
│ ₹47.09 Cr    │              │ 18 not start │  [YLW]  3 low                    │
├──────────────┴──────────────┴──────────────┴──────────────────────────────────┤
│  OVERALL TASK PROGRESS                                                         │
│  [██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 26/51 done             │
│  ■ Completed(26)  ■ In Progress(7)  □ Not Started(18)                         │
├──────────────────────────────────────┬─────────────────────────────────────────┤
│  MILESTONES & TRANCHE STATUS         │  TOP ANOMALIES                          │
│  ─────────────────────────────────── │  ─────────────────────────────────────  │
│  M1 │ Oct 21 │ achieved   │ T1 │  ✓  │  ⚠ RULE3a — EX001 — Self-approval …   │
│  M2 │ Mar 10 │ achieved   │ T2 │  ✓  │  ⚠ RULE1  — EX003 — Unreleased …      │
│  M3 │ Jul 28 │ on_track   │ —  │  ⚠  │  ⚠ RULE7  — M3   — Milestone vs …     │
│  M4 │ Oct 26 │ on_track   │ T3 │  ⚠  │  ⚠ RULE2b — PO12 — PO overspend …     │
│  M5 │ Dec 30 │ on_track   │ —  │  ⚠  │  ⚠ RULE3b — EX07 — Exited approver…   │
│  M6 │ Mar 15 │ on_track   │ T4 │  ⚠  │  + 15 more anomalies →                 │
├──────────────────────────────────────┴─────────────────────────────────────────┤
│  DEPARTMENT BUDGET OVERVIEW  (₹ Crore)                                         │
│                                                                                 │
│  RST  ████████████████████████████████░░░░░░ ▌ Budget/Allocated/Spent         │
│  OCC  ████████████████░░░░░░░░                                                 │
│  TVS  ████████████░░░░░░                                                        │
│  TRP  ████████░░░░                                                              │
│  CVL  ████░                                                                     │
│  OPS  ██░                                                                       │
│  PMU  █                                                                         │
│  CPC  █                                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key design decision:** M4 (Doors/Trains/Ventilation, Oct 26) releases T3 (₹13.46 Cr).
Its three linked tasks (RST-05, RST-07, TVS-06) are all `not_started` as of data date.
This must be visible in under one minute.

---

## Page 2 — Departments

### List view (/departments)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Civil &      │  │ Traction &   │  │ Tunnel Vent  │  │ Rolling Stk  │
│ Structures   │  │ Power Supply │  │ & E&M        │  │ & Signalling │
│ CVL          │  │ TRP          │  │ TVS          │  │ RST          │
│              │  │              │  │              │  │              │
│ Tasks: 7/7✓  │  │ Tasks: 5/7   │  │ Tasks: 3/6   │  │ Tasks: 4/10  │
│ [████████]   │  │ [███████░░]  │  │ [█████░░░]   │  │ [████░░░░░░] │
│ ₹4.38 Cr     │  │ ₹8.38 Cr     │  │ ₹9.28 Cr     │  │ ₹31.73 Cr    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Detail view (/departments/:id)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back    RST — Rolling Stock & Signalling                                   │
│           Head: [Name]  Budget: ₹31.73 Cr  Allocated: ₹X Cr  Spent: ₹X Cr  │
├───────────────────────────────────┬─────────────────────────────────────────┤
│  TASKS                            │  TEAM                                    │
│  ── in_progress ──                │  Name        Role       Alloc   Status   │
│  RST-06 Trainset delivery…        │  R024 Khan   Dept Lead  20%     active   │
│  ── not_started ──                │  R025 Naidu  Engineer   100%    active   │
│  RST-04 PSD install platforms 1-2 │  …                                       │
│  RST-05 PSD install platforms 3-4 │                                          │
│  RST-07 Trainset commissioning    │  BUDGET BY CATEGORY                      │
│  RST-10 Signalling install        │  equipment    ₹XX Cr                     │
│  ── completed ──                  │  civil_works  ₹XX Cr                     │
│  RST-01 … RST-03, RST-08, RST-09  │  manpower     ₹XX Cr                     │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

---

## Page 3 — Budget

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Budget & Finance                                                            │
│                                                                              │
│  [Total Grant ₹67.28Cr]  [Released ₹47.09Cr ██░░]  [Allocated]  [Spent]    │
│                                                                              │
│  [Tranches tab ●] [Expenditures tab]                                        │
├────────────────────────────────────────────────────────────────────────────┤
│  T1 ✓ Released  T2 ✓ Released  T3 ⏳ Pending  T4 🔒 Pending               │
│  ₹23.55 Cr      ₹23.55 Cr      ₹13.46 Cr      ₹6.73 Cr                     │
│  Oct 19, 2025   Apr 15, 2026   Cond: M4        Cond: M6                     │
│                                Exp: Nov 5      Exp: Mar 20                   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Page 4 — Dependencies

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Dependencies                                                                │
│  [Task Dependencies ●]  [Component Dependencies]                            │
├────────────────────────────────────────────────────────────────────────────┤
│  CRITICAL CHAIN — Tranche Release Path                                       │
│  "A slip here delays all successors and puts T3/T4 at risk"                │
│                                                                              │
│  [CVL-04]→[TRP-04]→[TRP-05]→[RST-04]→[OCC-05]→[OPS-04]                    │
│  completed  completed in_prog  not_strt  not_strt  not_strt                 │
│                         ⚠ LATE                                               │
│                                                                              │
│  ALL TASKS TABLE  ★ = critical chain                                        │
│  Task ID │ Name              │ Dept │ Status      │ Planned End │ Actual End │
│  CVL-04★ │ Station box …     │ CVL  │ completed   │ 2026-04-24  │ 2026-06-07│
│  …                                                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Page 5 — People

```
┌────────────────────────────────────────────────────────────────────────────┐
│  People   63 total  [52 active]  [3 on leave]  [8 exited]                  │
│                                                                              │
│  Filter by dept: [All▼] [CVL] [TRP] [TVS] [RST] [OCC] [OPS] [CPC] [PMU]   │
│                                                                              │
│  Name              Dept  Role              Alloc%  Status   Email           │
│  Manish Reddy      CVL   Prof & Dept Lead  20%     active   m.r@…           │
│  Nandini Banerjee  CVL   Research Scholar  50%     active   n.b@…           │
│  …                                                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Page 6 — Anomalies

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Anomalies   Data quality issues detected against project rules              │
│                                                                              │
│  [12 HIGH]  [5 MEDIUM]  [3 LOW]  [20 TOTAL]                                │
│                                                                              │
│  Filter: [All ●] [high] [medium] [low]   Rule: [All rules ▼]               │
│                                                                              │
│  RULE1 — 3 issues — "Spending against unreleased tranche"                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ⚠ RULE1  expense: EX099  Expense EX099 (₹5,00,000) charged to …  ▾ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  RULE3a — 2 issues — "Same requester and approver"                         │
│  …                                                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Information design rationale

| Screen area | Data shown | Why |
|---|---|---|
| Dashboard KPIs | Grant / Spent / Tasks / Anomalies | Project director needs these in seconds |
| Milestone table | Due date + task statuses + tranche | One look shows if next tranche is at risk |
| Critical chain | CVL-04 → OPS-04 with statuses | Non-engineers can follow a linear chain |
| Dept cards | Task completion % + budget | 8 depts digestible as a grid |
| Anomaly grouping | By rule, expandable detail | Ministry auditor can go straight to rule |

The information hierarchy is: **Grant risk → Milestone risk → Task risk → Budget risk → People risk**.
