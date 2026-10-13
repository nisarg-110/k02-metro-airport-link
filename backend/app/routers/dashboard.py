from fastapi import APIRouter
from app.data_loader import get_data
from app.models import (
    DashboardResponse, KPISummary, TaskCounts, AnomalyCounts, MilestoneStatus
)
from app.anomaly_detector import detect_all_anomalies

router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard():
    ds = get_data()

    # --- KPIs ---
    total_grant = float(ds.tranches["amount_inr"].sum()) if not ds.tranches.empty else 0.0
    released = ds.tranches[ds.tranches["actual_release"].notna()] if not ds.tranches.empty else ds.tranches
    total_released = float(released["amount_inr"].sum()) if not released.empty else 0.0
    total_allocated = float(ds.allocations["amount_inr"].sum()) if not ds.allocations.empty else 0.0
    total_spent = float(ds.expenditures["amount_inr"].sum()) if not ds.expenditures.empty else 0.0

    kpi = KPISummary(
        total_grant_inr=total_grant,
        total_released_inr=total_released,
        total_allocated_inr=total_allocated,
        total_spent_inr=total_spent,
    )

    # --- Task counts (exclude WP-xxx parent rows) ---
    tasks = ds.work_packages[~ds.work_packages["task_id"].str.startswith("WP-")] if not ds.work_packages.empty else ds.work_packages
    task_counts = TaskCounts(
        completed=int((tasks["status"] == "completed").sum()),
        in_progress=int((tasks["status"] == "in_progress").sum()),
        not_started=int((tasks["status"] == "not_started").sum()),
        total=len(tasks),
    )

    # --- Anomalies ---
    anomalies = detect_all_anomalies(ds)
    anomaly_counts = AnomalyCounts(
        high=sum(1 for a in anomalies if a.severity == "high"),
        medium=sum(1 for a in anomalies if a.severity == "medium"),
        low=sum(1 for a in anomalies if a.severity == "low"),
        total=len(anomalies),
    )

    # --- Milestones ---
    milestone_list = []
    if not ds.milestones.empty:
        for _, ms in ds.milestones.iterrows():
            ms_id = str(ms["milestone_id"])
            ms_name = str(ms.get("milestone_name", "") or "")
            due_date = ms.get("due_date")
            reported_status = str(ms.get("reported_status", "") or "")
            releases_tranche_id = ms.get("releases_tranche_id")

            # Tranche amount
            tranche_amount = None
            if releases_tranche_id and not ds.tranches.empty:
                t_rows = ds.tranches[ds.tranches["tranche_id"] == releases_tranche_id]
                if not t_rows.empty:
                    tranche_amount = float(t_rows.iloc[0]["amount_inr"])

            # Linked task statuses
            linked_raw = ms.get("linked_task_ids")
            linked_task_statuses = []
            is_at_risk = False

            if linked_raw and str(linked_raw).strip():
                task_ids = [t.strip() for t in str(linked_raw).split(";") if t.strip()]
                for tid in task_ids:
                    if not ds.work_packages.empty:
                        wp_rows = ds.work_packages[ds.work_packages["task_id"] == tid]
                        if not wp_rows.empty:
                            ts = str(wp_rows.iloc[0]["status"] or "")
                            linked_task_statuses.append(ts)
                            if ts != "completed" and reported_status in ("achieved", "on_track"):
                                is_at_risk = True

            milestone_list.append(MilestoneStatus(
                milestone_id=ms_id,
                name=ms_name,
                due_date=str(due_date) if due_date else None,
                reported_status=reported_status,
                releases_tranche_id=str(releases_tranche_id) if releases_tranche_id else None,
                tranche_amount_inr=tranche_amount,
                linked_task_statuses=linked_task_statuses,
                is_at_risk=is_at_risk,
            ))

    # --- Dept budgets ---
    dept_budgets = []
    if not ds.departments.empty:
        for _, dept in ds.departments.iterrows():
            did = dept["dept_id"]
            allocated = 0.0
            if not ds.allocations.empty:
                a_rows = ds.allocations[ds.allocations["dept_id"] == did]
                allocated = float(a_rows["amount_inr"].sum())
            spent = 0.0
            if not ds.expenditures.empty:
                e_rows = ds.expenditures[ds.expenditures["dept_id"] == did]
                spent = float(e_rows["amount_inr"].sum())
            dept_budgets.append({
                "dept_id": did,
                "dept_name": str(dept.get("dept_name", "")),
                "budget": float(dept.get("total_budget_inr", 0) or 0),
                "allocated": allocated,
                "spent": spent,
            })

    return DashboardResponse(
        kpi=kpi,
        task_counts=task_counts,
        anomaly_counts=anomaly_counts,
        milestones=milestone_list,
        dept_budgets=dept_budgets,
    )
