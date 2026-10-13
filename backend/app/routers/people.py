from fastapi import APIRouter
from app.data_loader import get_data
from app.models import PersonRow

router = APIRouter()


@router.get("/people", response_model=list[PersonRow])
def list_people():
    ds = get_data()
    if ds.researchers.empty:
        return []

    # Build dept name lookup
    dept_names = {}
    if not ds.departments.empty:
        for _, d in ds.departments.iterrows():
            dept_names[d["dept_id"]] = str(d.get("dept_name", ""))

    result = []
    for _, r in ds.researchers.iterrows():
        dept_id = str(r.get("dept_id", "") or "")
        result.append(PersonRow(
            researcher_id=str(r["researcher_id"]),
            full_name=str(r.get("full_name", "")),
            dept_id=dept_id,
            dept_name=dept_names.get(dept_id, dept_id),
            role=str(r.get("role", "")),
            email=str(r.get("email", "")),
            project_allocation_pct=float(r.get("project_allocation_pct", 0) or 0),
            monthly_cost_inr=float(r.get("monthly_cost_inr", 0) or 0),
            joined_on=str(r["joined_on"]) if r.get("joined_on") else None,
            left_on=str(r["left_on"]) if r.get("left_on") else None,
            status=str(r.get("status", "")),
        ))
    return result
