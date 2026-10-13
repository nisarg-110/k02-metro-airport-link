from typing import Optional
from pydantic import BaseModel


class KPISummary(BaseModel):
    total_grant_inr: float
    total_released_inr: float
    total_allocated_inr: float
    total_spent_inr: float


class TaskCounts(BaseModel):
    completed: int
    in_progress: int
    not_started: int
    total: int


class AnomalyCounts(BaseModel):
    high: int
    medium: int
    low: int
    total: int


class MilestoneStatus(BaseModel):
    milestone_id: str
    name: str
    due_date: Optional[str]
    reported_status: str
    releases_tranche_id: Optional[str]
    tranche_amount_inr: Optional[float]
    linked_task_statuses: list[str]
    is_at_risk: bool


class DashboardResponse(BaseModel):
    kpi: KPISummary
    task_counts: TaskCounts
    anomaly_counts: AnomalyCounts
    milestones: list[MilestoneStatus]
    dept_budgets: list[dict]


class DepartmentSummary(BaseModel):
    dept_id: str
    dept_name: str
    total_budget_inr: float
    allocated_inr: float
    spent_inr: float
    head_name: str
    task_counts: TaskCounts


class DepartmentDetail(BaseModel):
    dept_id: str
    dept_name: str
    scope: str
    total_budget_inr: float
    allocated_inr: float
    spent_inr: float
    head_name: str
    tasks: list[dict]
    people: list[dict]
    allocations_by_category: list[dict]


class TrancheInfo(BaseModel):
    tranche_id: str
    pct_of_grant: float
    amount_inr: float
    condition_milestone_id: str
    expected_release: Optional[str]
    actual_release: Optional[str]
    status: str
    milestone_name: Optional[str]
    allocations: list[dict]


class BudgetResponse(BaseModel):
    tranches: list[TrancheInfo]
    total_grant_inr: float
    total_released_inr: float
    total_allocated_inr: float
    total_spent_inr: float


class AnomalyItem(BaseModel):
    anomaly_id: str
    rule_id: str
    severity: str  # high, medium, low
    entity_type: str  # expense, task, component, researcher, milestone
    entity_id: str
    description: str
    detail: str


class TaskSummary(BaseModel):
    task_id: str
    task_name: str
    dept_id: str
    status: str
    planned_start: Optional[str]
    planned_end: Optional[str]
    actual_start: Optional[str]
    actual_end: Optional[str]
    owner_researcher_id: Optional[str]
    component_id: Optional[str]


class TaskDetail(BaseModel):
    task_id: str
    task_name: str
    dept_id: str
    status: str
    planned_start: Optional[str]
    planned_end: Optional[str]
    actual_start: Optional[str]
    actual_end: Optional[str]
    owner_name: Optional[str]
    component_id: Optional[str]
    predecessors: list[dict]
    successors: list[dict]
    progress_updates: list[dict]


class PersonRow(BaseModel):
    researcher_id: str
    full_name: str
    dept_id: str
    dept_name: str
    role: str
    email: str
    project_allocation_pct: float
    monthly_cost_inr: float
    joined_on: Optional[str]
    left_on: Optional[str]
    status: str
