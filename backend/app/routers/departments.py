from fastapi import APIRouter, HTTPException
from app.data_loader import get_data
from app.models import DepartmentSummary, DepartmentDetail, TaskCounts

router = APIRouter()


def _task_counts(tasks_df) -> TaskCounts:
    return TaskCounts(
        completed=int((tasks_df["status"] == "completed").sum()),
        in_progress=int((tasks_df["status"] == "in_progress").sum()),
        not_started=int((tasks_df["status"] == "not_started").sum()),
        total=len(tasks_df),
    )


def _head_name(ds, head_id) -> str:
    if not head_id or ds.researchers.empty:
        return "Unknown"
    rows = ds.researchers[ds.researchers["researcher_id"] == str(head_id)]
    if rows.empty:
        return str(head_id)
    return str(rows.iloc[0]["full_name"])


@router.get("/departments", response_model=list[DepartmentSummary])
def list_departments():
    ds = get_data()
    result = []
    for _, dept in ds.departments.iterrows():
        did = dept["dept_id"]

        allocated = 0.0
        if not ds.allocations.empty:
            allocated = float(ds.allocations[ds.allocations["dept_id"] == did]["amount_inr"].sum())

        spent = 0.0
        if not ds.expenditures.empty:
            spent = float(ds.expenditures[ds.expenditures["dept_id"] == did]["amount_inr"].sum())

        tasks = ds.work_packages[
            (ds.work_packages["dept_id"] == did) &
            (~ds.work_packages["task_id"].str.startswith("WP-"))
        ] if not ds.work_packages.empty else ds.work_packages

        result.append(DepartmentSummary(
            dept_id=did,
            dept_name=str(dept.get("dept_name", "")),
            total_budget_inr=float(dept.get("total_budget_inr", 0) or 0),
            allocated_inr=allocated,
            spent_inr=spent,
            head_name=_head_name(ds, dept.get("head_researcher_id")),
            task_counts=_task_counts(tasks),
        ))
    return result


@router.get("/departments/{dept_id}", response_model=DepartmentDetail)
def get_department(dept_id: str):
    ds = get_data()
    dept_rows = ds.departments[ds.departments["dept_id"] == dept_id]
    if dept_rows.empty:
        raise HTTPException(status_code=404, detail=f"Department {dept_id} not found")

    dept = dept_rows.iloc[0]

    allocated = 0.0
    if not ds.allocations.empty:
        allocated = float(ds.allocations[ds.allocations["dept_id"] == dept_id]["amount_inr"].sum())

    spent = 0.0
    if not ds.expenditures.empty:
        spent = float(ds.expenditures[ds.expenditures["dept_id"] == dept_id]["amount_inr"].sum())

    # Tasks (exclude WP-xxx)
    tasks_df = ds.work_packages[
        (ds.work_packages["dept_id"] == dept_id) &
        (~ds.work_packages["task_id"].str.startswith("WP-"))
    ] if not ds.work_packages.empty else ds.work_packages

    # Get latest progress for each task
    task_progress = {}
    if not ds.progress_updates.empty:
        latest = ds.progress_updates.sort_values("report_date").groupby("task_id").last().reset_index()
        task_progress = {r["task_id"]: float(r["percent_complete"]) for _, r in latest.iterrows()}

    tasks = []
    for _, t in tasks_df.iterrows():
        tid = t["task_id"]
        tasks.append({
            "task_id": tid,
            "task_name": str(t.get("task_name", "")),
            "status": str(t.get("status", "")),
            "planned_start": t.get("planned_start"),
            "planned_end": t.get("planned_end"),
            "actual_start": t.get("actual_start"),
            "actual_end": t.get("actual_end"),
            "owner_researcher_id": t.get("owner_researcher_id"),
            "component_id": t.get("component_id"),
            "percent_complete": task_progress.get(tid, 0),
        })

    # People
    people = []
    if not ds.researchers.empty:
        dept_researchers = ds.researchers[ds.researchers["dept_id"] == dept_id]
        for _, r in dept_researchers.iterrows():
            people.append({
                "researcher_id": r["researcher_id"],
                "full_name": str(r.get("full_name", "")),
                "role": str(r.get("role", "")),
                "status": str(r.get("status", "")),
                "project_allocation_pct": float(r.get("project_allocation_pct", 0) or 0),
                "monthly_cost_inr": float(r.get("monthly_cost_inr", 0) or 0),
                "email": str(r.get("email", "")),
            })

    # Allocations by category
    alloc_by_cat = []
    if not ds.allocations.empty:
        dept_allocs = ds.allocations[ds.allocations["dept_id"] == dept_id]
        by_cat = dept_allocs.groupby("category")["amount_inr"].sum().reset_index()
        for _, row in by_cat.iterrows():
            alloc_by_cat.append({
                "category": str(row["category"]),
                "amount_inr": float(row["amount_inr"]),
            })

    return DepartmentDetail(
        dept_id=dept_id,
        dept_name=str(dept.get("dept_name", "")),
        scope=str(dept.get("scope", "")),
        total_budget_inr=float(dept.get("total_budget_inr", 0) or 0),
        allocated_inr=allocated,
        spent_inr=spent,
        head_name=_head_name(ds, dept.get("head_researcher_id")),
        tasks=tasks,
        people=people,
        allocations_by_category=alloc_by_cat,
    )
