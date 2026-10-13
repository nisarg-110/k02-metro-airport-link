export interface KPISummary {
  total_grant_inr: number;
  total_released_inr: number;
  total_allocated_inr: number;
  total_spent_inr: number;
}

export interface TaskCounts {
  completed: number;
  in_progress: number;
  not_started: number;
  total: number;
}

export interface AnomalyCounts {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface MilestoneStatus {
  milestone_id: string;
  name: string;
  due_date: string | null;
  reported_status: string;
  releases_tranche_id: string | null;
  tranche_amount_inr: number | null;
  linked_task_statuses: string[];
  is_at_risk: boolean;
}

export interface DashboardResponse {
  kpi: KPISummary;
  task_counts: TaskCounts;
  anomaly_counts: AnomalyCounts;
  milestones: MilestoneStatus[];
  dept_budgets: Array<{
    dept_id: string;
    dept_name: string;
    budget: number;
    allocated: number;
    spent: number;
  }>;
}

export interface DepartmentSummary {
  dept_id: string;
  dept_name: string;
  total_budget_inr: number;
  allocated_inr: number;
  spent_inr: number;
  head_name: string;
  task_counts: TaskCounts;
}

export interface DepartmentDetail {
  dept_id: string;
  dept_name: string;
  scope: string;
  total_budget_inr: number;
  allocated_inr: number;
  spent_inr: number;
  head_name: string;
  tasks: TaskItem[];
  people: PersonItem[];
  allocations_by_category: { category: string; amount_inr: number }[];
}

export interface TaskItem {
  task_id: string;
  task_name: string;
  status: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  owner_researcher_id: string | null;
  component_id: string | null;
  percent_complete: number;
}

export interface PersonItem {
  researcher_id: string;
  full_name: string;
  role: string;
  status: string;
  project_allocation_pct: number;
  monthly_cost_inr: number;
  email: string;
}

export interface AnomalyItem {
  anomaly_id: string;
  rule_id: string;
  severity: 'high' | 'medium' | 'low';
  entity_type: string;
  entity_id: string;
  description: string;
  detail: string;
}

export interface TaskSummary {
  task_id: string;
  task_name: string;
  dept_id: string;
  status: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  owner_researcher_id: string | null;
  component_id: string | null;
}

export interface PersonRow {
  researcher_id: string;
  full_name: string;
  dept_id: string;
  dept_name: string;
  role: string;
  email: string;
  project_allocation_pct: number;
  monthly_cost_inr: number;
  joined_on: string | null;
  left_on: string | null;
  status: string;
}

export interface TrancheInfo {
  tranche_id: string;
  pct_of_grant: number;
  amount_inr: number;
  condition_milestone_id: string;
  expected_release: string | null;
  actual_release: string | null;
  status: string;
  milestone_name: string | null;
  allocations: Array<{
    allocation_id: string;
    dept_id: string;
    category: string;
    amount_inr: number;
  }>;
}

export interface BudgetResponse {
  tranches: TrancheInfo[];
  total_grant_inr: number;
  total_released_inr: number;
  total_allocated_inr: number;
  total_spent_inr: number;
}

export interface Expenditure {
  expense_id: string;
  dept_id: string;
  allocation_id: string;
  category: string;
  po_id: string | null;
  vendor: string | null;
  amount_inr: number;
  expense_date: string;
  description: string;
  invoice_no: string;
  requested_by: string;
  approved_by: string;
}

export interface TaskDependency {
  predecessor_task_id: string;
  successor_task_id: string;
  dependency_type: string;
  lag_days: number;
}

export interface Component {
  component_id: string;
  parent_component_id: string | null;
  component_name: string;
  component_type: string;
  owner_dept_id: string | null;
  quantity: number;
  unit_cost_inr: number;
  governing_task_id: string | null;
  status: string;
}
