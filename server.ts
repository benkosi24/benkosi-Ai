import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_MODEL = 'gemini-3.8-flash';

// Helper to sanitize PII heuristically on the server side as an extra safety layer
function scanPII(text: string): { redactedText: string; foundPII: string[] } {
  const foundPII: string[] = [];
  let redacted = text;

  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  const emails = text.match(emailRegex);
  if (emails) {
    emails.forEach((email) => {
      foundPII.push(`Email (${email})`);
      redacted = redacted.replace(email, '[REDACTED_EMAIL]');
    });
  }

  // Phone regex
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const phones = text.match(phoneRegex);
  if (phones) {
    phones.forEach((phone) => {
      foundPII.push(`Phone (${phone})`);
      redacted = redacted.replace(phone, '[REDACTED_PHONE]');
    });
  }

  // Credit card regex
  const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  const ccs = text.match(ccRegex);
  if (ccs) {
    ccs.forEach((cc) => {
      foundPII.push('Credit Card Number');
      redacted = redacted.replace(cc, '[REDACTED_CARD]');
    });
  }

  return { redactedText: redacted, foundPII };
}

// -------------------------------------------------------------
// 1. EMAIL GENERATOR ENDPOINT
// -------------------------------------------------------------
app.post('/api/email/generate', async (req: Request, res: Response) => {
  try {
    const {
      intent = 'reply',
      recipient = 'Colleague',
      senderRole = 'Professional',
      tone = 'executive',
      keyPoints = '',
      context = '',
      length = 'standard',
      callToAction = '',
      temperature = 0.7,
      redactPIIBefore = true,
      customSystemPrompt,
    } = req.body;

    let processedContext = context;
    let processedKeyPoints = keyPoints;
    let serverRedactedItems: string[] = [];

    if (redactPIIBefore) {
      const cScan = scanPII(context);
      const kpScan = scanPII(keyPoints);
      processedContext = cScan.redactedText;
      processedKeyPoints = kpScan.redactedText;
      serverRedactedItems = [...cScan.foundPII, ...kpScan.foundPII];
    }

    const systemInstruction = customSystemPrompt || `You are an elite executive communications strategist and senior workplace advisor with mastery in business correspondence.
Your task is to write high-impact, professional workplace emails that achieve clear operational outcomes while maintaining impeccable ethics, relationship capital, and conciseness.

Prompt Engineering Guidelines applied:
1. Role Specification: High-level corporate communicator.
2. Few-Shot Exemplars: Formulate subject lines that drive high open rates and respectful attention without clickbait.
3. Chain of Thought Rationale: Explain the linguistic and structural rationale for why specific phrasings were selected.
4. Ethical AI Guardrails: Strictly avoid passive-aggressive phrasing, unverified assertions, over-promising legal commitments, or exclusionary jargon.

Respond strictly in valid JSON adhering to the specified schema.`;

    const userPrompt = `Generate a workplace email based on the following specifications:
- Intent / Category: ${intent}
- Recipient / Audience: ${recipient}
- Sender Identity: ${senderRole}
- Tone Required: ${tone}
- Length Constraint: ${length} (brief: ~70-120 words; standard: ~120-220 words; comprehensive: ~220-350 words)
- Key Points to Include:
${processedKeyPoints || 'None specified'}
- Prior Context / Thread / Meeting notes:
${processedContext || 'Fresh outbound communication'}
- Desired Call to Action (CTA):
${callToAction || 'Clear confirmation of next steps'}

Please provide:
1. 3 alternative Subject Lines (e.g., Direct, Action-Oriented, Executive Brief)
2. Email Body (fully drafted with salutation, body paragraphs, and professional signoff)
3. Chain-of-thought Strategic Rationale (why this structure and tone was chosen)
4. Ethical & Tone Audit (checking for passive aggression, over-promising, tone appropriateness, and clarity rating)`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: Number(temperature) || 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectLines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Three distinct subject lines for the email',
            },
            body: {
              type: Type.STRING,
              description: 'The complete email body with formatting and salutations',
            },
            strategicRationale: {
              type: Type.STRING,
              description: 'Prompt engineering and communication rationale for the drafted content',
            },
            ethicalAudit: {
              type: Type.OBJECT,
              properties: {
                toneAssessment: { type: Type.STRING },
                passiveAggressiveRisk: { type: Type.STRING },
                overpromiseRisk: { type: Type.STRING },
                clarityScore: { type: Type.NUMBER, description: 'Score between 0 and 100' },
                ethicalNotes: { type: Type.STRING },
              },
              required: ['toneAssessment', 'passiveAggressiveRisk', 'overpromiseRisk', 'clarityScore', 'ethicalNotes'],
            },
          },
          required: ['subjectLines', 'body', 'strategicRationale', 'ethicalAudit'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      data: parsed,
      piiSanitized: serverRedactedItems,
      promptDetails: {
        model: DEFAULT_MODEL,
        temperature,
        systemInstruction,
        appliedRules: ['Zero passive-aggression', 'Outcome-driven CTA', 'Audience-tailored brevity'],
      },
    });
  } catch (error: any) {
    console.error('Email Generation Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate email. Please check configuration.',
    });
  }
});

// -------------------------------------------------------------
// 2. MEETING SUMMARIZER ENDPOINT
// -------------------------------------------------------------
app.post('/api/meeting/summarize', async (req: Request, res: Response) => {
  try {
    const {
      transcript = '',
      meetingTitle = 'Team Alignment Meeting',
      meetingType = 'general',
      attendees = '',
      customSystemPrompt,
      temperature = 0.4,
    } = req.body;

    if (!transcript.trim()) {
      return res.status(400).json({ success: false, error: 'Meeting transcript or notes cannot be empty.' });
    }

    const systemInstruction = customSystemPrompt || `You are an elite Chief of Staff and Corporate Intelligence Director.
Your task is to analyze raw meeting transcripts, meeting notes, or unstructured discussion logs and distill them into an actionable, high-clarity executive brief.

Prompt Engineering Rules:
1. Zero Hallucination: Never fabricate action items, dates, or agreements that were not mentioned or reasonably derived from the text.
2. Attribution Rigor: Attribute tasks to mentioned individuals or roles. If unknown, label as "Unassigned / Needs Owner".
3. Decision Distillation: Distinguish between open debates and finalized decisions.
4. Output Schema: Strict JSON output with executive summary, decisions, prioritized action items (P0-P3), discussion pillars, and team alignment/sentiment diagnosis.`;

    const userPrompt = `Analyze and summarize the following meeting:
- Title: ${meetingTitle}
- Type: ${meetingType}
- Attendees: ${attendees || 'Extracted from transcript'}

TRANSCRIPT / DISCUSSION NOTES:
"""
${transcript}
"""

Extract:
1. Executive Summary (Concise 3-5 sentence brief for C-level or team leads)
2. Decided Items (Decisions finalized during this sync)
3. Action Items (Structured with task, assignee, deadline, priority P0-P3)
4. Key Discussion Topics & Perspectives
5. Unresolved Questions & Blockers
6. Team Alignment & Atmosphere Assessment`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: Number(temperature) || 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            decisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  decision: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  champion: { type: Type.STRING },
                },
                required: ['decision', 'impact'],
              },
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  task: { type: Type.STRING },
                  assignee: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  priority: { type: Type.STRING, description: 'P0 (Urgent/Blocker), P1 (High), P2 (Normal), P3 (Low)' },
                  estimatedHours: { type: Type.NUMBER },
                },
                required: ['id', 'task', 'assignee', 'deadline', 'priority'],
              },
            },
            keyTopics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  consensus: { type: Type.STRING },
                },
                required: ['topic', 'summary', 'consensus'],
              },
            },
            unresolvedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            alignmentAnalysis: {
              type: Type.OBJECT,
              properties: {
                alignmentLevel: { type: Type.STRING, description: 'High, Moderate, Divergent, or Contested' },
                toneSentiment: { type: Type.STRING },
                keyFrictionPoints: { type: Type.STRING },
              },
              required: ['alignmentLevel', 'toneSentiment', 'keyFrictionPoints'],
            },
          },
          required: ['executiveSummary', 'decisions', 'actionItems', 'keyTopics', 'unresolvedQuestions', 'alignmentAnalysis'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      data: parsed,
      promptDetails: {
        model: DEFAULT_MODEL,
        temperature,
        systemInstruction,
      },
    });
  } catch (error: any) {
    console.error('Meeting Summarizer Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to summarize meeting.',
    });
  }
});

// -------------------------------------------------------------
// 3. TASK & PROJECT PLANNER ENDPOINT
// -------------------------------------------------------------
app.post('/api/tasks/plan', async (req: Request, res: Response) => {
  try {
    const {
      goal = '',
      timeframe = '30 days',
      teamCapacity = 'Cross-functional team of 3',
      priorityFocus = 'Balanced speed & quality',
      methodology = 'agile',
      customConstraints = '',
      customSystemPrompt,
      temperature = 0.5,
    } = req.body;

    if (!goal.trim()) {
      return res.status(400).json({ success: false, error: 'Goal or initiative description cannot be empty.' });
    }

    const systemInstruction = customSystemPrompt || `You are a Principal Technical Program Manager and Agile Strategist.
Your goal is to break down complex business and engineering initiatives into realistic, high-efficiency Work Breakdown Structures (WBS) with clear deadlines, milestones, dependencies, and Eisenhower matrix prioritization.

Prompt Engineering Rules:
1. Realistic Scoping: Avoid impossible deadlines or overloaded task buckets. Estimate realistic labor hours.
2. Dependency Mapping: Explicitly show which tasks block subsequent tasks.
3. Eisenhower Quadrant Tagging: Every task must be assigned to one of:
   - 'urgent_important' (Do First - immediate impact & deadline)
   - 'not_urgent_important' (Schedule / Strategic - high long-term value)
   - 'urgent_not_important' (Delegate - administrative or operational noise)
   - 'neither' (Eliminate / De-prioritize)
4. Ethical Feasibility: Do not plan unsustainable overtime; flag risk factors proactively.`;

    const userPrompt = `Build an execution task plan for the following project:
- Objective / Goal: ${goal}
- Target Timeframe: ${timeframe}
- Team Capacity / Roles: ${teamCapacity}
- Priority Focus: ${priorityFocus}
- Methodology: ${methodology}
- Known Constraints or Boundaries: ${customConstraints || 'Standard workplace constraints'}

Deliver a comprehensive plan with:
1. Executive Project Overview
2. Phased Milestones with Dates
3. Actionable Subtasks with Priority (P0-P3), Eisenhower Quadrant, Assigned Role, Estimated Hours, and Dependency
4. Strategic Risks and concrete Mitigation playbooks`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: Number(temperature) || 0.5,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            strategicOverview: { type: Type.STRING },
            totalEstimatedHours: { type: Type.NUMBER },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  timeWindow: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        assigneeRole: { type: Type.STRING },
                        priority: { type: Type.STRING, description: 'P0, P1, P2, P3' },
                        quadrant: {
                          type: Type.STRING,
                          description: 'urgent_important, not_urgent_important, urgent_not_important, neither',
                        },
                        estimatedHours: { type: Type.NUMBER },
                        recommendedDeadline: { type: Type.STRING },
                        dependencies: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        deliverable: { type: Type.STRING },
                      },
                      required: [
                        'id',
                        'title',
                        'assigneeRole',
                        'priority',
                        'quadrant',
                        'estimatedHours',
                        'recommendedDeadline',
                        'deliverable',
                      ],
                    },
                  },
                },
                required: ['id', 'title', 'timeWindow', 'objective', 'tasks'],
              },
            },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING },
                  impact: { type: Type.STRING, description: 'High, Medium, Low' },
                  mitigation: { type: Type.STRING },
                },
                required: ['risk', 'impact', 'mitigation'],
              },
            },
          },
          required: ['projectName', 'strategicOverview', 'totalEstimatedHours', 'milestones', 'risks'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      data: parsed,
      promptDetails: {
        model: DEFAULT_MODEL,
        temperature,
        systemInstruction,
      },
    });
  } catch (error: any) {
    console.error('Task Planning Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate task plan.',
    });
  }
});

// -------------------------------------------------------------
// 4. ETHICAL & RESPONSIBLE AI AUDIT ENDPOINT
// -------------------------------------------------------------
app.post('/api/ethical/audit', async (req: Request, res: Response) => {
  try {
    const { content = '', contextType = 'general' } = req.body;

    if (!content.trim()) {
      return res.status(400).json({ success: false, error: 'Content for audit cannot be empty.' });
    }

    const { foundPII } = scanPII(content);

    const systemInstruction = `You are a Corporate AI Ethics, Compliance & Workplace Civility Officer.
Evaluate text for:
1. PII or confidential data leakage risk
2. Passive-aggressive, dismissive, or exclusionary language
3. Unconscious bias (gendered terms, ageism, cultural assumptions)
4. Unrealistic or legally binding overpromises
5. Hallucination or unverified factual claims
Provide constructive suggestions for rewrites.`;

    const userPrompt = `Audit the following workplace text (${contextType}):
"""
${content}
"""`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallVerdict: { type: Type.STRING, description: 'Approved, Needs Minor Polish, or High Risk' },
            civilityScore: { type: Type.NUMBER, description: '0 to 100' },
            detectedIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: 'Tone, Bias, Compliance, PII, or Clarity' },
                  excerpt: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  recommendedFix: { type: Type.STRING },
                },
                required: ['category', 'excerpt', 'explanation', 'recommendedFix'],
              },
            },
            improvedAlternative: { type: Type.STRING },
            ethicalChecklist: {
              type: Type.OBJECT,
              properties: {
                freeOfPII: { type: Type.BOOLEAN },
                respectfulTone: { type: Type.BOOLEAN },
                transparentIntent: { type: Type.BOOLEAN },
                legallyPrudent: { type: Type.BOOLEAN },
              },
              required: ['freeOfPII', 'respectfulTone', 'transparentIntent', 'legallyPrudent'],
            },
          },
          required: ['overallVerdict', 'civilityScore', 'detectedIssues', 'improvedAlternative', 'ethicalChecklist'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      data: parsed,
      heuristicallyDetectedPII: foundPII,
    });
  } catch (error: any) {
    console.error('Audit Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Audit failed.',
    });
  }
});

// -------------------------------------------------------------
// 5. QUICK REWRITE & REFINE ENDPOINT
// -------------------------------------------------------------
app.post('/api/refine', async (req: Request, res: Response) => {
  try {
    const { text = '', action = 'executive_concise' } = req.body;

    if (!text.trim()) {
      return res.status(400).json({ success: false, error: 'Text cannot be empty.' });
    }

    let instructionModifier = '';
    switch (action) {
      case 'executive_concise':
        instructionModifier = 'Transform this into an ultra-concise executive format. Bottom-line first, reduce words by ~40-50%, clear bullet points, zero fluff.';
        break;
      case 'more_diplomatic':
        instructionModifier = 'Rephrase with utmost diplomatic tact and relationship-building grace. Soften any sharp or blunt directives while preserving firm business boundaries.';
        break;
      case 'more_assertive':
        instructionModifier = 'Strengthen the tone with crisp assertiveness and unambiguous accountability. Eliminate tentative words ("maybe", "just", "sorry to bother"). Make deadlines and asks unequivocal.';
        break;
      case 'action_oriented':
        instructionModifier = 'Restructure around clear action items with owners and next steps clearly delineated at the top.';
        break;
      default:
        instructionModifier = 'Improve clarity, readability, and professional elegance.';
    }

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Perform the following rewrite on this text:
Goal: ${instructionModifier}

ORIGINAL TEXT:
"""
${text}
"""

Return only the rewritten text directly without conversational prefixes.`,
      config: {
        temperature: 0.5,
      },
    });

    return res.json({
      success: true,
      rewrittenText: response.text?.trim() || text,
    });
  } catch (error: any) {
    console.error('Refine Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Refinement failed.',
    });
  }
});

// Mount Vite or static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexusWork AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
