"""
Anomaly detection engine for K02 Metro Airport Link.
Each rule returns a list[AnomalyItem]. All lists are concatenated by detect_all_anomalies().
"""

from __future__ import annotations

import pandas as pd
from app.data_loader import DataStore
from app.models import AnomalyItem

_counter = [0]


def _new_id(prefix: str) -> str:
    _counter[0] += 1
    return f"{prefix}-{_counter[0]:04d}"


# ---------------------------------------------------------------------------
# RULE 1: Spending against unreleased tranche
# ---------------------------------------------------------------------------
def rule1_unreleased_tranche(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.expenditures.empty or ds.allocations.empty or ds.tranches.empty:
        return results

    exp = ds.expenditures.copy()
    alloc = ds.allocations[["allocation_id", "tranche_id"]].copy()
    tr = ds.tranches[["tranche_id", "actual_release"]].copy()

    merged = exp.merge(alloc, on="allocation_id", how="left")
    merged = merged.merge(tr, on="tranche_id", how="left")

    for _, row in merged.iterrows():
        actual_release = row.get("actual_release")
        if actual_release is None or (isinstance(actual_release, float) and pd.isna(actual_release)) or str(actual_release).strip() == "":
            results.append(AnomalyItem(
                anomaly_id=_new_id("R1"),
                rule_id="RULE1",
                severity="high",
                entity_type="expense",
                entity_id=str(row["expense_id"]),
                description=(
                    f"Expense {row['expense_id']} (₹{float(row['amount_inr']):,.0f}) charged to "
                    f"allocation {row.get('allocation_id')} from tranche {row.get('tranche_id')} "
                    f"which has not been released."
                ),
                detail=(
                    f"Tranche {row.get('tranche_id')} has no actual_release date. "
                    f"Category: {row.get('category')}, Date: {row.get('expense_date')}."
                ),
            ))
    return results


# ---------------------------------------------------------------------------
# RULE 2a: Equipment/civil_works >5L without PO
# ---------------------------------------------------------------------------
def rule2a_missing_po(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.expenditures.empty:
        return results

    threshold = 500000
    high_cats = {"equipment", "civil_works"}

    for _, row in ds.expenditures.iterrows():
        cat = str(row.get("category", "")).strip().lower()
        amount = float(row.get("amount_inr", 0) or 0)
        po_id = row.get("po_id")
        if cat in high_cats and amount > threshold and (po_id is None or str(po_id).strip() == ""):
            results.append(AnomalyItem(
                anomaly_id=_new_id("R2a"),
                rule_id="RULE2a",
                severity="high",
                entity_type="expense",
                entity_id=str(row["expense_id"]),
                description=(
                    f"Expense {row['expense_id']} (₹{amount:,.0f}) for {cat} exceeds "
                    f"₹5 lakh threshold but has no purchase order."
                ),
                detail=f"Vendor: {row.get('vendor')}, Date: {row.get('expense_date')}.",
            ))
    return results


# ---------------------------------------------------------------------------
# RULE 2b: PO overspend
# ---------------------------------------------------------------------------
def rule2b_po_overspend(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.purchase_orders.empty or ds.expenditures.empty:
        return results

    exp_with_po = ds.expenditures[ds.expenditures["po_id"].notna()].copy()
    if exp_with_po.empty:
        return results

    po_payments = exp_with_po.groupby("po_id")["amount_inr"].sum().reset_index()
    po_payments.columns = ["po_id", "total_paid"]

    merged = ds.purchase_orders.merge(po_payments, on="po_id", how="left")
    merged["total_paid"] = merged["total_paid"].fillna(0)

    for _, row in merged.iterrows():
        po_amount = float(row.get("po_amount_inr", 0) or 0)
        total_paid = float(row.get("total_paid", 0) or 0)
        if total_paid > po_amount:
            excess = total_paid - po_amount
            results.append(AnomalyItem(
                anomaly_id=_new_id("R2b"),
                rule_id="RULE2b",
                severity="high",
                entity_type="purchase_order",
                entity_id=str(row["po_id"]),
                description=(
                    f"Purchase order {row['po_id']} (value ₹{po_amount:,.0f}) has total payments of "
                    f"₹{total_paid:,.0f}, exceeding the PO value by ₹{excess:,.0f}."
                ),
                detail=f"Vendor: {row.get('vendor')}, Component: {row.get('component_id')}.",
            ))
    return results


# ---------------------------------------------------------------------------
# RULE 3a: Self-approval
# ---------------------------------------------------------------------------
def rule3a_self_approval(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.expenditures.empty:
        return results

    for _, row in ds.expenditures.iterrows():
        req = str(row.get("requested_by", "") or "").strip()
        appr = str(row.get("approved_by", "") or "").strip()
        if req and appr and req == appr:
            results.append(AnomalyItem(
                anomaly_id=_new_id("R3a"),
                rule_id="RULE3a",
                severity="high",
                entity_type="expense",
                entity_id=str(row["expense_id"]),
                description=(
                    f"Expense {row['expense_id']} was both requested and approved by the same person ({req})."
                ),
                detail=f"Amount: ₹{float(row.get('amount_inr', 0) or 0):,.0f}, Date: {row.get('expense_date')}.",
            ))
    return results


# ---------------------------------------------------------------------------
# RULE 3b: Approved by exited researcher
# ---------------------------------------------------------------------------
def rule3b_exited_approver(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.expenditures.empty or ds.researchers.empty:
        return results

    exited = ds.researchers[ds.researchers["status"] == "exited"][["researcher_id", "full_name"]].copy()
    if exited.empty:
        return results

    exited_ids = set(exited["researcher_id"].tolist())

    for _, row in ds.expenditures.iterrows():
        appr = str(row.get("approved_by", "") or "").strip()
        if appr in exited_ids:
            name_rows = exited[exited["researcher_id"] == appr]
            name = name_rows["full_name"].iloc[0] if not name_rows.empty else appr
            results.append(AnomalyItem(
                anomaly_id=_new_id("R3b"),
                rule_id="RULE3b",
                severity="high",
                entity_type="expense",
                entity_id=str(row["expense_id"]),
                description=(
                    f"Expense {row['expense_id']} was approved by {name} ({appr}) who has exited the project."
                ),
                detail=f"Amount: ₹{float(row.get('amount_inr', 0) or 0):,.0f}, Date: {row.get('expense_date')}.",
            ))
    return results


# ---------------------------------------------------------------------------
# RULE 3c: Approved after left_on date
# ---------------------------------------------------------------------------
def rule3c_approved_after_left(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.expenditures.empty or ds.researchers.empty:
        return results

    left = ds.researchers[ds.researchers["left_on"].notna()][["researcher_id", "full_name", "left_on"]].copy()
    if left.empty:
        return results

    left_dict = {r["researcher_id"]: r for _, r in left.iterrows()}

    for _, row in ds.expenditures.iterrows():
        appr = str(row.get("approved_by", "") or "").strip()
        exp_date = str(row.get("expense_date", "") or "").strip()
        if appr in left_dict and exp_date:
            rdata = left_dict[appr]
            left_on = str(rdata["left_on"]).strip()
            try:
                if exp_date > left_on:
                    results.append(AnomalyItem(
                        anomaly_id=_new_id("R3c"),
                        rule_id="RULE3c",
                        severity="high",
                        entity_type="expense",
                        entity_id=str(row["expense_id"]),
                        description=(
                            f"Expense {row['expense_id']} (date {exp_date}) was approved by "
                            f"{rdata['full_name']} who left on {left_on}."
                        ),
                        detail=f"Approver: {appr}, Amount: ₹{float(row.get('amount_inr', 0) or 0):,.0f}.",
                    ))
            except Exception:
                pass
    return results


# ---------------------------------------------------------------------------
# RULE 4: Finish-to-start task dependency violation
# ---------------------------------------------------------------------------
def rule4_task_dependency_violation(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.task_dependencies.empty or ds.work_packages.empty:
        return results

    wp = ds.work_packages[["task_id", "task_name", "actual_start", "actual_end"]].copy()
    wp_dict = {r["task_id"]: r for _, r in wp.iterrows()}

    for _, dep in ds.task_dependencies.iterrows():
        pred_id = dep.get("predecessor_task_id")
        succ_id = dep.get("successor_task_id")
        if not pred_id or not succ_id:
            continue

        pred = wp_dict.get(str(pred_id))
        succ = wp_dict.get(str(succ_id))
        if pred is None or succ is None:
            continue

        pred_end = pred.get("actual_end")
        succ_start = succ.get("actual_start")

        if (pred_end and succ_start and
                pred_end not in (None, "") and succ_start not in (None, "")):
            try:
                if str(succ_start).strip() < str(pred_end).strip():
                    results.append(AnomalyItem(
                        anomaly_id=_new_id("R4"),
                        rule_id="RULE4",
                        severity="medium",
                        entity_type="task",
                        entity_id=str(succ_id),
                        description=(
                            f"Task {succ_id} started on {succ_start} before its predecessor "
                            f"{pred_id} finished on {pred_end} (finish-to-start violation)."
                        ),
                        detail=f"Predecessor: {pred.get('task_name')}, Successor: {succ.get('task_name')}.",
                    ))
            except Exception:
                pass
    return results


# ---------------------------------------------------------------------------
# RULE 5: Component installed before dependency installed
# ---------------------------------------------------------------------------
def rule5_component_dependency_violation(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.components.empty or ds.component_dependencies.empty:
        return results

    installed_statuses = {"installed", "tested"}
    comp_dict = {r["component_id"]: r for _, r in ds.components.iterrows()}

    advanced_comps = ds.components[ds.components["status"].isin(installed_statuses)]

    for _, comp_row in advanced_comps.iterrows():
        comp_id = comp_row["component_id"]
        comp_status = comp_row["status"]
        comp_name = comp_row.get("component_name", comp_id)

        deps = ds.component_dependencies[ds.component_dependencies["component_id"] == comp_id]
        for _, dep_row in deps.iterrows():
            dep_id = dep_row["depends_on_component_id"]
            dep_comp = comp_dict.get(str(dep_id))
            if dep_comp is None:
                continue

            dep_status = str(dep_comp.get("status", "") or "").strip()
            if dep_status not in installed_statuses:
                dep_name = dep_comp.get("component_name", dep_id)
                results.append(AnomalyItem(
                    anomaly_id=_new_id("R5"),
                    rule_id="RULE5",
                    severity="medium",
                    entity_type="component",
                    entity_id=str(comp_id),
                    description=(
                        f"Component {comp_id} ({comp_name}) is marked {comp_status} but its "
                        f"dependency {dep_id} ({dep_name}) is only {dep_status}."
                    ),
                    detail=f"Dependency type: {dep_row.get('dependency_type')}.",
                ))
    return results


# ---------------------------------------------------------------------------
# RULE 6: Timesheet hours exceed allocation (10% tolerance)
# ---------------------------------------------------------------------------
def rule6_timesheet_overallocation(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.timesheets.empty or ds.researchers.empty:
        return results

    researcher_alloc = {
        r["researcher_id"]: float(r.get("project_allocation_pct", 0) or 0)
        for _, r in ds.researchers.iterrows()
    }
    researcher_name = {
        r["researcher_id"]: r.get("full_name", r["researcher_id"])
        for _, r in ds.researchers.iterrows()
    }

    grouped = ds.timesheets.groupby(["researcher_id", "week_start"])["hours"].sum().reset_index()

    for _, row in grouped.iterrows():
        rid = str(row["researcher_id"]).strip()
        week = str(row["week_start"]).strip()
        logged = float(row["hours"])

        pct = researcher_alloc.get(rid, 0)
        allowed = 40.0 * (pct / 100.0)

        if allowed > 0 and logged > allowed * 1.1:
            name = researcher_name.get(rid, rid)
            results.append(AnomalyItem(
                anomaly_id=_new_id("R6"),
                rule_id="RULE6",
                severity="low",
                entity_type="researcher",
                entity_id=rid,
                description=(
                    f"Researcher {name} ({rid}) logged {logged:.1f} hours in week {week} "
                    f"but their {pct:.0f}% allocation allows only {allowed:.1f} hours."
                ),
                detail=f"Overage: {logged - allowed:.1f} hours ({(logged/allowed - 1)*100:.0f}% over).",
            ))
    return results


# ---------------------------------------------------------------------------
# RULE 7: Milestone reported achieved/on_track but tasks incomplete
# ---------------------------------------------------------------------------
def rule7_milestone_status_mismatch(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.milestones.empty or ds.work_packages.empty:
        return results

    wp_status = {r["task_id"]: r for _, r in ds.work_packages.iterrows()}

    watch_statuses = {"achieved", "on_track"}

    for _, ms in ds.milestones.iterrows():
        ms_status = str(ms.get("reported_status", "") or "").strip()
        if ms_status not in watch_statuses:
            continue

        linked_raw = ms.get("linked_task_ids")
        if not linked_raw or str(linked_raw).strip() == "":
            continue

        task_ids = [t.strip() for t in str(linked_raw).split(";") if t.strip()]

        for tid in task_ids:
            wp = wp_status.get(tid)
            if wp is None:
                continue
            task_status = str(wp.get("status", "") or "").strip()
            if task_status != "completed" and ms_status == "achieved":
                results.append(AnomalyItem(
                    anomaly_id=_new_id("R7"),
                    rule_id="RULE7",
                    severity="high",
                    entity_type="milestone",
                    entity_id=str(ms["milestone_id"]),
                    description=(
                        f"Milestone {ms['milestone_id']} ({ms.get('milestone_name', '')}) is reported as "
                        f"{ms_status} but linked task {tid} ({wp.get('task_name', '')}) is {task_status}."
                    ),
                    detail=f"Milestone due: {ms.get('due_date')}. Task status: {task_status}.",
                ))
    return results


# ---------------------------------------------------------------------------
# RULE BUDGET: Department overspend
# ---------------------------------------------------------------------------
def rule_budget_overspend(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.departments.empty or ds.expenditures.empty:
        return results

    dept_spent = ds.expenditures.groupby("dept_id")["amount_inr"].sum().reset_index()
    dept_spent.columns = ["dept_id", "spent_inr"]

    merged = ds.departments.merge(dept_spent, on="dept_id", how="left")
    merged["spent_inr"] = merged["spent_inr"].fillna(0)

    for _, row in merged.iterrows():
        budget = float(row.get("total_budget_inr", 0) or 0)
        spent = float(row.get("spent_inr", 0) or 0)
        if budget > 0 and spent > budget:
            results.append(AnomalyItem(
                anomaly_id=_new_id("RBUDG"),
                rule_id="RULE_BUDGET",
                severity="high",
                entity_type="department",
                entity_id=str(row["dept_id"]),
                description=(
                    f"Department {row.get('dept_name', row['dept_id'])} has spent "
                    f"₹{spent:,.0f} against a total budget of ₹{budget:,.0f}."
                ),
                detail=f"Overspend: ₹{spent - budget:,.0f} ({(spent/budget - 1)*100:.1f}% over budget).",
            ))
    return results


# ---------------------------------------------------------------------------
# RULE: Exited researcher logged hours
# ---------------------------------------------------------------------------
def rule_exited_researcher_hours(ds: DataStore) -> list[AnomalyItem]:
    results = []
    if ds.timesheets.empty or ds.researchers.empty:
        return results

    exited = ds.researchers[ds.researchers["status"] == "exited"][["researcher_id", "full_name", "left_on"]].copy()
    if exited.empty:
        return results

    exited_dict = {r["researcher_id"]: r for _, r in exited.iterrows()}

    ts_grouped = ds.timesheets.groupby(["researcher_id", "week_start"])["hours"].sum().reset_index()

    seen = set()
    for _, row in ts_grouped.iterrows():
        rid = str(row["researcher_id"]).strip()
        if rid not in exited_dict:
            continue
        week = str(row["week_start"]).strip()
        rdata = exited_dict[rid]
        left_on = str(rdata.get("left_on", "") or "").strip()
        # Flag if they logged hours after they left
        if left_on and week > left_on:
            key = (rid, week)
            if key not in seen:
                seen.add(key)
                name = rdata.get("full_name", rid)
                results.append(AnomalyItem(
                    anomaly_id=_new_id("R3d"),
                    rule_id="RULE3d",
                    severity="medium",
                    entity_type="researcher",
                    entity_id=rid,
                    description=(
                        f"Researcher {name} ({rid}) logged {float(row['hours']):.1f} hours in week "
                        f"{week} but left the project on {left_on}."
                    ),
                    detail=f"Status: exited.",
                ))
    return results


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------
def detect_all_anomalies(ds: DataStore) -> list[AnomalyItem]:
    # Reset counter for deterministic IDs in tests
    _counter[0] = 0

    all_rules = [
        rule1_unreleased_tranche,
        rule2a_missing_po,
        rule2b_po_overspend,
        rule3a_self_approval,
        rule3b_exited_approver,
        rule3c_approved_after_left,
        rule4_task_dependency_violation,
        rule5_component_dependency_violation,
        rule6_timesheet_overallocation,
        rule7_milestone_status_mismatch,
        rule_budget_overspend,
        rule_exited_researcher_hours,
    ]

    results = []
    for rule_fn in all_rules:
        try:
            items = rule_fn(ds)
            results.extend(items)
        except Exception as e:
            # Don't crash the whole detection if one rule fails
            pass

    return results
