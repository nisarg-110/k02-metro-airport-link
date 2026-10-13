import pandas as pd
import pytest
from app.data_loader import DataStore
from app.routers.budget import compute_budget_summary


def make_minimal_ds():
    ds = DataStore()
    ds.tranches = pd.DataFrame([
        {
            "tranche_id": "T1", "amount_inr": 235479999,
            "actual_release": "2025-10-19", "status": "released",
            "condition_milestone_id": "M1", "pct_of_grant": 35,
            "expected_release": "2025-10-11"
        },
        {
            "tranche_id": "T2", "amount_inr": 235479999,
            "actual_release": "2026-04-15", "status": "released",
            "condition_milestone_id": "M2", "pct_of_grant": 35,
            "expected_release": "2026-03-20"
        },
        {
            "tranche_id": "T3", "amount_inr": 134560000,
            "actual_release": None, "status": "pending",
            "condition_milestone_id": "M4", "pct_of_grant": 20,
            "expected_release": "2026-11-05"
        },
        {
            "tranche_id": "T4", "amount_inr": 67280000,
            "actual_release": None, "status": "pending",
            "condition_milestone_id": "M6", "pct_of_grant": 10,
            "expected_release": "2027-03-20"
        },
    ])
    ds.allocations = pd.DataFrame([
        {
            "allocation_id": "AL001", "dept_id": "CVL",
            "category": "civil_works", "tranche_id": "T1", "amount_inr": 11725000
        },
    ])
    ds.expenditures = pd.DataFrame([
        {
            "expense_id": "EX001", "dept_id": "CVL", "allocation_id": "AL001",
            "category": "civil_works", "po_id": None, "vendor": None,
            "amount_inr": 5000000, "expense_date": "2026-01-01",
            "description": "Test", "invoice_no": "INV001",
            "requested_by": "R001", "approved_by": "R002"
        },
    ])
    ds.departments = pd.DataFrame([{
        "dept_id": "CVL", "dept_name": "Civil & Structures",
        "scope": "test", "total_budget_inr": 43800000, "head_researcher_id": "R001"
    }])
    ds.researchers = pd.DataFrame([{
        "researcher_id": "R001", "full_name": "Test User",
        "dept_id": "CVL", "role": "Lead", "email": "test@test.com",
        "project_allocation_pct": 20, "monthly_cost_inr": 0,
        "joined_on": "2025-10-01", "left_on": None, "status": "active"
    }])
    ds.milestones = pd.DataFrame(columns=[
        "milestone_id", "milestone_name", "due_date",
        "linked_task_ids", "releases_tranche_id", "reported_status"
    ])
    ds._loaded = True
    return ds


def test_total_grant():
    ds = make_minimal_ds()
    total = ds.tranches["amount_inr"].sum()
    assert total == pytest.approx(672799998)


def test_total_released():
    ds = make_minimal_ds()
    released = ds.tranches[ds.tranches["actual_release"].notna()]["amount_inr"].sum()
    assert released == pytest.approx(470959998)


def test_total_spent():
    ds = make_minimal_ds()
    spent = ds.expenditures["amount_inr"].sum()
    assert spent == pytest.approx(5000000)


def test_budget_response_structure():
    ds = make_minimal_ds()
    response = compute_budget_summary(ds)
    assert response.total_grant_inr == pytest.approx(672799998)
    assert response.total_released_inr == pytest.approx(470959998)
    assert response.total_spent_inr == pytest.approx(5000000)
    assert len(response.tranches) == 4


def test_tranche_details():
    ds = make_minimal_ds()
    response = compute_budget_summary(ds)
    t1 = next(t for t in response.tranches if t.tranche_id == "T1")
    assert t1.status == "released"
    assert t1.actual_release == "2025-10-19"
    assert t1.pct_of_grant == pytest.approx(35)

    t3 = next(t for t in response.tranches if t.tranche_id == "T3")
    assert t3.status == "pending"
    assert t3.actual_release is None


def test_tranche_allocations():
    ds = make_minimal_ds()
    response = compute_budget_summary(ds)
    t1 = next(t for t in response.tranches if t.tranche_id == "T1")
    assert len(t1.allocations) == 1
    assert t1.allocations[0]["amount_inr"] == pytest.approx(11725000)
