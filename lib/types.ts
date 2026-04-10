export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  batch_year: number | null;
  risk_score?: number | null;
  cluster?: string | null;
  placement_probability?: number | null;
  placement_probability_raw?: number | null;
  score_computed_at?: string | null;
  score_breakdown?: Record<string, unknown> | null;
  mock_tests_attempted?: number;
  last_portal_login?: string | null;
  placement_status?: string | null;
  active_backlogs?: number;
  internship_count?: number;
  cgpa?: number | null;
  open_alert_count?: number;
}

export interface VigiloScore {
  id: string;
  student_id: string;
  score: number;
  cluster: string;
  placement_probability: number;
  score_breakdown?: Record<string, unknown> | null;
  computed_at: string;
  is_latest: boolean;
}

export interface Alert {
  id: string;
  student_id: string;
  alert_type: "silent_30" | "score_drop" | "cluster_change" | "no_resume" | "zero_mocks" | string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  triggered_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  student_name?: string | null;
  student_department?: string | null;
  student_risk_score?: number | null;
  student_cluster?: string | null;
  student_placement_probability?: number | null;
}

export interface Intervention {
  id: string;
  student_id: string;
  created_by?: string;
  intervention_type: string;
  custom_message?: string | null;
  ai_generated_message?: string | null;
  status: "pending" | "sent" | "acknowledged" | "completed" | string;
  notes?: string | null;
  created_at: string;
  sent_at?: string | null;
  acknowledged_at?: string | null;
  student_name?: string | null;
  student_department?: string | null;
  assigned_officer_name?: string | null;
  student_risk_score?: number | null;
  student_cluster?: string | null;
  student_placement_probability?: number | null;
}

export interface ActivityLog {
  id: string;
  student_id: string;
  activity_type: string;
  metadata?: Record<string, unknown> | null;
  logged_at: string;
}

export interface PlacementDrive {
  id: string;
  company_name: string;
  role: string;
  package_lpa: number;
  drive_date: string;
  eligibility_criteria?: {
    min_cgpa?: number;
    allowed_branches?: string[];
    departments?: string[];
    [key: string]: unknown;
  } | null;
  status: "upcoming" | "ongoing" | "completed" | string;
  created_at?: string;
}

export interface AnalyticsOverview {
  total_students: number;
  placed_count: number;
  at_risk_count: number;
  silent_dropout_count: number;
  placement_rate: number;
  avg_vigilo_score: number;
  alerts_open: number;
}

export interface ClusterDistributionItem {
  cluster: string;
  count: number;
  percentage: number;
  avg_score?: number;
}

export interface ClusterDistribution {
  total: number;
  items: ClusterDistributionItem[];
}

export interface DepartmentBreakdown {
  department: string;
  student_count: number;
  placed_count: number;
  avg_score: number;
  at_risk_count: number;
  placement_rate?: number;
  placement_ready?: number;
  silent_dropout?: number;
}

export interface ScoreTrend {
  date: string;
  avg_score: number;
  all_students?: number;
  at_risk?: number;
  placement_ready?: number;
  silent_dropout?: number;
}

export interface ImpactSimulation {
  current_rate: number;
  projected_rate: number;
  students_impacted: number;
}

export interface Notification {
  id: string;
  intervention_id?: string | null;
  student_id: string;
  channel: "in_app" | "email" | "sms" | "whatsapp" | string;
  status: "queued" | "sent" | "delivered" | "failed" | string;
  message_preview?: string | null;
  failed_reason?: string | null;
  is_read?: boolean;
  sent_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  student_name?: string | null;
  student_department?: string | null;
}

export interface PagedResponse<T> {
  page: number;
  limit: number;
  count: number;
  items: T[];
}

export interface StudentMeResponse {
  profile: StudentProfile;
  student_profile: {
    id: string;
    cgpa?: number | null;
    active_backlogs?: number;
    internship_count?: number;
    mock_tests_attempted?: number;
    mock_avg_score?: number | null;
    certifications_count?: number;
    placement_status?: string | null;
    company_placed?: string | null;
    last_portal_login?: string | null;
    resume_updated_at?: string | null;
  } | null;
}
