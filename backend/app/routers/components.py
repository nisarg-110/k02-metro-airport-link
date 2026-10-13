from fastapi import APIRouter, HTTPException
from app.data_loader import get_data

router = APIRouter()


@router.get("/components")
def list_components():
    ds = get_data()
    if ds.components.empty:
        return []

    result = []
    for _, c in ds.components.iterrows():
        result.append({
            "component_id": c.get("component_id"),
            "parent_component_id": c.get("parent_component_id"),
            "component_name": str(c.get("component_name", "")),
            "component_type": str(c.get("component_type", "")),
            "owner_dept_id": c.get("owner_dept_id"),
            "quantity": float(c.get("quantity", 1) or 1),
            "unit_cost_inr": float(c.get("unit_cost_inr", 0) or 0),
            "governing_task_id": c.get("governing_task_id"),
            "status": str(c.get("status", "")),
        })
    return result


@router.get("/components/{component_id}")
def get_component(component_id: str):
    ds = get_data()
    rows = ds.components[ds.components["component_id"] == component_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail=f"Component {component_id} not found")

    c = rows.iloc[0]

    # Dependencies (what this component depends on)
    depends_on = []
    if not ds.component_dependencies.empty:
        dep_rows = ds.component_dependencies[ds.component_dependencies["component_id"] == component_id]
        for _, dep in dep_rows.iterrows():
            dep_id = dep["depends_on_component_id"]
            dep_comp_rows = ds.components[ds.components["component_id"] == str(dep_id)]
            dep_name = str(dep_comp_rows.iloc[0].get("component_name", dep_id)) if not dep_comp_rows.empty else str(dep_id)
            dep_status = str(dep_comp_rows.iloc[0].get("status", "")) if not dep_comp_rows.empty else ""
            depends_on.append({
                "component_id": str(dep_id),
                "component_name": dep_name,
                "status": dep_status,
                "dependency_type": str(dep.get("dependency_type", "")),
            })

    # Required by (components that depend on this)
    required_by = []
    if not ds.component_dependencies.empty:
        req_rows = ds.component_dependencies[ds.component_dependencies["depends_on_component_id"] == component_id]
        for _, req in req_rows.iterrows():
            req_id = req["component_id"]
            req_comp_rows = ds.components[ds.components["component_id"] == str(req_id)]
            req_name = str(req_comp_rows.iloc[0].get("component_name", req_id)) if not req_comp_rows.empty else str(req_id)
            req_status = str(req_comp_rows.iloc[0].get("status", "")) if not req_comp_rows.empty else ""
            required_by.append({
                "component_id": str(req_id),
                "component_name": req_name,
                "status": req_status,
                "dependency_type": str(req.get("dependency_type", "")),
            })

    # Children
    children = []
    if not ds.components.empty:
        child_rows = ds.components[ds.components["parent_component_id"] == component_id]
        for _, ch in child_rows.iterrows():
            children.append({
                "component_id": ch.get("component_id"),
                "component_name": str(ch.get("component_name", "")),
                "status": str(ch.get("status", "")),
                "component_type": str(ch.get("component_type", "")),
            })

    return {
        "component_id": c.get("component_id"),
        "parent_component_id": c.get("parent_component_id"),
        "component_name": str(c.get("component_name", "")),
        "component_type": str(c.get("component_type", "")),
        "owner_dept_id": c.get("owner_dept_id"),
        "quantity": float(c.get("quantity", 1) or 1),
        "unit_cost_inr": float(c.get("unit_cost_inr", 0) or 0),
        "governing_task_id": c.get("governing_task_id"),
        "status": str(c.get("status", "")),
        "depends_on": depends_on,
        "required_by": required_by,
        "children": children,
    }
