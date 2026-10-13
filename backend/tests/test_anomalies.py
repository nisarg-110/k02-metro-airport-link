import pandas as pd
import pytest
from app.data_loader import DataStore
from app.anomaly_detector import detect_all_anomalies


def make_ds():
    """Create a minimal DataStore with empty DataFrames."""
    ds = DataStore()
    ds.tranches = pd.DataFrame(columns=[
        "tranche_id", "pct_of_grant", "amount_inr", "condition_milestone_id",
        "expected_release", "actual_release", "status"
    ])
    ds.allocations = pd.DataFrame(columns=[
        "allocation_id", "dept_id", "category", "tranche_id", "amount_inr"
    ])
    ds.expenditures = pd.DataFrame(columns=[
        "expense_id", "dept_id", "allocation_id", "category", "po_id", "vendor",
        "amount_inr", "expense_date", "description", "invoice_no", "requested_by", "approved_by"
    ])
    ds.researchers = pd.DataFrame(columns=[
        "researcher_id", "full_name", "dept_id", "role", "email",
        "project_allocation_pct", "monthly_cost_inr", "joined_on", "left_on", "status"
    ])
    ds.work_packages = pd.DataFrame(columns=[
        "task_id", "parent_task_id", "dept_id", "task_name", "component_id",
        "owner_researcher_id", "planned_start", "planned_end", "actual_start", "actual_end", "status"
    ])
    ds.task_dependencies = pd.DataFrame(columns=[
        "predecessor_task_id", "successor_task_id", "dependency_type", "lag_days"
    ])
    ds.components = pd.DataFrame(columns=[
        "component_id", "parent_component_id", "component_name", "component_type",
        "owner_dept_id", "quantity", "unit_cost_inr", "governing_task_id", "status"
    ])
    ds.component_dependencies = pd.DataFrame(columns=[
        "component_id", "depends_on_component_id", "dependency_type"
    ])
    ds.timesheets = pd.DataFrame(columns=[
        "researcher_id", "week_start", "task_id", "activity", "hours"
    ])
    ds.milestones = pd.DataFrame(columns=[
        "milestone_id", "milestone_name", "due_date", "linked_task_ids",
        "releases_tranche_id", "reported_status"
    ])
    ds.purchase_orders = pd.DataFrame(columns=[
        "po_id", "dept_id", "vendor", "component_id", "category",
        "po_amount_inr", "order_date", "expected_delivery", "actual_delivery", "po_status"
    ])
    ds.departments = pd.DataFrame(columns=[
        "dept_id", "dept_name", "scope", "total_budget_inr", "head_researcher_id"
    ])
    ds.progress_updates = pd.DataFrame(columns=[
        "update_id", "task_id", "report_date", "percent_complete", "reported_by", "blocker", "note"
    ])
    ds._loaded = True
    return ds


def test_rule3a_self_approval():
    ds = make_ds()
    ds.expenditures = pd.DataFrame([{
        "expense_id": "EX001", "dept_id": "CVL", "allocation_id": "AL001",
        "category": "manpower", "po_id": None, "vendor": None,
        "amount_inr": 100000, "expense_date": "2026-01-01",
        "description": "Test", "invoice_no": "INV001",
        "requested_by": "R001", "approved_by": "R001"
    }])
    anomalies = detect_all_anomalies(ds)
    rule3a = [a for a in anomalies if a.rule_id == "RULE3a"]
    assert len(rule3a) >= 1
    assert any(a.entity_id == "EX001" for a in rule3a)


def test_rule2b_po_overspend():
    ds = make_ds()
    ds.purchase_orders = pd.DataFrame([{
        "po_id": "PO001", "dept_id": "CVL", "vendor": "V1", "component_id": "COMP1",
        "category": "equipment", "po_amount_inr": 1000000,
        "order_date": "2026-01-01", "expected_delivery": None,
        "actual_delivery": None, "po_status": "delivered"
    }])
    ds.expenditures = pd.DataFrame([
        {
            "expense_id": "EX001", "dept_id": "CVL", "allocation_id": "AL001",
            "category": "equipment", "po_id": "PO001", "vendor": "V1",
            "amount_inr": 600000, "expense_date": "2026-01-15",
            "description": "Test", "invoice_no": "INV001",
            "requested_by": "R001", "approved_by": "R002"
        },
        {
            "expense_id": "EX002", "dept_id": "CVL", "allocation_id": "AL001",
            "category": "equipment", "po_id": "PO001", "vendor": "V1",
            "amount_inr": 600000, "expense_date": "2026-02-15",
            "description": "Test", "invoice_no": "INV002",
            "requested_by": "R001", "approved_by": "R002"
        },
    ])
    anomalies = detect_all_anomalies(ds)
    rule2b = [a for a in anomalies if a.rule_id == "RULE2b"]
    assert len(rule2b) >= 1
    assert any(a.entity_id == "PO001" for a in rule2b)


def test_rule1_unreleased_tranche():
    ds = make_ds()
    ds.tranches = pd.DataFrame([{
        "tranche_id": "T3", "pct_of_grant": 20, "amount_inr": 134560000,
        "condition_milestone_id": "M4", "expected_release": "2026-11-05",
        "actual_release": None, "status": "pending"
    }])
    ds.allocations = pd.DataFrame([{
        "allocation_id": "AL099", "dept_id": "CVL", "category": "equipment",
        "tranche_id": "T3", "amount_inr": 5000000
    }])
    ds.expenditures = pd.DataFrame([{
        "expense_id": "EX099", "dept_id": "CVL", "allocation_id": "AL099",
        "category": "equipment", "po_id": "PO001", "vendor": "V1",
        "amount_inr": 500000, "expense_date": "2026-08-01",
        "description": "Test", "invoice_no": "INV099",
        "requested_by": "R001", "approved_by": "R002"
    }])
    anomalies = detect_all_anomalies(ds)
    rule1 = [a for a in anomalies if a.rule_id == "RULE1"]
    assert len(rule1) >= 1
    assert any(a.entity_id == "EX099" for a in rule1)


def test_rule2a_missing_po():
    ds = make_ds()
    ds.expenditures = pd.DataFrame([{
        "expense_id": "EX010", "dept_id": "CVL", "allocation_id": "AL001",
        "category": "equipment", "po_id": None, "vendor": "V1",
        "amount_inr": 750000, "expense_date": "2026-02-01",
        "description": "Large equipment purchase", "invoice_no": "INV010",
        "requested_by": "R001", "approved_by": "R002"
    }])
    anomalies = detect_all_anomalies(ds)
    rule2a = [a for a in anomalies if a.rule_id == "RULE2a"]
    assert len(rule2a) >= 1
    assert any(a.entity_id == "EX010" for a in rule2a)


def test_rule3b_exited_approver():
    ds = make_ds()
    ds.researchers = pd.DataFrame([{
        "researcher_id": "R099", "full_name": "Old Employee",
        "dept_id": "CVL", "role": "Former Lead", "email": "old@test.com",
        "project_allocation_pct": 0, "monthly_cost_inr": 0,
        "joined_on": "2025-10-01", "left_on": "2026-01-01", "status": "exited"
    }])
    ds.expenditures = pd.DataFrame([{
        "expense_id": "EX020", "dept_id": "CVL", "allocation_id": "AL001",
        "category": "manpower", "po_id": None, "vendor": None,
        "amount_inr": 50000, "expense_date": "2026-03-01",
        "description": "Test", "invoice_no": "INV020",
        "requested_by": "R001", "approved_by": "R099"
    }])
    anomalies = detect_all_anomalies(ds)
    rule3b = [a for a in anomalies if a.rule_id == "RULE3b"]
    assert len(rule3b) >= 1
    assert any(a.entity_id == "EX020" for a in rule3b)


def test_rule7_milestone_achieved_incomplete_task():
    ds = make_ds()
    ds.milestones = pd.DataFrame([{
        "milestone_id": "M99", "milestone_name": "Test Milestone",
        "due_date": "2026-10-01", "linked_task_ids": "CVL-99",
        "releases_tranche_id": "T3", "reported_status": "achieved"
    }])
    ds.work_packages = pd.DataFrame([{
        "task_id": "CVL-99", "parent_task_id": "WP-CVL", "dept_id": "CVL",
        "task_name": "Test Task", "component_id": None,
        "owner_researcher_id": "R001", "planned_start": "2026-08-01",
        "planned_end": "2026-09-30", "actual_start": "2026-08-05",
        "actual_end": None, "status": "in_progress"
    }])
    anomalies = detect_all_anomalies(ds)
    rule7 = [a for a in anomalies if a.rule_id == "RULE7"]
    assert len(rule7) >= 1
    assert any(a.entity_id == "M99" for a in rule7)


def test_rule6_timesheet_overallocation():
    ds = make_ds()
    ds.researchers = pd.DataFrame([{
        "researcher_id": "R001", "full_name": "Hard Worker",
        "dept_id": "CVL", "role": "Scholar", "email": "hw@test.com",
        "project_allocation_pct": 50, "monthly_cost_inr": 42000,
        "joined_on": "2025-10-01", "left_on": None, "status": "active"
    }])
    # 50% allocation => 20 hours/week allowed; log 25 (> 20 * 1.1 = 22)
    ds.timesheets = pd.DataFrame([{
        "researcher_id": "R001", "week_start": "2026-01-05",
        "task_id": "CVL-01", "activity": "", "hours": 25.0
    }])
    anomalies = detect_all_anomalies(ds)
    rule6 = [a for a in anomalies if a.rule_id == "RULE6"]
    assert len(rule6) >= 1
    assert any(a.entity_id == "R001" for a in rule6)


def test_empty_datastore_no_crash():
    """Anomaly detector must not crash on empty DataFrames."""
    ds = make_ds()
    anomalies = detect_all_anomalies(ds)
    assert isinstance(anomalies, list)
    assert len(anomalies) == 0
