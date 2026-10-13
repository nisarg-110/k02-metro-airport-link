from fastapi import APIRouter
from app.data_loader import get_data, DataStore
from app.models import BudgetResponse, TrancheInfo

router = APIRouter()


def compute_budget_summary(ds: DataStore) -> BudgetResponse:
    total_grant = float(ds.tranches["amount_inr"].sum()) if not ds.tranches.empty else 0.0
    released_df = ds.tranches[ds.tranches["actual_release"].notna()] if not ds.tranches.empty else ds.tranches
    total_released = float(released_df["amount_inr"].sum()) if not released_df.empty else 0.0
    total_allocated = float(ds.allocations["amount_inr"].sum()) if not ds.allocations.empty else 0.0
    total_spent = float(ds.expenditures["amount_inr"].sum()) if not ds.expenditures.empty else 0.0

    tranches = []
    if not ds.tranches.empty:
        for _, t in ds.tranches.iterrows():
            tid = str(t["tranche_id"])

            # Milestone name
            ms_name = None
            cond_ms = t.get("condition_milestone_id")
            if cond_ms and not ds.milestones.empty:
                ms_rows = ds.milestones[ds.milestones["milestone_id"] == str(cond_ms)]
                if not ms_rows.empty:
                    ms_name = str(ms_rows.iloc[0].get("milestone_name", ""))

            # Allocations for this tranche
            alloc_list = []
            if not ds.allocations.empty:
                t_allocs = ds.allocations[ds.allocations["tranche_id"] == tid]
                for _, a in t_allocs.iterrows():
                    alloc_list.append({
                        "allocation_id": a["allocation_id"],
                        "dept_id": a["dept_id"],
                        "category": str(a.get("category", "")),
                        "amount_inr": float(a.get("amount_inr", 0) or 0),
                    })

            tranches.append(TrancheInfo(
                tranche_id=tid,
                pct_of_grant=float(t.get("pct_of_grant", 0) or 0),
                amount_inr=float(t.get("amount_inr", 0) or 0),
                condition_milestone_id=str(t.get("condition_milestone_id", "") or ""),
                expected_release=str(t["expected_release"]) if t.get("expected_release") else None,
                actual_release=str(t["actual_release"]) if t.get("actual_release") else None,
                status=str(t.get("status", "")),
                milestone_name=ms_name,
                allocations=alloc_list,
            ))

    return BudgetResponse(
        tranches=tranches,
        total_grant_inr=total_grant,
        total_released_inr=total_released,
        total_allocated_inr=total_allocated,
        total_spent_inr=total_spent,
    )


@router.get("/budget", response_model=BudgetResponse)
def get_budget():
    ds = get_data()
    return compute_budget_summary(ds)


@router.get("/budget/expenditures")
def get_expenditures():
    ds = get_data()
    if ds.expenditures.empty:
        return []

    rows = []
    for _, row in ds.expenditures.iterrows():
        rows.append({
            "expense_id": row.get("expense_id"),
            "dept_id": row.get("dept_id"),
            "allocation_id": row.get("allocation_id"),
            "category": row.get("category"),
            "po_id": row.get("po_id"),
            "vendor": row.get("vendor"),
            "amount_inr": float(row.get("amount_inr", 0) or 0),
            "expense_date": row.get("expense_date"),
            "description": row.get("description"),
            "invoice_no": row.get("invoice_no"),
            "requested_by": row.get("requested_by"),
            "approved_by": row.get("approved_by"),
        })
    return rows
