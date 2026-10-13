import os
import pandas as pd
import numpy as np
from pathlib import Path


def _normalize_status(val):
    """Normalize status string to lowercase_underscore."""
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    s = str(val).strip().lower().replace(" ", "_").replace("-", "_")
    return s


def _nan_to_none(val):
    """Convert NaN / empty string to None."""
    if val is None:
        return None
    if isinstance(val, float) and np.isnan(val):
        return None
    if isinstance(val, str) and val.strip() == "":
        return None
    return val


def _clean_df(df: pd.DataFrame) -> pd.DataFrame:
    """Replace NaN with None across the whole dataframe."""
    return df.where(pd.notnull(df), None)


class DataStore:
    def __init__(self):
        self.departments: pd.DataFrame = pd.DataFrame()
        self.researchers: pd.DataFrame = pd.DataFrame()
        self.tranches: pd.DataFrame = pd.DataFrame()
        self.allocations: pd.DataFrame = pd.DataFrame()
        self.work_packages: pd.DataFrame = pd.DataFrame()
        self.task_dependencies: pd.DataFrame = pd.DataFrame()
        self.milestones: pd.DataFrame = pd.DataFrame()
        self.progress_updates: pd.DataFrame = pd.DataFrame()
        self.components: pd.DataFrame = pd.DataFrame()
        self.component_dependencies: pd.DataFrame = pd.DataFrame()
        self.purchase_orders: pd.DataFrame = pd.DataFrame()
        self.expenditures: pd.DataFrame = pd.DataFrame()
        self.timesheets: pd.DataFrame = pd.DataFrame()
        self._loaded = False

    def load(self):
        data_dir = Path(os.environ.get("DATA_DIR", "../data"))

        # --- departments ---
        df = pd.read_csv(data_dir / "departments.csv", dtype=str)
        df = _clean_df(df)
        df["total_budget_inr"] = pd.to_numeric(df["total_budget_inr"], errors="coerce")
        self.departments = df

        # --- researchers ---
        df = pd.read_csv(data_dir / "researchers.csv", dtype=str)
        df = _clean_df(df)
        df["project_allocation_pct"] = pd.to_numeric(df["project_allocation_pct"], errors="coerce").fillna(0)
        df["monthly_cost_inr"] = pd.to_numeric(df["monthly_cost_inr"], errors="coerce").fillna(0)
        df["status"] = df["status"].apply(_normalize_status)
        # Convert empty left_on to None
        df["left_on"] = df["left_on"].apply(_nan_to_none)
        self.researchers = df

        # --- funding tranches ---
        df = pd.read_csv(data_dir / "funding_tranches.csv", dtype=str)
        df = _clean_df(df)
        df["amount_inr"] = pd.to_numeric(df["amount_inr"], errors="coerce")
        df["pct_of_grant"] = pd.to_numeric(df["pct_of_grant"], errors="coerce")
        df["status"] = df["status"].apply(_normalize_status)
        df["actual_release"] = df["actual_release"].apply(_nan_to_none)
        df["expected_release"] = df["expected_release"].apply(_nan_to_none)
        self.tranches = df

        # --- budget allocations ---
        df = pd.read_csv(data_dir / "budget_allocations.csv", dtype=str)
        df = _clean_df(df)
        df["amount_inr"] = pd.to_numeric(df["amount_inr"], errors="coerce")
        self.allocations = df

        # --- work packages ---
        df = pd.read_csv(data_dir / "work_packages.csv", dtype=str)
        df = _clean_df(df)
        df["status"] = df["status"].apply(_normalize_status)
        # Normalize empty strings to None for optional fields
        for col in ["actual_start", "actual_end", "planned_start", "planned_end", "component_id", "owner_researcher_id", "parent_task_id"]:
            if col in df.columns:
                df[col] = df[col].apply(_nan_to_none)
        self.work_packages = df

        # --- task dependencies ---
        df = pd.read_csv(data_dir / "task_dependencies.csv", dtype=str)
        df = _clean_df(df)
        df["lag_days"] = pd.to_numeric(df.get("lag_days", pd.Series(dtype=float)), errors="coerce").fillna(0)
        self.task_dependencies = df

        # --- milestones ---
        df = pd.read_csv(data_dir / "milestones.csv", dtype=str)
        df = _clean_df(df)
        df["reported_status"] = df["reported_status"].apply(_normalize_status)
        df["releases_tranche_id"] = df["releases_tranche_id"].apply(_nan_to_none)
        df["linked_task_ids"] = df["linked_task_ids"].apply(_nan_to_none)
        self.milestones = df

        # --- progress updates ---
        df = pd.read_csv(data_dir / "progress_updates.csv", dtype=str)
        df = _clean_df(df)
        df["percent_complete"] = pd.to_numeric(df["percent_complete"], errors="coerce").fillna(0)
        df["blocker"] = df["blocker"].apply(_nan_to_none)
        self.progress_updates = df

        # --- components ---
        df = pd.read_csv(data_dir / "components.csv", dtype=str)
        df = _clean_df(df)
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(1)
        df["unit_cost_inr"] = pd.to_numeric(df["unit_cost_inr"], errors="coerce").fillna(0)
        df["status"] = df["status"].apply(_normalize_status)
        df["parent_component_id"] = df["parent_component_id"].apply(_nan_to_none)
        df["governing_task_id"] = df["governing_task_id"].apply(_nan_to_none)
        self.components = df

        # --- component dependencies ---
        df = pd.read_csv(data_dir / "component_dependencies.csv", dtype=str)
        df = _clean_df(df)
        self.component_dependencies = df

        # --- purchase orders ---
        df = pd.read_csv(data_dir / "purchase_orders.csv", dtype=str)
        df = _clean_df(df)
        df["po_amount_inr"] = pd.to_numeric(df["po_amount_inr"], errors="coerce").fillna(0)
        df["po_status"] = df["po_status"].apply(_normalize_status)
        df["actual_delivery"] = df["actual_delivery"].apply(_nan_to_none)
        df["expected_delivery"] = df["expected_delivery"].apply(_nan_to_none) if "expected_delivery" in df.columns else None
        self.purchase_orders = df

        # --- expenditures ---
        df = pd.read_csv(data_dir / "expenditures.csv", dtype=str)
        df = _clean_df(df)
        df["amount_inr"] = pd.to_numeric(df["amount_inr"], errors="coerce").fillna(0)
        df["po_id"] = df["po_id"].apply(_nan_to_none)
        df["vendor"] = df["vendor"].apply(_nan_to_none)
        df["category"] = df["category"].apply(_normalize_status)
        self.expenditures = df

        # --- timesheets ---
        df = pd.read_csv(data_dir / "timesheets.csv", dtype=str)
        df = _clean_df(df)
        df["hours"] = pd.to_numeric(df["hours"], errors="coerce").fillna(0)
        self.timesheets = df

        self._loaded = True

    def ensure_loaded(self):
        if not self._loaded:
            self.load()


# Global singleton
data_store = DataStore()


def get_data() -> DataStore:
    data_store.ensure_loaded()
    return data_store
