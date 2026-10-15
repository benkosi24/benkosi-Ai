import React, { useState } from 'react';
import {
  EmailIntent,
  EmailTone,
  EmailLength,
  EmailGenerationResult,
  SavedArtifact,
} from '../types';
import { generateEmailApi, refineTextApi } from '../services/api';
import { EMAIL_PRESETS } from '../data/presets';
import {
  Mail,
  Send,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Bookmark,
  ChevronDown,
  Info,
} from 'lucide-react';

interface EmailGeneratorProps {
  onSaveArtifact: (artifact: SavedArtifact) => void;
  onAuditText: (text: string) => void;
}

export const EmailGenerator: React.FC<EmailGeneratorProps> = ({
  onSaveArtifact,
  onAuditText,
}) => {
  // Form State
  const [intent, setIntent] = useState<EmailIntent>('escalation');
  const [recipient, setRecipient] = useState(
    'Marcus Vance, Enterprise Account Director at Acme Corp'
  );
  const [senderRole, setSenderRole] = useState('Senior Solutions Architect');
  const [tone, setTone] = useState<EmailTone>('diplomatic');
  const [length, setLength] = useState<EmailLength>('standard');
  const [keyPoints, setKeyPoints] = useState(
    `- Security penetration audit surfaced 2 critical token validation vulnerabilities that must be patched before production.
- Core milestone delivery pushed back by 7 business days from Nov 3rd to Nov 12th.
- Zero extra billing charges will be incurred by Acme Corp for the remediation engineering.
- QA team will provide daily sandbox verification logs starting Monday morning.`
  );
  const [context, setContext] = useState(
    `Acme Corp enterprise rollout was scheduled for live release on Nov 3rd. Yesterday's third-party pentest flagged CVE-style authentication replay weaknesses in the OAuth callback flow. Launching without fixing introduces compliance risk under SOC-2. We need to reset expectations without losing account trust.`
  );
  const [callToAction, setCallToAction] = useState(
    'Approval of the revised Phase 2 deployment date of Nov 12th by Thursday 5 PM'
  );

  // Advanced Prompt Controls
  const [showPromptControls, setShowPromptControls] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [redactPII, setRedactPII] = useState(true);
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');

  // Execution State
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmailGenerationResult | null>(null);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [editableBody, setEditableBody] = useState('');
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [sanitizedNotice, setSanitizedNotice] = useState<string[]>([]);

  // Apply Preset
  const handleSelectPreset = (presetId: string) => {
    const found = EMAIL_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setIntent(found.intent as EmailIntent);
    setRecipient(found.recipient);
    setSenderRole(found.senderRole);
    setTone(found.tone as EmailTone);
    setLength(found.length as EmailLength);
    setKeyPoints(found.keyPoints);
    setContext(found.context);
    setCallToAction(found.callToAction);
  };

  // Generate Email
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const response = await generateEmailApi({
        intent,
        recipient,
        senderRole,
        tone,
        length,
        keyPoints,
        context,
        callToAction,
        temperature,
        redactPIIBefore: redactPII,
        customSystemPrompt: customSystemPrompt.trim() ? customSystemPrompt : undefined,
      });

      setResult(response.data);
      setEditableBody(response.data.body);
      setSelectedSubjectIndex(0);
      setSanitizedNotice(response.piiSanitized);
    } catch (err: any) {
      setError(err.message || 'Error occurred while generating email.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Refine Handler
  const handleRefine = async (
    action: 'executive_concise' | 'more_diplomatic' | 'more_assertive' | 'action_oriented'
  ) => {
    if (!editableBody) return;
    setRefining(true);
    try {
      const rewritten = await refineTextApi(editableBody, action);
      setEditableBody(rewritten);
    } catch (err: any) {
      setError(err.message || 'Refinement failed.');
    } finally {
      setRefining(false);
    }
  };

  const handleCopyBody = () => {
    const fullText = `Subject: ${result?.subjectLines[selectedSubjectIndex] || ''}\n\n${editableBody}`;
    navigator.clipboard.writeText(fullText);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleCopySubject = (subjectText: string, index: number) => {
    navigator.clipboard.writeText(subjectText);
    setSelectedSubjectIndex(index);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleSaveToArtifacts = () => {
    if (!result) return;
    const currentSubject = result.subjectLines[selectedSubjectIndex] || 'Workplace Email';
    const artifact: SavedArtifact = {
      id: `email_${Date.now()}`,
      type: 'email',
      title: currentSubject,
      timestamp: new Date().toISOString(),
      data: {
        subjectLines: result.subjectLines,
        selectedSubject: currentSubject,
        body: editableBody,
        recipient,
        tone,
        intent,
        ethicalAudit: result.ethicalAudit,
      },
      summary: `Email to ${recipient} · Tone: ${tone} · Clarity: ${result.ethicalAudit.clarityScore}/100`,
    };
    onSaveArtifact(artifact);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Preset Quick Loader */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Quick-Load Scenarios:</span>
          <div className="flex flex-wrap gap-2">
            {EMAIL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-700/70 hover:bg-slate-700 hover:text-white rounded border border-slate-600/50 transition-colors whitespace-nowrap"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowPromptControls(!showPromptControls)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
            showPromptControls
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'text-slate-400 bg-slate-800 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Prompt Blueprint & Tuning</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showPromptControls ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Advanced Prompt Blueprint Drawer */}
      {showPromptControls && (
        <div className="p-4 bg-slate-800/90 border border-indigo-500/30 rounded-lg space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div>
              <p className="font-semibold text-white">Prompt Engineering Controls & Model Parameters</p>
              <p className="text-slate-400">
                Inspect and tune how system instructions and sampling temperature govern generation.
              </p>
            </div>
            <span className="font-mono text-indigo-400">Temperature: {temperature}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Model Temperature (Creativity vs Determinism)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0.1 (Strict, Conservative)</span>
                <span>0.5 (Balanced)</span>
                <span>1.0 (Expressive, Varied)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="pii_scrub"
                checked={redactPII}
                onChange={(e) => setRedactPII(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
              />
              <label htmlFor="pii_scrub" className="text-slate-300 cursor-pointer">
                <span className="font-medium text-white block">Client-Side Ethical PII Shield</span>
                <span className="text-slate-400 block text-[11px]">
                  Scrub emails, phone numbers, and financial tokens prior to model submission.
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Custom System Instruction Override (Optional)
            </label>
            <textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder="Leave empty to use the built-in Executive Communications Strategist persona..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Main 2-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Email Specifications</span>
            </h2>

            {/* Intent Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Objective / Intent</label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value as EmailIntent)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="escalation">Escalation / Delay Notification</option>
                <option value="negotiation">Contract & Commercial Negotiation</option>
                <option value="reply">Client / Executive Thread Reply</option>
                <option value="outreach">Cold Business Development Outreach</option>
                <option value="status_update">Weekly Project Milestone Update</option>
                <option value="rejection">Respectful Candidate / Proposal Rejection</option>
                <option value="meeting_followup">Executive Meeting Recap & Next Steps</option>
              </select>
            </div>

            {/* Recipient & Sender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recipient & Title</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. John Doe, VP Marketing"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Sender Persona</label>
                <input
                  type="text"
                  value={senderRole}
                  onChange={(e) => setSenderRole(e.target.value)}
                  placeholder="e.g. Senior Tech Lead"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Tone & Length */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Voice & Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as EmailTone)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="executive">Executive (High-Level, Crisp, Strategic)</option>
                  <option value="diplomatic">Diplomatic (Tactful, Relationship-First)</option>
                  <option value="concise">Concise (Bottom-Line, Zero Fluff)</option>
                  <option value="persuasive">Persuasive (Value-Driven, Compelling)</option>
                  <option value="assertive">Assertive (Firm Boundaries, Unambiguous)</option>
                  <option value="empathetic">Empathetic (Supportive, Human-Centered)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as EmailLength)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="brief">Brief (~70-120 words)</option>
                  <option value="standard">Standard (~120-220 words)</option>
                  <option value="comprehensive">Comprehensive (~220-350 words)</option>
                </select>
              </div>
            </div>

            {/* Key Bullet Points */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Core Information & Facts to Convey
              </label>
              <textarea
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                rows={4}
                placeholder="Bullet points of decisions, numbers, dates, or terms..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Context / Thread */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Background Context / Prior Email Thread
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                placeholder="Paste earlier messages or describe what led to this email..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Desired CTA */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Explicit Call to Action (CTA)
              </label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="e.g. Schedule 15-minute review call by Friday"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Engineering Draft with Gemini 3.8...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate Executive Email</span>
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

        {/* Right Column: Output Workbench */}
        <div className="lg:col-span-7 space-y-4">
          {sanitizedNotice.length > 0 && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-md text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Ethical PII Guardrail Active: Redacted {sanitizedNotice.length} sensitive identifier(s)
                before submission.
              </span>
            </div>
          )}

          {!result && !loading && (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Email Draft Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Configure your recipient, tone, and key points on the left, or pick one of the
                quick-load scenarios above to generate an executive email with AI ethical checks.
              </p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
              >
                Generate Demo Scenario Now
              </button>
            </div>
          )}

          {loading && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-sm font-medium text-white">Synthesizing workplace correspondence...</span>
              </div>
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                <div className="h-20 bg-slate-700/60 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Subject Line Picker */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Select Subject Line Option:</span>
                  <span className="text-[11px] text-slate-400">Click to preview & copy</span>
                </div>
                <div className="space-y-1.5">
                  {result.subjectLines.map((subj, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedSubjectIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer text-xs transition-colors border ${
                        selectedSubjectIndex === idx
                          ? 'bg-indigo-950/60 border-indigo-500/70 text-indigo-200'
                          : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-500 font-mono text-[11px]">#{idx + 1}</span>
                        <span className="font-medium truncate">{subj}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySubject(subj, idx);
                        }}
                        className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center gap-1 shrink-0 ml-2"
                      >
                        {copiedSubject && selectedSubjectIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Body Preview & In-line Editor */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <div className="text-xs text-slate-400">
                    <span>To: <strong className="text-slate-200">{recipient}</strong></span>
                    <span className="mx-2">·</span>
                    <span>Tone: <strong className="text-slate-200 capitalize">{tone}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveToArtifacts}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-700/80 hover:bg-slate-600 rounded flex items-center gap-1 transition-colors"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Save Draft</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCopyBody}
                      className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded flex items-center gap-1.5 transition-colors"
                    >
                      {copiedBody ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied All</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Full Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Textarea for live in-place edits */}
                <textarea
                  value={editableBody}
                  onChange={(e) => setEditableBody(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-md text-xs sm:text-sm text-slate-100 font-sans leading-relaxed focus:outline-none focus:border-indigo-500"
                />

                {/* Quick Refine Toolbar */}
                <div className="pt-2 border-t border-slate-700/60">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>One-Click Refine:</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleRefine('executive_concise')}
                        disabled={refining}
                        className="px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded transition-colors disabled:opacity-50"
                      >
                        Executive Concise (-40%)
                      </button>
                      <button
                        onClick={() => handleRefine('more_diplomatic')}
                        disabled={refining}
                        className="px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded transition-colors disabled:opacity-50"
                      >
                        Diplomatic Polish
                      </button>
                      <button
                        onClick={() => handleRefine('more_assertive')}
                        disabled={refining}
                        className="px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded transition-colors disabled:opacity-50"
                      >
                        Firm & Assertive
                      </button>
                      <button
                        onClick={() => handleRefine('action_oriented')}
                        disabled={refining}
                        className="px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded transition-colors disabled:opacity-50"
                      >
                        Action Bullet Structure
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategic Rationale & Ethical Audit Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strategic Rationale */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Prompt Engineering Rationale</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {result.strategicRationale}
                  </p>
                </div>

                {/* Responsible & Ethical AI Check */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Ethical & Civility Audit</span>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-emerald-400">
                      {result.ethicalAudit.clarityScore}/100 Clarity
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Tone Classification:</span>
                      <span className="text-slate-200">{result.ethicalAudit.toneAssessment}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Passive-Aggressive Risk:</span>
                      <span className="text-emerald-400">{result.ethicalAudit.passiveAggressiveRisk}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Legal / Overpromise Risk:</span>
                      <span className="text-emerald-400">{result.ethicalAudit.overpromiseRisk}</span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-700/60 italic">
                    "{result.ethicalAudit.ethicalNotes}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
