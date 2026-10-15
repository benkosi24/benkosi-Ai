import React, { useState, useEffect } from 'react';
import {
  TaskPlanResult,
  Milestone,
  SubTask,
  ActionItem,
  SavedArtifact,
} from '../types';
import { planTasksApi } from '../services/api';
import { TASK_PRESETS } from '../data/presets';
import {
  Calendar,
  CheckSquare,
  Clock,
  Layers,
  Grid,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Bookmark,
  Plus,
  Sliders,
  ChevronDown,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface TaskPlannerProps {
  onSaveArtifact: (artifact: SavedArtifact) => void;
  incomingTasks?: { tasks: ActionItem[]; projectTitle: string } | null;
  onClearIncomingTasks?: () => void;
}

export const TaskPlanner: React.FC<TaskPlannerProps> = ({
  onSaveArtifact,
  incomingTasks,
  onClearIncomingTasks,
}) => {
  const [goal, setGoal] = useState(
    'Achieve formal SOC-2 Type II compliance readiness across cloud infrastructure, access control, and employee security policies within 60 days.'
  );
  const [timeframe, setTimeframe] = useState('60 days');
  const [teamCapacity, setTeamCapacity] = useState(
    '1 Security Officer, 1 Senior DevOps Engineer, 1 Operations Lead'
  );
  const [priorityFocus, setPriorityFocus] = useState('Audit rigor and automated evidence collection');
  const [methodology, setMethodology] = useState('milestones_first');
  const [customConstraints, setCustomConstraints] = useState(
    'Must not disrupt ongoing Q4 engineering roadmap sprints; budget capped at $25,000 for compliance monitoring software.'
  );

  // Advanced Tuning
  const [showTuning, setShowTuning] = useState(false);
  const [temperature, setTemperature] = useState(0.5);
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');

  // Results & Interactive Views
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TaskPlanResult | null>(null);
  const [activeView, setActiveView] = useState<'milestones' | 'eisenhower' | 'timeline' | 'risks'>('milestones');
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // If incoming tasks transferred from Meeting Intelligence, handle automatically
  useEffect(() => {
    if (incomingTasks && incomingTasks.tasks.length > 0) {
      setGoal(`Deliver action items from meeting: "${incomingTasks.projectTitle}"`);
      setTimeframe('Next 14 business days');
      setTeamCapacity(
        Array.from(new Set(incomingTasks.tasks.map((t) => t.assignee))).join(', ') || 'Team'
      );
      setCustomConstraints(
        `Directly operationalize the ${incomingTasks.tasks.length} action items captured in the meeting sync.`
      );
      if (onClearIncomingTasks) onClearIncomingTasks();
    }
  }, [incomingTasks, onClearIncomingTasks]);

  const handleSelectPreset = (presetId: string) => {
    const found = TASK_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setGoal(found.goal);
    setTimeframe(found.timeframe);
    setTeamCapacity(found.teamCapacity);
    setPriorityFocus(found.priorityFocus);
    setMethodology(found.methodology);
    setCustomConstraints(found.customConstraints);
  };

  const handleGeneratePlan = async () => {
    if (!goal.trim()) {
      setError('Please provide a project goal or deliverable.');
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const response = await planTasksApi({
        goal,
        timeframe,
        teamCapacity,
        priorityFocus,
        methodology,
        customConstraints,
        temperature,
        customSystemPrompt: customSystemPrompt.trim() ? customSystemPrompt : undefined,
      });

      setResult(response.data);
      setCompletedTaskIds(new Set());
    } catch (err: any) {
      setError(err.message || 'Failed to create task plan.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Flattened tasks list
  const allTasks: SubTask[] = result
    ? result.milestones.flatMap((m) => m.tasks)
    : [];

  const completedCount = allTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const progressPercent = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  const handleSaveToArtifacts = () => {
    if (!result) return;
    const artifact: SavedArtifact = {
      id: `taskplan_${Date.now()}`,
      type: 'tasks',
      title: result.projectName,
      timestamp: new Date().toISOString(),
      data: {
        ...result,
        completedTaskIds: Array.from(completedTaskIds),
      },
      summary: `${result.milestones.length} milestones · ${allTasks.length} subtasks · ${result.totalEstimatedHours}h estimated`,
    };
    onSaveArtifact(artifact);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    let md = `# Project Plan: ${result.projectName}\n\n`;
    md += `**Strategic Overview:**\n${result.strategicOverview}\n\n`;
    md += `**Total Estimated Hours:** ${result.totalEstimatedHours}h\n\n`;

    result.milestones.forEach((m, idx) => {
      md += `## Milestone ${idx + 1}: ${m.title} (${m.timeWindow})\n`;
      md += `*Objective: ${m.objective}*\n\n`;
      m.tasks.forEach((t) => {
        const check = completedTaskIds.has(t.id) ? '[x]' : '[ ]';
        md += `- ${check} **${t.title}** | ${t.assigneeRole} | Due: ${t.recommendedDeadline} | ${t.estimatedHours}h [${t.priority}]\n`;
      });
      md += '\n';
    });

    md += `## Identified Risks & Mitigations\n`;
    result.risks.forEach((r) => {
      md += `- **${r.risk}** (Impact: ${r.impact}): ${r.mitigation}\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Preset bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Quick-Load Initiatives:</span>
          <div className="flex flex-wrap gap-2">
            {TASK_PRESETS.map((preset) => (
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
          onClick={() => setShowTuning(!showTuning)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
            showTuning
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'text-slate-400 bg-slate-800 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Planning Parameters</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTuning ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showTuning && (
        <div className="p-4 bg-slate-800/90 border border-indigo-500/30 rounded-lg space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div>
              <p className="font-semibold text-white">Project Breakdown Engine Parameters</p>
              <p className="text-slate-400">
                Governs the granularity of Work Breakdown Structure (WBS) subtasks and hour estimations.
              </p>
            </div>
            <span className="font-mono text-indigo-400">Temperature: {temperature}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Temperature (Scoping Strategy)
              </label>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0.2 (Rigid standard tasks)</span>
                <span>0.5 (Balanced agile estimation)</span>
                <span>0.8 (Creative edge-case mapping)</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Custom Planning Prompt Override
              </label>
              <input
                type="text"
                value={customSystemPrompt}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                placeholder="Optional: e.g. Prioritize zero-downtime database migrations and rollbacks..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Project Goal & Parameters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Project Goal & Scope</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Objective / Deliverable
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="State the core deliverable or initiative..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Timeframe / Horizon</label>
                <input
                  type="text"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  placeholder="e.g. 30 days, 2 sprints, Q4"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Methodology</label>
                <select
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="milestones_first">Phased Milestone Delivery</option>
                  <option value="agile">Agile Bi-Weekly Sprints</option>
                  <option value="eisenhower">Eisenhower Priority Matrix</option>
                  <option value="critical_path">Critical Path Method</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Team Capacity & Roles</label>
              <input
                type="text"
                value={teamCapacity}
                onChange={(e) => setTeamCapacity(e.target.value)}
                placeholder="e.g. 1 Tech Lead, 2 Fullstack, 1 Designer"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority Focus</label>
              <input
                type="text"
                value={priorityFocus}
                onChange={(e) => setPriorityFocus(e.target.value)}
                placeholder="e.g. Rapid MVP, High Reliability, Audit Rigor"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Known Constraints & Guardrails
              </label>
              <textarea
                value={customConstraints}
                onChange={(e) => setCustomConstraints(e.target.value)}
                rows={2}
                placeholder="Budget limits, compliance requirements, non-negotiable tools..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Project WBS with Gemini...</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Generate Project Task Plan</span>
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

        {/* Right Column: Interactive Plan Workbench */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !loading && (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Project Plan Generated</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Define your initiative on the left or select the SOC-2 compliance preset to generate
                a full work breakdown structure with Eisenhower quadrant tags, hours, and deadlines.
              </p>
              <button
                onClick={handleGeneratePlan}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
              >
                Plan SOC-2 Initiative Now
              </button>
            </div>
          )}

          {loading && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-sm font-medium text-white">
                  Decomposing objectives into phased milestones and estimating labor hours...
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
              {/* Project Plan Header & Progress Bar */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">{result.projectName}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono tabular-nums text-indigo-400 font-semibold">
                        {result.totalEstimatedHours}h Total Labor
                      </span>
                      <span>·</span>
                      <span>{result.milestones.length} Milestones</span>
                      <span>·</span>
                      <span>{allTasks.length} Subtasks</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportMarkdown}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded flex items-center gap-1 transition-colors"
                    >
                      {copiedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied MD</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Markdown</span>
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
                          <span>Save Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.strategicOverview}
                </p>

                {/* Live Progress Tracker */}
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Task Completion Progress</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {completedCount} / {allTasks.length} tasks ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/60">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* View Switcher Controls */}
              <div className="flex items-center gap-1 p-1 bg-slate-800/80 border border-slate-700/80 rounded-lg overflow-x-auto">
                <button
                  onClick={() => setActiveView('milestones')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    activeView === 'milestones'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Milestones & WBS</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveView('eisenhower')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    activeView === 'eisenhower'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5" />
                    <span>Eisenhower Matrix</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveView('timeline')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    activeView === 'timeline'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Deadline Radar</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveView('risks')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    activeView === 'risks'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Risk Playbook ({result.risks.length})</span>
                  </span>
                </button>
              </div>

              {/* View 1: Milestones & WBS */}
              {activeView === 'milestones' && (
                <div className="space-y-4">
                  {result.milestones.map((m, mIdx) => (
                    <div
                      key={m.id || mIdx}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-400 font-mono">
                              Phase {mIdx + 1}
                            </span>
                            <h3 className="text-xs sm:text-sm font-semibold text-white">{m.title}</h3>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{m.objective}</p>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-mono tabular-nums bg-slate-900 border border-slate-700 text-slate-300 rounded">
                          {m.timeWindow}
                        </span>
                      </div>

                      {/* Subtasks List */}
                      <div className="space-y-2">
                        {m.tasks.map((task) => {
                          const isDone = completedTaskIds.has(task.id);
                          return (
                            <div
                              key={task.id}
                              className={`p-2.5 bg-slate-900/60 border rounded-md text-xs space-y-1.5 transition-colors ${
                                isDone
                                  ? 'border-slate-800 bg-slate-950/40 opacity-60'
                                  : 'border-slate-700/60 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={() => toggleTaskCompletion(task.id)}
                                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer shrink-0"
                                  />
                                  <span
                                    className={`font-medium ${
                                      isDone ? 'line-through text-slate-400' : 'text-slate-100'
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                </label>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                      task.priority === 'P0'
                                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                        : task.priority === 'P1'
                                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                        : 'bg-slate-800 text-slate-300'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pl-6.5">
                                <span>Role: <strong className="text-slate-300 font-normal">{task.assigneeRole}</strong></span>
                                <span>·</span>
                                <span className="font-mono tabular-nums">
                                  Est: <strong className="text-slate-300 font-normal">{task.estimatedHours}h</strong>
                                </span>
                                <span>·</span>
                                <span>
                                  Due: <strong className="text-slate-300 font-normal">{task.recommendedDeadline}</strong>
                                </span>
                                {task.deliverable && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate max-w-xs text-slate-400">
                                      Deliverable: {task.deliverable}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View 2: Eisenhower Matrix */}
              {activeView === 'eisenhower' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Q1: Urgent & Important */}
                  <div className="bg-slate-800/80 border border-rose-500/30 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                        1. Do First (Urgent & Important)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Immediate Impact</span>
                    </div>
                    <div className="space-y-1.5">
                      {allTasks
                        .filter((t) => t.quadrant === 'urgent_important' || t.priority === 'P0')
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-2 bg-slate-900/70 rounded border border-slate-700/60 text-xs flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-200 font-medium truncate">{task.title}</span>
                            <span className="font-mono tabular-nums text-[11px] text-rose-300 shrink-0">
                              {task.recommendedDeadline}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Q2: Not Urgent & Important */}
                  <div className="bg-slate-800/80 border border-indigo-500/30 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        2. Schedule (Strategic Value)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Not Urgent, Important</span>
                    </div>
                    <div className="space-y-1.5">
                      {allTasks
                        .filter(
                          (t) =>
                            t.quadrant === 'not_urgent_important' ||
                            (t.priority === 'P1' && t.quadrant !== 'urgent_important')
                        )
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-2 bg-slate-900/70 rounded border border-slate-700/60 text-xs flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-200 font-medium truncate">{task.title}</span>
                            <span className="font-mono tabular-nums text-[11px] text-indigo-300 shrink-0">
                              {task.estimatedHours}h
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Q3: Urgent & Not Important */}
                  <div className="bg-slate-800/80 border border-amber-500/30 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        3. Delegate (Urgent, Lower Leverage)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Operational tasks</span>
                    </div>
                    <div className="space-y-1.5">
                      {allTasks
                        .filter(
                          (t) =>
                            t.quadrant === 'urgent_not_important' ||
                            (t.priority === 'P2' && t.quadrant !== 'not_urgent_important')
                        )
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-2 bg-slate-900/70 rounded border border-slate-700/60 text-xs flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-200 font-medium truncate">{task.title}</span>
                            <span className="font-mono tabular-nums text-[11px] text-amber-300 shrink-0">
                              {task.assigneeRole}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Q4: Neither */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        4. De-prioritize (Low Value)
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">Eliminate noise</span>
                    </div>
                    <div className="space-y-1.5">
                      {allTasks
                        .filter((t) => t.quadrant === 'neither' || t.priority === 'P3')
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-2 bg-slate-900/70 rounded border border-slate-700/60 text-xs flex items-center justify-between gap-2 text-slate-400"
                          >
                            <span className="truncate">{task.title}</span>
                            <span className="font-mono tabular-nums text-[11px]">Backlog</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* View 3: Deadline Radar Timeline */}
              {activeView === 'timeline' && (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <h3 className="text-xs font-semibold text-white">Chronological Delivery Milestones</h3>
                    <span className="text-[11px] text-slate-400">Sequential execution sequence</span>
                  </div>

                  <div className="space-y-3">
                    {allTasks.map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-start gap-3 p-3 bg-slate-900/60 rounded border border-slate-700/60 text-xs"
                      >
                        <div className="w-16 shrink-0 font-mono text-[11px] text-indigo-400 pt-0.5">
                          {t.recommendedDeadline || `Phase ${idx + 1}`}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-100">{t.title}</span>
                            <span className="font-mono tabular-nums text-[11px] text-slate-400">
                              {t.estimatedHours}h
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>Owner: {t.assigneeRole}</span>
                            <span>·</span>
                            <span>Priority: {t.priority}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 4: Risk Playbook */}
              {activeView === 'risks' && (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <h3 className="text-xs font-semibold text-white">
                      Proactive Project Risks & Mitigations
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Identified via TPM prompt analysis
                    </span>
                  </div>

                  <div className="space-y-3">
                    {result.risks.map((r, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-900/60 rounded border border-slate-700/60 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-rose-300">
                            {idx + 1}. {r.risk}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              r.impact === 'High'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            }`}
                          >
                            Impact: {r.impact}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          <strong className="text-slate-400 font-medium">Mitigation Playbook: </strong>
                          {r.mitigation}
                        </p>
                      </div>
                    ))}
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
