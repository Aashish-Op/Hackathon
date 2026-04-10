import {
  ALERT_QUEUE,
  ANALYTICS_AREA_TREND,
  ANALYTICS_DEPARTMENT_RISK,
  ANALYTICS_EFFECTIVENESS,
  ANALYTICS_KPIS,
  ANALYTICS_SKILL_GAPS,
  DASHBOARD_CONFIDENCE,
  DASHBOARD_METRICS,
  DASHBOARD_PROBABILITY_TREND,
  DASHBOARD_RECENT_ALERTS,
  DASHBOARD_RISK_DISTRIBUTION,
  DASHBOARD_SEGMENTS,
  FORECAST_TABLE,
  INACTIVE_CLUSTER,
  INTERVENTIONS,
  INTERVENTION_STATS,
  NUDGE_FEED,
  NUDGE_STATS,
  RISK_ALERT_STATS,
  SEGMENTATION_CLUSTER_CARDS,
  SEGMENTATION_RADAR_DATA,
  SEGMENTATION_SCHEDULE,
  STUDENTS,
  STUDENT_STATS,
} from "@/lib/constants";

export interface DashboardViewData {
  dashboardMetrics: typeof DASHBOARD_METRICS;
  dashboardRiskDistribution: typeof DASHBOARD_RISK_DISTRIBUTION;
  dashboardProbabilityTrend: typeof DASHBOARD_PROBABILITY_TREND;
  dashboardSegments: typeof DASHBOARD_SEGMENTS;
  dashboardConfidence: typeof DASHBOARD_CONFIDENCE;
  dashboardRecentAlerts: typeof DASHBOARD_RECENT_ALERTS;
  studentStats: typeof STUDENT_STATS;
  students: typeof STUDENTS;
  riskAlertStats: typeof RISK_ALERT_STATS;
  alertQueue: typeof ALERT_QUEUE;
  interventionStats: typeof INTERVENTION_STATS;
  interventions: typeof INTERVENTIONS;
  analyticsKpis: typeof ANALYTICS_KPIS;
  analyticsAreaTrend: typeof ANALYTICS_AREA_TREND;
  analyticsDepartmentRisk: typeof ANALYTICS_DEPARTMENT_RISK;
  analyticsEffectiveness: typeof ANALYTICS_EFFECTIVENESS;
  analyticsSkillGaps: typeof ANALYTICS_SKILL_GAPS;
  forecastTable: typeof FORECAST_TABLE;
  segmentationSchedule: typeof SEGMENTATION_SCHEDULE;
  segmentationClusterCards: typeof SEGMENTATION_CLUSTER_CARDS;
  inactiveCluster: typeof INACTIVE_CLUSTER;
  segmentationRadarData: typeof SEGMENTATION_RADAR_DATA;
  nudgeStats: typeof NUDGE_STATS;
  nudgeFeed: typeof NUDGE_FEED;
  fetchedAt: string | null;
}

export const fallbackDashboardViewData: DashboardViewData = {
  dashboardMetrics: DASHBOARD_METRICS,
  dashboardRiskDistribution: DASHBOARD_RISK_DISTRIBUTION,
  dashboardProbabilityTrend: DASHBOARD_PROBABILITY_TREND,
  dashboardSegments: DASHBOARD_SEGMENTS,
  dashboardConfidence: DASHBOARD_CONFIDENCE,
  dashboardRecentAlerts: DASHBOARD_RECENT_ALERTS,
  studentStats: STUDENT_STATS,
  students: STUDENTS,
  riskAlertStats: RISK_ALERT_STATS,
  alertQueue: ALERT_QUEUE,
  interventionStats: INTERVENTION_STATS,
  interventions: INTERVENTIONS,
  analyticsKpis: ANALYTICS_KPIS,
  analyticsAreaTrend: ANALYTICS_AREA_TREND,
  analyticsDepartmentRisk: ANALYTICS_DEPARTMENT_RISK,
  analyticsEffectiveness: ANALYTICS_EFFECTIVENESS,
  analyticsSkillGaps: ANALYTICS_SKILL_GAPS,
  forecastTable: FORECAST_TABLE,
  segmentationSchedule: SEGMENTATION_SCHEDULE,
  segmentationClusterCards: SEGMENTATION_CLUSTER_CARDS,
  inactiveCluster: INACTIVE_CLUSTER,
  segmentationRadarData: SEGMENTATION_RADAR_DATA,
  nudgeStats: NUDGE_STATS,
  nudgeFeed: NUDGE_FEED,
  fetchedAt: null,
};
