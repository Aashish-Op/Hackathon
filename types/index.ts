export type StudentCluster =
  | "ready"
  | "at-risk"
  | "high-risk"
  | "inactive"
  | "unprepared";

export type RiskBadgeLevel = "critical" | "high" | "medium" | "low" | "ready";
export type Department = "CSE" | "IT" | "ECE" | "MECH" | "CIVIL" | "MBA";
export type YearOfStudy = "1st" | "2nd" | "3rd" | "4th";
export type Gender = "Male" | "Female" | "Other" | "Prefer not to say";
export type PublicLinkTone = "sky" | "slate" | "amber" | "emerald" | "violet";
export type ContestPlatform =
  | "LeetCode"
  | "Codeforces"
  | "CodeChef"
  | "HackerRank"
  | "AtCoder";
export type CertificateCategory =
  | "Cloud"
  | "DSA"
  | "Web Dev"
  | "AI/ML"
  | "Database"
  | "Soft Skills"
  | "Other";
export type ProjectType =
  | "Academic"
  | "Personal"
  | "Open Source"
  | "Freelance"
  | "Internship";
export type EmploymentType = "Internship" | "Part-time" | "Full-time" | "Contract";
export type SoftSkillLevel = "yes" | "developing" | "no";
export type NoticePeriod = "Immediate" | "15 days" | "30 days" | "60 days";
export type WorkModePreference = "In-Office" | "Hybrid" | "Remote" | "No Preference";
export type CategoryOption = "General" | "OBC" | "SC" | "ST" | "EWS";

export type StudentRouteKey =
  | "overview"
  | "progress"
  | "action-plan"
  | "profile-builder"
  | "skill-tracker"
  | "mock-interviews"
  | "achievements"
  | "notifications";

export type ProfileSection =
  | "basic"
  | "academic"
  | "resume"
  | "links"
  | "contests"
  | "certifications"
  | "projects"
  | "experience"
  | "skills"
  | "preferences"
  | "additional";

export interface SkillScores {
  dsa: number;
  aptitude: number;
  communication: number;
  domainKnowledge: number;
  resumeQuality: number;
  mockInterviewScore: number;
}

export interface WeeklyProgressPoint {
  week: string;
  probability: number;
  dsa: number;
  aptitude: number;
  mock: number;
}

export interface MonthlyProgressPoint {
  month: string;
  probability: number;
  tasksCompleted: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface OverviewFactor {
  id: string;
  label: string;
  status: "complete" | "warning" | "critical";
  detail: string;
  href: string;
}

export interface QuickActionCard {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  icon: string;
  tone: "violet" | "amber" | "sky" | "emerald";
  aiConfidence: string;
}

export interface StudentInsight {
  id: string;
  insight: string;
  action?: {
    label: string;
    href: string;
  };
  type: "tip" | "warning" | "success";
  timestamp: string;
}

export interface TpcAlert {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  tone: "amber" | "rose" | "violet";
}

export interface CohortComparisonRow {
  skill: string;
  yourScore: number;
  batchAverage: number;
  percentile: number;
}

export interface ActivityBreakdownPoint {
  day: string;
  leetCode: number;
  mockTests: number;
  courses: number;
  profileUpdates: number;
}

export interface SkillTrendPoint {
  label: string;
  score: number;
}

export interface SkillCardData {
  id: keyof SkillScores;
  label: string;
  icon: string;
  currentScore: number;
  trend: number[];
  delta: number;
  batchAverage: number;
  percentile: number;
  diagnosis: string;
  actionLabel: string;
}

export interface ImprovementPlanStep {
  id: string;
  week: string;
  task: string;
  completed: boolean;
}

export interface MockInterviewAttempt {
  id: string;
  date: string;
  type: string;
  score: number;
  feedbackSummary: string;
  strengths: string[];
  improvements: string[];
  scoreBreakdown: Array<{
    label: string;
    value: number;
  }>;
  questionReview: string[];
  aiTips: string[];
}

export interface ActionPlanTask {
  id: string;
  title: string;
  why: string;
  impact: string;
  due: string;
  ctaLabel: string;
  href: string;
  icon: string;
  progress: number;
  total: number;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tone: "violet" | "amber" | "emerald" | "sky" | "yellow" | "slate";
  earned: boolean;
  earnedDate?: string;
  unlockCriteria?: string;
}

export interface NotificationItem {
  id: string;
  type: "tpc" | "ai" | "reminder" | "achievement" | "system";
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  actionLabel?: string;
  href?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  placementProbability: number;
  score: number;
  mockCount: number;
  isCurrentStudent?: boolean;
}

export interface PublicProfileLink {
  id: string;
  platform: string;
  icon: string;
  tone: PublicLinkTone;
  url: string;
  visibility: "public" | "private";
  verified: boolean;
}

export interface ContestRating {
  id: string;
  platform: ContestPlatform;
  rating: number;
  rank?: string;
  percentile?: number;
  contestName?: string;
  date: string;
}

export interface Certificate {
  id: string;
  name: string;
  organization: string;
  issueDate: string;
  expiryDate?: string;
  noExpiry?: boolean;
  credentialId?: string;
  url?: string;
  category: CertificateCategory;
  relevance: "relevant" | "suggested";
}

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  demoUrl?: string;
  githubUrl?: string;
  type: ProjectType;
  startDate: string;
  endDate?: string;
  ongoing?: boolean;
  teamSize: number;
  achievement?: string;
}

export interface ExperienceEntry {
  id: string;
  companyName: string;
  role: string;
  employmentType: EmploymentType;
  startDate: string;
  endDate?: string;
  present?: boolean;
  location: string;
  remote: boolean;
  description: string;
  stipend?: number;
  offerLetterUrl?: string;
  skillsUsed: string[];
}

export interface TechnicalSkill {
  id: string;
  name: string;
  selfRating: number;
  aiRating: number;
}

export interface SoftSkillEntry {
  id: string;
  label: string;
  level: SoftSkillLevel;
}

export interface ProfileSectionMeta {
  id: ProfileSection;
  title: string;
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
}

export interface StudentProfileRecord {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  year: number;
  cgpa: number;
  placementProbability: number;
  riskScore: number;
  cluster: StudentCluster;
  streak: number;
  profileCompletion: number;
  batchYear: string;
  lastUpdated: string;
  weeklyProgress: WeeklyProgressPoint[];
  monthlyProgress: MonthlyProgressPoint[];
  skills: SkillScores;
  batchAvgSkills: SkillScores;
  activityHeatmap: HeatmapDay[];
}

export interface ProfileBuilderFormValues {
  basic: {
    fullName: string;
    rollNumber: string;
    department: Department;
    yearOfStudy: YearOfStudy;
    expectedGraduation: string;
    dateOfBirth: string;
    phoneNumber: string;
    gender: Gender;
    profilePhotoUrl: string;
  };
  academic: {
    cgpa: number;
    tenthPercentage: number;
    twelfthPercentage: number;
    activeBacklogs: number;
    historicalBacklogs: number;
    specialization: string;
    collegeName: string;
    university: string;
  };
  resume: {
    resumeLink: string;
    atsScore: number;
    lastUpdated: string;
    checklist: Array<{
      id: string;
      label: string;
      completed: boolean;
    }>;
  };
  links: PublicProfileLink[];
  contests: ContestRating[];
  certifications: Certificate[];
  projects: Project[];
  experience: ExperienceEntry[];
  skills: {
    technical: TechnicalSkill[];
    soft: SoftSkillEntry[];
  };
  preferences: {
    targetRoles: string[];
    preferredDomains: string[];
    preferredLocations: string[];
    ctcRange: [number, number];
    openToRelocation: boolean;
    noticePeriod: NoticePeriod;
    workModePreference: WorkModePreference;
    aiMatchScore: number;
  };
  additional: {
    fatherName: string;
    motherName: string;
    parentContactNumber: string;
    permanentAddress: string;
    category: CategoryOption;
    differentlyAbled: boolean;
    differentlyAbledDetails?: string;
    passportAvailable: boolean;
    languages: string[];
    hobbies: string[];
  };
}
