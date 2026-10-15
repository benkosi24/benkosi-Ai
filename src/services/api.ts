import {
  EmailGenerationResult,
  MeetingSummaryResult,
  TaskPlanResult,
  EthicalAuditResult,
} from '../types';

export interface EmailParams {
  intent: string;
  recipient: string;
  senderRole: string;
  tone: string;
  keyPoints: string;
  context: string;
  length: string;
  callToAction: string;
  temperature?: number;
  redactPIIBefore?: boolean;
  customSystemPrompt?: string;
}

export interface MeetingParams {
  transcript: string;
  meetingTitle: string;
  meetingType: string;
  attendees: string;
  temperature?: number;
  customSystemPrompt?: string;
}

export interface TaskPlanParams {
  goal: string;
  timeframe: string;
  teamCapacity: string;
  priorityFocus: string;
  methodology: string;
  customConstraints?: string;
  temperature?: number;
  customSystemPrompt?: string;
}

export async function generateEmailApi(params: EmailParams): Promise<{
  data: EmailGenerationResult;
  piiSanitized: string[];
  promptDetails: any;
}> {
  const res = await fetch('/api/email/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to generate email.');
  }
  return {
    data: json.data,
    piiSanitized: json.piiSanitized || [],
    promptDetails: json.promptDetails,
  };
}

export async function summarizeMeetingApi(params: MeetingParams): Promise<{
  data: MeetingSummaryResult;
  promptDetails: any;
}> {
  const res = await fetch('/api/meeting/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to summarize meeting.');
  }
  return {
    data: json.data,
    promptDetails: json.promptDetails,
  };
}

export async function planTasksApi(params: TaskPlanParams): Promise<{
  data: TaskPlanResult;
  promptDetails: any;
}> {
  const res = await fetch('/api/tasks/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to plan tasks.');
  }
  return {
    data: json.data,
    promptDetails: json.promptDetails,
  };
}

export async function auditEthicalApi(
  content: string,
  contextType: string = 'general'
): Promise<{
  data: EthicalAuditResult;
  heuristicallyDetectedPII: string[];
}> {
  const res = await fetch('/api/ethical/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, contextType }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to audit text.');
  }
  return {
    data: json.data,
    heuristicallyDetectedPII: json.heuristicallyDetectedPII || [],
  };
}

export async function refineTextApi(
  text: string,
  action: 'executive_concise' | 'more_diplomatic' | 'more_assertive' | 'action_oriented'
): Promise<string> {
  const res = await fetch('/api/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, action }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to refine text.');
  }
  return json.rewrittenText;
}
