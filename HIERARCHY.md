# How the project fits together

There are **two hierarchies** and **two kinds of dependency**. Most of the interesting questions come from where they meet.

## 1. Work hierarchy: who does what, and when (`work_packages.csv`)

```
Metro Airport Link: Station & Rolling Stock Programme
├── WP-CVL  Civil & Structures                 ── CVL-01 … CVL-07
├── WP-TRP  Traction & Power Supply            ── TRP-01 … TRP-07
├── WP-TVS  Tunnel Ventilation & E&M           ── TVS-01 … TVS-06
├── WP-RST  Rolling Stock & Signalling         ── RST-01 … RST-10
├── WP-OCC  Operations Control & IT            ── OCC-01 … OCC-08
├── WP-OPS  Operations & Safety                ── OPS-01 … OPS-05
├── WP-CPC  Contracts & Procurement            ── CPC-01 … CPC-03
└── WP-PMU  Project Management Unit            ── PMU-01 … PMU-04
```

**Task dependencies** (`task_dependencies.csv`) cross department lines. This is the main source of friction. One example chain:

```
CVL-04 Station box & concourse structure  ──►  TRP-04 Auxiliary substation commissioning  ──►  TRP-05 Platform door feeders
  ──►  RST-04 PSD installation platforms 1-2  ──►  OCC-05 Automatic train supervision setup  ──►  OPS-04 Integrated trial runs
```

If the first task in this chain is late, every task after it is late, and a later tranche is at risk.

## 2. Component hierarchy: what is being built (`components.csv`)

```
LNK-001 Airport Link Station & Rolling Stock  (system)
├── STN-001 Airport station structure  (subsystem, CVL)
│   ├── STN-BOX Station box & concourse
│   ├── STN-FIRE Fire detection & suppression
│   └── STN-ACS Access control & CCTV
├── PWR-001 Power supply system  (subsystem, TRP)
│   ├── PWR-SUB 33 kV receiving substation
│   ├── PWR-AUX Auxiliary transformer
│   ├── PWR-DG DG backup set
│   └── PWR-FDR Platform door feeders ── 6 × part (PWR-FDR-R1 … PWR-FDR-G2)
├── TVS-001 Tunnel ventilation system  (subsystem, TVS)
│   ├── TVS-FAN Tunnel ventilation fans
│   ├── TVS-DCT Ventilation ducting
│   ├── TVS-AHU Station air handling unit
│   └── TVS-PVF Platform ventilation ── 6 × part (TVS-PVF-R1 … TVS-PVF-G2)
├── SIG-001 CBTC signalling  (subsystem, RST)
│   ├── SIG-ZC-01 Zone controller 1
│   ├── SIG-ZC-02 Zone controller 2
│   ├── SIG-CAB-R1 Platform signal cabinet 1
│   ├── SIG-CAB-R2 Platform signal cabinet 2
│   ├── SIG-CAB-R3 Platform signal cabinet 3
│   ├── SIG-CAB-R4 Platform signal cabinet 4
│   ├── SIG-CAB-G1 Depot signal cabinet 1
│   └── SIG-CAB-G2 Depot signal cabinet 2
├── OCC-001 OCC server cluster  (subsystem, OCC)
│   ├── OCC-APP Application servers
│   ├── OCC-DB Database servers
│   └── OCC-SAN Storage arrays
├── SYSM-001 Platform & train systems  (subsystem, RST)
│   ├── SYSM-PSD Platform screen doors ── 4 × unit (SYSM-PSD-R1 … SYSM-PSD-R4)
│   │       each unit: 16 × sub_unit, each with Door drive motor ×2, Obstacle sensor ×12
│   └── SYSM-TRN Trainsets ── 2 × unit (SYSM-TRN-R1 … SYSM-TRN-R2)
│           each unit: 8 × sub_unit, each with Bogie ×2, Traction motor ×4, Seat module ×16
├── SCD-001 Control software  (subsystem, OCC)
│   ├── SCD-BASE SCADA baseline
│   ├── SCD-ATS Automatic train supervision
│   ├── SCD-DASH Station SCADA dashboards
│   └── SCD-AFC Ticketing & passenger info
└── OPS-001 Operational readiness  (subsystem, OPS)
    ├── OPS-SOP Operating rules & SOPs
    ├── OPS-CERT Staff certification programme
    └── OPS-TRIAL Integrated trial runs
```

The tree is 6 levels deep and has 315 components. Cost rolls up the tree (`quantity × unit_cost_inr` of a node plus all its descendants).

**Component dependencies** (`component_dependencies.csv`) describe what a part needs in order to run. For example, **PSD set platform 1** needs Door feeder platform 1 (power), Ventilation fan set platform 1 (ventilation), Platform signal cabinet 1 (signalling), Station box & concourse (physical_space).
That part belongs to **Platform ventilation**, which in turn needs **Station air handling unit**, which needs **Ventilation ducting**, which needs **Tunnel ventilation fans**, which needs **33 kV receiving substation**.

## 3. Where they meet

- Each task can point to the component it delivers (`work_packages.component_id`). Each component names the task that governs its status (`components.governing_task_id`).
- Purchase orders buy components. Expenditures pay purchase orders. Allocations fund expenditures. Tranches fund allocations. Milestones release tranches, and milestones depend on tasks.

So you can follow one chain from **a late delivery on site to a tranche of government money being at risk**. Showing chains like that simply is the heart of this assignment.
