from fastapi import APIRouter, HTTPException
from app.data_loader import get_data
from app.models import TaskSummary, TaskDetail

router = APIRouter()


@router.get("/tasks", response_model=list[TaskSummary])
def list_tasks():
    ds = get_data()
    if ds.work_packages.empty:
        return []

    tasks_df = ds.work_packages[~ds.work_packages["task_id"].str.startswith("WP-")]
    result = []
    for _, t in tasks_df.iterrows():
        result.append(TaskSummary(
            task_id=str(t["task_id"]),
            task_name=str(t.get("task_name", "")),
            dept_id=str(t.get("dept_id", "")),
            status=str(t.get("status", "")),
            planned_start=t.get("planned_start"),
            planned_end=t.get("planned_end"),
            actual_start=t.get("actual_start"),
            actual_end=t.get("actual_end"),
            owner_researcher_id=t.get("owner_researcher_id"),
            component_id=t.get("component_id"),
        ))
    return result


@router.get("/tasks/{task_id}", response_model=TaskDetail)
def get_task(task_id: str):
    ds = get_data()
    rows = ds.work_packages[ds.work_packages["task_id"] == task_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    t = rows.iloc[0]

    # Owner name
    owner_name = None
    owner_id = t.get("owner_researcher_id")
    if owner_id and not ds.researchers.empty:
        r_rows = ds.researchers[ds.researchers["researcher_id"] == str(owner_id)]
        if not r_rows.empty:
            owner_name = str(r_rows.iloc[0]["full_name"])

    # Predecessors
    predecessors = []
    if not ds.task_dependencies.empty:
        pred_rows = ds.task_dependencies[ds.task_dependencies["successor_task_id"] == task_id]
        for _, dep in pred_rows.iterrows():
            pred_id = dep["predecessor_task_id"]
            pred_wp = ds.work_packages[ds.work_packages["task_id"] == str(pred_id)]
            pred_name = str(pred_wp.iloc[0]["task_name"]) if not pred_wp.empty else str(pred_id)
            pred_status = str(pred_wp.iloc[0]["status"]) if not pred_wp.empty else ""
            predecessors.append({
                "task_id": str(pred_id),
                "task_name": pred_name,
                "status": pred_status,
                "dependency_type": str(dep.get("dependency_type", "")),
                "lag_days": float(dep.get("lag_days", 0) or 0),
            })

    # Successors
    successors = []
    if not ds.task_dependencies.empty:
        succ_rows = ds.task_dependencies[ds.task_dependencies["predecessor_task_id"] == task_id]
        for _, dep in succ_rows.iterrows():
            succ_id = dep["successor_task_id"]
            succ_wp = ds.work_packages[ds.work_packages["task_id"] == str(succ_id)]
            succ_name = str(succ_wp.iloc[0]["task_name"]) if not succ_wp.empty else str(succ_id)
            succ_status = str(succ_wp.iloc[0]["status"]) if not succ_wp.empty else ""
            successors.append({
                "task_id": str(succ_id),
                "task_name": succ_name,
                "status": succ_status,
                "dependency_type": str(dep.get("dependency_type", "")),
                "lag_days": float(dep.get("lag_days", 0) or 0),
            })

    # Progress updates
    progress_updates = []
    if not ds.progress_updates.empty:
        upd_rows = ds.progress_updates[ds.progress_updates["task_id"] == task_id]
        for _, upd in upd_rows.sort_values("report_date").iterrows():
            progress_updates.append({
                "report_date": upd.get("report_date"),
                "percent_complete": float(upd.get("percent_complete", 0) or 0),
                "blocker": upd.get("blocker"),
                "note": upd.get("note"),
            })

    return TaskDetail(
        task_id=str(t["task_id"]),
        task_name=str(t.get("task_name", "")),
        dept_id=str(t.get("dept_id", "")),
        status=str(t.get("status", "")),
        planned_start=t.get("planned_start"),
        planned_end=t.get("planned_end"),
        actual_start=t.get("actual_start"),
        actual_end=t.get("actual_end"),
        owner_name=owner_name,
        component_id=t.get("component_id"),
        predecessors=predecessors,
        successors=successors,
        progress_updates=progress_updates,
    )
