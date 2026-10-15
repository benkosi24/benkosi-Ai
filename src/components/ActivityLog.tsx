import React, { useState } from 'react';
import { SavedArtifact } from '../types';
import {
  FileText,
  Mail,
  Calendar,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Inbox,
} from 'lucide-react';

interface ActivityLogProps {
  artifacts: SavedArtifact[];
  onDeleteArtifact: (id: string) => void;
  onClearAll: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  artifacts,
  onDeleteArtifact,
  onClearAll,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'email' | 'meeting' | 'tasks'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState<SavedArtifact | null>(
    artifacts.length > 0 ? artifacts[0] : null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = artifacts.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCopyContent = (item: SavedArtifact) => {
    let textToCopy = '';
    if (item.type === 'email') {
      textToCopy = `Subject: ${item.data.selectedSubject || item.title}\n\n${item.data.body}`;
    } else if (item.type === 'meeting') {
      textToCopy = `# ${item.title}\n\n${item.data.summary}\n\nDecisions:\n${JSON.stringify(
        item.data.decisions,
        null,
        2
      )}`;
    } else {
      textToCopy = `# ${item.title}\n\n${item.data.strategicOverview}`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadJSON = (item: SavedArtifact) => {
    const blob = new Blob([JSON.stringify(item, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.id}_${item.type}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved artifacts..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-md border border-slate-700">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({artifacts.length})
            </button>
            <button
              onClick={() => setFilterType('email')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'email'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Emails
            </button>
            <button
              onClick={() => setFilterType('meeting')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'meeting'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Meetings
            </button>
            <button
              onClick={() => setFilterType('tasks')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'tasks'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Plans
            </button>
          </div>
        </div>

        {artifacts.length > 0 && (
          <button
            onClick={onClearAll}
            className="px-2.5 py-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 rounded flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {artifacts.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Saved Workplace Artifacts</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When you generate executive emails, meeting summaries, or project task plans, click
            "Save" to store them here for instant review and export.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Artifacts List */}
          <div className="lg:col-span-5 space-y-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedArtifact(item)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors text-xs space-y-1.5 ${
                  selectedArtifact?.id === item.id
                    ? 'bg-indigo-950/50 border-indigo-500/70'
                    : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    {item.type === 'email' && <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    {item.type === 'meeting' && (
                      <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {item.type === 'tasks' && (
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold text-white truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] truncate">{item.summary}</p>
              </div>
            ))}
          </div>

          {/* Right Column: Artifact Viewer */}
          <div className="lg:col-span-7">
            {selectedArtifact ? (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                      {selectedArtifact.type} Artifact
                    </span>
                    <h3 className="text-sm font-bold text-white">{selectedArtifact.title}</h3>
                    <p className="text-[11px] text-slate-400">
                      Created: {new Date(selectedArtifact.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyContent(selectedArtifact)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedId === selectedArtifact.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDownloadJSON(selectedArtifact)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>

                    <button
                      onClick={() => {
                        onDeleteArtifact(selectedArtifact.id);
                        setSelectedArtifact(null);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete artifact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Details depending on type */}
                {selectedArtifact.type === 'email' && (
                  <div className="space-y-3">
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div>
                        <strong>Subject: </strong>
                        <span className="text-slate-200">{selectedArtifact.data.selectedSubject}</span>
                      </div>
                      <div>
                        <strong>Recipient: </strong>
                        <span className="text-slate-200">{selectedArtifact.data.recipient}</span>
                      </div>
                      <div>
                        <strong>Tone: </strong>
                        <span className="text-slate-200 capitalize">{selectedArtifact.data.tone}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded border border-slate-800 text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                      {selectedArtifact.data.body}
                    </div>
                  </div>
                )}

                {selectedArtifact.type === 'meeting' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 leading-relaxed text-slate-200">
                      <strong>Executive Summary:</strong>
                      <p className="mt-1">{selectedArtifact.data.summary}</p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-slate-300 block">Action Items:</strong>
                      <div className="space-y-1">
                        {selectedArtifact.data.actionItems.map((act: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-900/60 rounded border border-slate-800 flex justify-between"
                          >
                            <span>{act.task}</span>
                            <span className="font-mono text-slate-400">{act.assignee} ({act.deadline})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedArtifact.type === 'tasks' && (
                  <div className="space-y-3">
                    <p className="p-3 bg-slate-900 rounded border border-slate-800 text-slate-200 leading-relaxed">
                      {selectedArtifact.data.strategicOverview}
                    </p>

                    <div className="space-y-2">
                      <strong className="text-slate-300 block">Milestones:</strong>
                      {selectedArtifact.data.milestones.map((m: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-slate-900/60 rounded border border-slate-800 space-y-1">
                          <div className="flex justify-between font-semibold text-indigo-300">
                            <span>{m.title}</span>
                            <span className="font-mono text-slate-400">{m.timeWindow}</span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{m.objective}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-lg border border-slate-700/60">
                Select an item from the list to preview details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
