import React, { useState } from 'react';
import { EthicalAuditResult } from '../types';
import { auditEthicalApi } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Code2,
  Cpu,
  BookOpen,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';

const ETHICAL_AUDIT_PRESETS = [
  {
    name: 'Passive-Aggressive Colleague Reply',
    type: 'Email Reply',
    text: `As I stated multiple times in my previous email, the reports were due on Monday. I'm not sure why this was so confusing for your team, but going forward please actually read the instructions before asking questions that have already been answered. If this delays the client launch, that's completely on your side.`,
  },
  {
    name: 'Accidental PII & Sensitive Credential Leak',
    type: 'Internal Memo',
    text: `Please send the AWS production database access token to dev-ops@acme-corp.com or call Marcus directly at +1 (415) 555-0199. For billing verification, the corporate card on file ending in 4111-2222-3333-4444 should be charged for the new Redis cache cluster.`,
  },
  {
    name: 'Legally Risky Over-Promising Commitment',
    type: 'Client Agreement',
    text: `We 100% guarantee that this infrastructure will never go down under any circumstance, and we promise zero data loss even in the event of multi-region cloud failure. We will compensate your company for any lost revenue without limitation.`,
  },
];

export const PromptLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'auditor' | 'frameworks'>('auditor');
  const [auditText, setAuditText] = useState(ETHICAL_AUDIT_PRESETS[0].text);
  const [contextType, setContextType] = useState('Email draft');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<EthicalAuditResult | null>(null);
  const [detectedPII, setDetectedPII] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleRunAudit = async () => {
    if (!auditText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await auditEthicalApi(auditText, contextType);
      setAuditResult(response.data);
      setDetectedPII(response.heuristicallyDetectedPII);
    } catch (err: any) {
      setError(err.message || 'Audit failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (presetText: string, type: string) => {
    setAuditText(presetText);
    setContextType(type);
  };

  const handleCopyImproved = () => {
    if (!auditResult) return;
    navigator.clipboard.writeText(auditResult.improvedAlternative);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Responsible AI & Prompt Engineering */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Prompt Engineering Lab & Responsible AI Officer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrating structured output schemas, chain-of-thought rationale, PII redaction, and civility guardrails.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-md border border-slate-700">
          <button
            onClick={() => setActiveTab('auditor')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'auditor'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Civility & Ethics Auditor
          </button>
          <button
            onClick={() => setActiveTab('frameworks')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'frameworks'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prompt Engineering Playbook
          </button>
        </div>
      </div>

      {activeTab === 'auditor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input for Audit */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Select Test Scenario:</span>
              </div>

              <div className="space-y-2">
                {ETHICAL_AUDIT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(p.text, p.type)}
                    className="w-full text-left p-2.5 bg-slate-900/60 hover:bg-slate-700/40 border border-slate-700/60 rounded text-xs transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.type}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Text to Audit (Email, Slack, or Document)
                </label>
                <textarea
                  value={auditText}
                  onChange={(e) => setAuditText(e.target.value)}
                  rows={8}
                  placeholder="Paste any workplace text to inspect for passive aggression, PII, and bias..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />
              </div>

              <button
                onClick={handleRunAudit}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Tone, PII & Compliance...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Run Responsible AI Audit</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-md text-xs text-red-200">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Audit Results */}
          <div className="lg:col-span-7 space-y-4">
            {detectedPII.length > 0 && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs space-y-1 text-rose-200">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Confidential PII Detected ({detectedPII.length} tokens):</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-rose-300">
                  {detectedPII.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {!auditResult && !loading && (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-10 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">Ready for Ethics & Civility Scan</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click the button on the left to evaluate the text for passive-aggressive tone,
                  overpromising commitments, and unconscious bias.
                </p>
                <button
                  onClick={handleRunAudit}
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
                >
                  Audit Sample Message
                </button>
              </div>
            )}

            {loading && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-sm font-medium text-white">
                    Evaluating communication safety, psychological safety, and compliance...
                  </span>
                </div>
                <div className="space-y-3 animate-pulse">
                  <div className="h-6 bg-slate-700 rounded w-1/4"></div>
                  <div className="h-16 bg-slate-700/60 rounded w-full"></div>
                  <div className="h-24 bg-slate-700/50 rounded w-full"></div>
                </div>
              </div>
            )}

            {auditResult && !loading && (
              <div className="space-y-4">
                {/* Score & Verdict Card */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Overall Safety Verdict</span>
                    <h3
                      className={`text-sm font-bold ${
                        auditResult.overallVerdict === 'Approved'
                          ? 'text-emerald-400'
                          : auditResult.overallVerdict === 'Needs Minor Polish'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {auditResult.overallVerdict}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Civility & Prudence Score</span>
                    <span className="font-mono tabular-nums text-lg font-bold text-white">
                      {auditResult.civilityScore} / 100
                    </span>
                  </div>
                </div>

                {/* Ethical Checklist */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    {auditResult.ethicalChecklist.freeOfPII ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span>PII Cleared</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    {auditResult.ethicalChecklist.respectfulTone ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span>Respectful Tone</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    {auditResult.ethicalChecklist.transparentIntent ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span>Clear Intent</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    {auditResult.ethicalChecklist.legallyPrudent ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span>Legally Prudent</span>
                  </div>
                </div>

                {/* Detected Issues */}
                {auditResult.detectedIssues.length > 0 && (
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-3">
                    <span className="text-xs font-semibold text-white block">
                      Specific Issues Flagged ({auditResult.detectedIssues.length})
                    </span>

                    <div className="space-y-2.5">
                      {auditResult.detectedIssues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-900/70 border border-slate-700/70 rounded-md text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-300">
                              Category: {issue.category}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-950/80 rounded font-mono text-[11px] text-rose-300 italic border border-slate-800">
                            "{issue.excerpt}"
                          </div>
                          <p className="text-slate-300 text-[11px]">{issue.explanation}</p>
                          <p className="text-emerald-300 text-[11px]">
                            <strong>Suggested Adjustment: </strong>
                            {issue.recommendedFix}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Responsible & Ethical Rewrite */}
                <div className="bg-slate-800/80 border border-emerald-500/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Responsible & Civility-Compliant Rewrite
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Preserves original business objective while eliminating friction
                      </span>
                    </div>

                    <button
                      onClick={handleCopyImproved}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded flex items-center gap-1 transition-colors"
                    >
                      {copiedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Rewrite</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-md border border-slate-700/80 text-xs sm:text-sm text-slate-100 font-sans leading-relaxed whitespace-pre-wrap">
                    {auditResult.improvedAlternative}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Prompt Engineering Playbook */}
      {activeTab === 'frameworks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>1. Strict Output Schema Enforcement</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In business automation, models must never emit conversational chatter ("Here is your email!").
              Using Gemini's <code className="text-indigo-300 font-mono">responseSchema</code> with TypeScript
              types guarantees 100% reliable, parseable JSON data with guaranteed fields.
            </p>
            <div className="p-3 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto">
              {`// Schema guarantees decisions, actionItems, and alignment
config: {
  responseMimeType: "application/json",
  responseSchema: { type: Type.OBJECT, properties: { ... } }
}`}
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>2. Chain-of-Thought (CoT) Strategic Rationale</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              By requiring the model to generate a <code className="text-indigo-300 font-mono">strategicRationale</code>
              field alongside the draft, the model's latent attention aligns around conflict mitigation,
              audience incentives, and executive clarity before outputting final sentences.
            </p>
            <div className="p-3 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto">
              {`"Explain the communicative reason why specific framing,
tone, and call-to-action were chosen."`}
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>3. Zero-Hallucination & Factual Grounding</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When parsing transcripts or meetings, hallucinated commitments damage business trust.
              We calibrate sampling temperature to 0.2–0.4 and insert explicit negative constraints:
              "Never invent dates or tasks that were not stated or logically necessitated by discussion."
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>4. Ethical Guardrails & PII Sanitization</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Responsible AI requires proactive data hygiene. Regex heuristics scrub emails, phone
              numbers, and credit card patterns before sending to server models, while model-side civility
              audits flag micro-aggressions, sarcasm, and unrealistic legal overpromising.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
