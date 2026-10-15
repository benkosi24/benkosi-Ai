import React, { useState } from 'react';
import {
  MeetingSummaryResult,
  ActionItem,
  SavedArtifact,
} from '../types';
import { summarizeMeetingApi } from '../services/api';
import { MEETING_PRESETS } from '../data/presets';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Bookmark,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Sliders,
  ChevronDown,
  RefreshCw,
  Share2,
} from 'lucide-react';

interface MeetingIntelligenceProps {
  onSaveArtifact: (artifact: SavedArtifact) => void;
  onTransferToPlanner: (tasks: ActionItem[], projectTitle: string) => void;
}

export const MeetingIntelligence: React.FC<MeetingIntelligenceProps> = ({
  onSaveArtifact,
  onTransferToPlanner,
}) => {
  const [meetingTitle, setMeetingTitle] = useState('Q4 Product Release Go/No-Go Alignment');
  const [meetingType, setMeetingType] = useState('leadership');
  const [attendees, setAttendees] = useState(
    'Elena Rostova (VP Product), Tariq Al-Mansoor (Lead Architect), Rachel Green (Director of QA), Devlin Cole (DevOps Lead)'
  );
  const [transcript, setTranscript] = useState(MEETING_PRESETS[0].transcript);

  // Advanced Tuning
  const [showTuning, setShowTuning] = useState(false);
  const [temperature, setTemperature] = useState(0.4);
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');

  // Results & UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MeetingSummaryResult | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'actions' | 'topics' | 'alignment'>('summary');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelectPreset = (presetId: string) => {
    const found = MEETING_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setMeetingTitle(found.title);
    setMeetingType(found.meetingType);
    setAttendees(found.attendees);
    setTranscript(found.transcript);
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) {
      setError('Please provide a meeting transcript or discussion notes.');
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const response = await summarizeMeetingApi({
        transcript,
        meetingTitle,
        meetingType,
        attendees,
        temperature,
        customSystemPrompt: customSystemPrompt.trim() ? customSystemPrompt : undefined,
      });

      setResult(response.data);
      setActionItems(
        response.data.actionItems.map((item) => ({
          ...item,
          status: 'todo',
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to summarize meeting.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'completed' ? 'todo' : 'completed',
            }
          : item
      )
    );
  };

  const handleCopySlackRecap = () => {
    if (!result) return;
    const actionsList = actionItems
      .map((a) => `• *${a.task}* — @${a.assignee} (Due: ${a.deadline}) [${a.priority}]`)
      .join('\n');

    const decisionsList = result.decisions
      .map((d) => `• *${d.decision}*: ${d.impact}`)
      .join('\n');

    const slackFormat = `*📋 ${meetingTitle} — Executive Recap*\n\n*Summary:*\n${result.executiveSummary}\n\n*Key Decisions Finalized:*\n${decisionsList}\n\n*Assigned Action Items:*\n${actionsList}`;

    navigator.clipboard.writeText(slackFormat);
    setCopiedFormat('slack');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleCopyEmailRecap = () => {
    if (!result) return;
    const actionsList = actionItems
      .map((a) => `- ${a.task} [Owner: ${a.assignee} | Due: ${a.deadline} | Priority: ${a.priority}]`)
      .join('\n');

    const decisionsList = result.decisions
      .map((d) => `- Decision: ${d.decision}\n  Impact: ${d.impact}`)
      .join('\n\n');

    const emailFormat = `Team,\n\nHere is the executive summary from today's ${meetingTitle}.\n\nEXECUTIVE SUMMARY:\n${result.executiveSummary}\n\nDECISIONS FINALIZED:\n${decisionsList}\n\nACTION ITEMS & ACCOUNTABILITY:\n${actionsList}\n\nPlease review and ping if any dependencies were missed.`;

    navigator.clipboard.writeText(emailFormat);
    setCopiedFormat('email');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleSaveToArtifacts = () => {
    if (!result) return;
    const artifact: SavedArtifact = {
      id: `meeting_${Date.now()}`,
      type: 'meeting',
      title: meetingTitle,
      timestamp: new Date().toISOString(),
      data: {
        title: meetingTitle,
        type: meetingType,
        attendees,
        summary: result.executiveSummary,
        decisions: result.decisions,
        actionItems,
        keyTopics: result.keyTopics,
        alignment: result.alignmentAnalysis,
      },
      summary: `${actionItems.length} action items · ${result.decisions.length} decisions · Alignment: ${result.alignmentAnalysis.alignmentLevel}`,
    };
    onSaveArtifact(artifact);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Preset bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Quick-Load Transcripts:</span>
          <div className="flex flex-wrap gap-2">
            {MEETING_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-700/70 hover:bg-slate-700 hover:text-white rounded border border-slate-600/50 transition-colors whitespace-nowrap"
              >
                {preset.title.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowTuning(!showTuning)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
            showTuning
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'text-slate-400 bg-slate-800 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Extraction Blueprint & Tuning</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTuning ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showTuning && (
        <div className="p-4 bg-slate-800/90 border border-indigo-500/30 rounded-lg space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div>
              <p className="font-semibold text-white">Zero-Hallucination Extraction Controls</p>
              <p className="text-slate-400">
                Low temperature (0.2 - 0.4) strictly bounds the model to explicit meeting statements.
              </p>
            </div>
            <span className="font-mono text-indigo-400">Temperature: {temperature}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Sampling Temperature
              </label>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0.1 (Strict verbatim fidelity)</span>
                <span>0.4 (Recommended default)</span>
                <span>0.8 (Broader extrapolation)</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Custom Extraction Instruction Override
              </label>
              <input
                type="text"
                value={customSystemPrompt}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                placeholder="Optional: e.g. Focus specifically on security and budget decisions..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Meeting Source Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Meeting Context & Discussion Log</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Title</label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g. Q4 Executive Go/No-Go Review"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Type</label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="leadership">Executive Leadership Sync</option>
                  <option value="sprint_planning">Sprint Planning / Backlog</option>
                  <option value="client_sync">Client / Account Status Review</option>
                  <option value="incident_postmortem">Incident Post-Mortem</option>
                  <option value="1on1">1-on-1 Performance & Strategy</option>
                  <option value="general">General Team Discussion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Attendees / Roles</label>
                <input
                  type="text"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="Elena (VP), Tariq (Lead Architect)..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Raw Transcript or Discussion Notes
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {transcript.split('\n').length} lines
                </span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={12}
                placeholder="Paste verbatim transcript or bullet notes with speaker names..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <button
              onClick={handleSummarize}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Decisions & Actions...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Summarize & Extract Action Items</span>
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

        {/* Right Column: Structured Intelligence Output */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !loading && (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Meeting Analyzed Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Paste your meeting notes on the left or select the pre-loaded Q4 Launch Go/No-Go
                meeting to see automated extraction of decisions, assignees, deadlines, and alignment diagnostics.
              </p>
              <button
                onClick={handleSummarize}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
              >
                Summarize Sample Meeting Now
              </button>
            </div>
          )}

          {loading && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-sm font-medium text-white">
                  Parsing discussion threads and isolating commitments...
                </span>
              </div>
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                <div className="h-16 bg-slate-700/60 rounded w-full"></div>
                <div className="h-28 bg-slate-700/50 rounded w-full"></div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Output Header with Export Controls */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-md border border-slate-700/60">
                  <button
                    onClick={() => setActiveSubTab('summary')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      activeSubTab === 'summary'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Brief & Decisions ({result.decisions.length})
                  </button>
                  <button
                    onClick={() => setActiveSubTab('actions')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      activeSubTab === 'actions'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Action Items ({actionItems.length})
                  </button>
                  <button
                    onClick={() => setActiveSubTab('topics')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      activeSubTab === 'topics'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Topics & Blockers
                  </button>
                  <button
                    onClick={() => setActiveSubTab('alignment')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      activeSubTab === 'alignment'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Alignment Diagnostic
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySlackRecap}
                    className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded flex items-center gap-1 transition-colors"
                  >
                    {copiedFormat === 'slack' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Slack</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Slack Recap</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyEmailRecap}
                    className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded flex items-center gap-1 transition-colors"
                  >
                    {copiedFormat === 'email' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Email</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Email Recap</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveToArtifacts}
                    className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded flex items-center gap-1 transition-colors"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Subtab 1: Executive Brief & Decisions */}
              {activeSubTab === 'summary' && (
                <div className="space-y-4">
                  {/* Executive Brief Box */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-2">
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                      Executive Summary
                    </span>
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                      {result.executiveSummary}
                    </p>
                  </div>

                  {/* Decided Items */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        Formal Decisions Finalized ({result.decisions.length})
                      </span>
                      <span className="text-[11px] text-slate-400">Binding conclusions</span>
                    </div>

                    <div className="space-y-2.5">
                      {result.decisions.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-900/70 border border-slate-700/70 rounded-md text-xs space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-indigo-300">
                              {idx + 1}. {item.decision}
                            </span>
                            {item.champion && (
                              <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                                Champion: {item.champion}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-[11px]">
                            <strong className="text-slate-400 font-medium">Impact: </strong>
                            {item.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Action Items Table */}
              {activeSubTab === 'actions' && (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-white">
                        Assigned Action Items & Deadlines
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Check off completed tasks or push all items into the Task & Project Planner.
                      </p>
                    </div>

                    <button
                      onClick={() => onTransferToPlanner(actionItems, meetingTitle)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Send to Task Planner</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* High-Density Action Table */}
                  <div className="overflow-x-auto border border-slate-700 rounded-md">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700 text-[11px]">
                        <tr>
                          <th className="p-2.5 w-10">Done</th>
                          <th className="p-2.5">Task Description</th>
                          <th className="p-2.5">Assignee</th>
                          <th className="p-2.5">Deadline</th>
                          <th className="p-2.5">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/60">
                        {actionItems.map((item) => {
                          const isDone = item.status === 'completed';
                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-750/50 transition-colors ${
                                isDone ? 'opacity-60 bg-slate-900/30' : ''
                              }`}
                            >
                              <td className="p-2.5">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => toggleTaskStatus(item.id)}
                                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                                />
                              </td>
                              <td className={`p-2.5 font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                {item.task}
                              </td>
                              <td className="p-2.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                {item.assignee}
                              </td>
                              <td className="p-2.5 text-slate-300 font-mono tabular-nums text-[11px] whitespace-nowrap">
                                {item.deadline}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                    item.priority === 'P0'
                                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                      : item.priority === 'P1'
                                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                      : 'bg-slate-700 text-slate-300'
                                  }`}
                                >
                                  {item.priority}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab 3: Topics & Unresolved Blockers */}
              {activeSubTab === 'topics' && (
                <div className="space-y-4">
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-3">
                    <span className="text-xs font-semibold text-white block">
                      Discussion Breakdown & Consensus
                    </span>
                    <div className="space-y-3">
                      {result.keyTopics.map((topic, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-900/60 border border-slate-700/60 rounded-md text-xs space-y-1.5"
                        >
                          <h4 className="font-semibold text-indigo-300">{topic.topic}</h4>
                          <p className="text-slate-300 text-[11px]">{topic.summary}</p>
                          <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                            <strong>Consensus / Outcome: </strong>
                            {topic.consensus}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.unresolvedQuestions.length > 0 && (
                    <div className="bg-slate-800/80 border border-amber-500/30 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Unresolved Questions & Follow-Up Flags</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                        {result.unresolvedQuestions.map((q, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Subtab 4: Alignment & Atmosphere Diagnostic */}
              {activeSubTab === 'alignment' && (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <span className="text-xs font-semibold text-white">
                      Team Sentiment & Consensus Diagnostic
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-700 text-slate-200">
                      Alignment: {result.alignmentAnalysis.alignmentLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-900/60 rounded border border-slate-700/60 space-y-1">
                      <span className="text-slate-400 font-medium">Dominant Atmosphere / Tone:</span>
                      <p className="text-slate-200 font-medium">{result.alignmentAnalysis.toneSentiment}</p>
                    </div>

                    <div className="p-3 bg-slate-900/60 rounded border border-slate-700/60 space-y-1">
                      <span className="text-slate-400 font-medium">Key Friction Points / Debates:</span>
                      <p className="text-slate-200">{result.alignmentAnalysis.keyFrictionPoints}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
