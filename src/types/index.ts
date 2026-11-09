export type MetricLevel = 1 | 2 | 3 | 4 | 5;

export interface MetricAssessment {
  level: MetricLevel;
  evidence: string;
  reason: string;
  confidence: number;
  paragraph_id?: string;
}

export interface CandidateMetrics {
  m1: MetricAssessment;
  m2: MetricAssessment;
  m3: MetricAssessment;
  m4: MetricAssessment;
  m5: MetricAssessment;
}

export interface StudentExperience {
  id: string;
  period: string;
  org: string;
  role: string;
  description: string;
}

/** 整页学生档案（对齐高中档案信息项，可由管理员维护） */
export interface StudentProfile {
  photoUrl?: string;
  ethnicity: string;
  birthDate: string;
  politicalStatus: string;
  nativePlace: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  graduationSchool: string;
  health: string;
  hobbies: string;
  specialties: string;
  emergencyContact: string;
  experiences: StudentExperience[];
  awards: string[];
  selfEvaluation: string;
  /** 班主任评语 */
  teacherComment: string;
  headTeacher: string;
  counselorComment: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Candidate {
  id: string;
  student_id?: string;
  name: string;
  gender: string;
  major: string;
  position_id: string;
  position_name: string;
  qualified: boolean;
  qualification_issue: string | null;
  status: 'completed' | 'pending_review' | 'parsing' | 'evaluating' | 'failed';
  review_reason: string | null;
  interview_score: number;
  interview_notes: string;
  original_text: Record<string, string>;
  metrics: CandidateMetrics;
  material_score: number;
  composite_score: number;
  rank?: number | string;
  /** 整页档案信息（缺失时按学号生成种子档案） */
  profile?: StudentProfile;
}

export interface PositionWeights {
  m1: number;
  m2: number;
  m3: number;
  m4: number;
  m5: number;
}

export interface Position {
  id: string;
  name: string;
  category: string;
  department: string;
  alpha: number;
  description: string;
  weights: PositionWeights;
  target_quota: number;
  applicant_count: number;
  /** 与「模拟面试 → 目标职务」一一对应的职务标识，两处选项共用同一数据源 */
  interviewTargetId?: string;
  /** 所属职务范围编号（01 竞赛小组 / 02 社团招新） */
  trackCode?: string;
  /** 所属职务范围名称，用于下拉分组 */
  trackLabel?: string;
  /** 职务简称，用于题干与紧凑展示 */
  short?: string;
}

export interface MetricRubricItem {
  level: MetricLevel;
  point: string;
  example: string;
}

export interface MetricConfig {
  id: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  name: string;
  scope: string;
  rubric: MetricRubricItem[];
}

export interface ResourceItem {
  id: string;
  title: string;
  type: string;
  provider: string;
  timeframe: string;
  targetMetric: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  action: string;
  benefit: string;
}

export interface TestCase {
  id: string;
  name: string;
  desc: string;
  expected: string;
  status: 'pass' | 'fail' | 'pending';
  category: string;
  metric?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  targetStudentId: string;
  targetStudentName: string;
  metricId: string;
  oldLevel: number;
  newLevel: number;
  reason: string;
  verified: boolean;
}

export type SubAgentRole = 
  | 'parser' 
  | 'civic_ethics' 
  | 'academic' 
  | 'leadership' 
  | 'competency' 
  | 'integrity' 
  | 'arbitrator' 
  | 'growth_planner';

export interface SubAgentStatus {
  id: SubAgentRole;
  name: string;
  avatar: string;
  specialty: string;
  status: 'idle' | 'running' | 'completed' | 'alert';
  currentTask?: string;
  progress: number;
  log: string[];
}

export interface TaskItem {
  id: string;
  studentId: string;
  name: string;
  fileHash: string;
  fileName: string;
  fileSize: string;
  positionId: string;
  status: 'queued' | 'parsing' | 'evaluating' | 'completed' | 'pending_review' | 'failed';
  durationSeconds: number;
  submittedAt: string;
  reviewReason?: string;
}
