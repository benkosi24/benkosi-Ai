export type ActiveTab = 'email' | 'meeting' | 'tasks' | 'prompt_lab' | 'history';

export type EmailIntent =
  | 'reply'
  | 'outreach'
  | 'escalation'
  | 'status_update'
  | 'rejection'
  | 'negotiation'
  | 'meeting_followup';

export type EmailTone =
  | 'executive'
  | 'concise'
  | 'diplomatic'
  | 'persuasive'
  | 'assertive'
  | 'empathetic';

export type EmailLength = 'brief' | 'standard' | 'comprehensive';

export interface EmailGenerationResult {
  subjectLines: string[];
  body: string;
  strategicRationale: string;
  ethicalAudit: {
    toneAssessment: string;
    passiveAggressiveRisk: string;
    overpromiseRisk: string;
    clarityScore: number;
    ethicalNotes: string;
  };
}

export interface MeetingDecision {
  decision: string;
  impact: string;
  champion?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  estimatedHours?: number;
  status?: 'todo' | 'in_progress' | 'completed';
}

export interface DiscussionTopic {
  topic: string;
  summary: string;
  consensus: string;
}

export interface AlignmentAnalysis {
  alignmentLevel: string;
  toneSentiment: string;
  keyFrictionPoints: string;
}

export interface MeetingSummaryResult {
  executiveSummary: string;
  decisions: MeetingDecision[];
  actionItems: ActionItem[];
  keyTopics: DiscussionTopic[];
  unresolvedQuestions: string[];
  alignmentAnalysis: AlignmentAnalysis;
}

export interface SubTask {
  id: string;
  title: string;
  assigneeRole: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  quadrant: 'urgent_important' | 'not_urgent_important' | 'urgent_not_important' | 'neither';
  estimatedHours: number;
  recommendedDeadline: string;
  dependencies: string[];
  deliverable: string;
  completed?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  timeWindow: string;
  objective: string;
  tasks: SubTask[];
}

export interface ProjectRisk {
  risk: string;
  impact: string;
  mitigation: string;
}

export interface TaskPlanResult {
  projectName: string;
  strategicOverview: string;
  totalEstimatedHours: number;
  milestones: Milestone[];
  risks: ProjectRisk[];
}

export interface EthicalAuditResult {
  overallVerdict: string;
  civilityScore: number;
  detectedIssues: Array<{
    category: string;
    excerpt: string;
    explanation: string;
    recommendedFix: string;
  }>;
  improvedAlternative: string;
  ethicalChecklist: {
    freeOfPII: boolean;
    respectfulTone: boolean;
    transparentIntent: boolean;
    legallyPrudent: boolean;
  };
}

export interface SavedArtifact {
  id: string;
  type: 'email' | 'meeting' | 'tasks';
  title: string;
  timestamp: string;
  data: any;
  summary: string;
}
