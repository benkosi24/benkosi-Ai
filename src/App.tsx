import React, { useState, useEffect } from 'react';
import { ActiveTab, SavedArtifact, ActionItem } from './types';
import { TopBar } from './components/TopBar';
import { EmailGenerator } from './components/EmailGenerator';
import { MeetingIntelligence } from './components/MeetingIntelligence';
import { TaskPlanner } from './components/TaskPlanner';
import { PromptLab } from './components/PromptLab';
import { ActivityLog } from './components/ActivityLog';
import { ShieldCheck, Sparkles, Terminal, HeartHandshake } from 'lucide-react';

const STORAGE_KEY = 'nexuswork_saved_artifacts_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('email');
  const [savedArtifacts, setSavedArtifacts] = useState<SavedArtifact[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // State for passing action items from Meeting Intelligence into Task Planner
  const [transferredMeetingTasks, setTransferredMeetingTasks] = useState<{
    tasks: ActionItem[];
    projectTitle: string;
  } | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedArtifacts));
    } catch (e) {
      console.warn('Failed to save to local storage', e);
    }
  }, [savedArtifacts]);

  const handleSaveArtifact = (artifact: SavedArtifact) => {
    setSavedArtifacts((prev) => [artifact, ...prev]);
  };

  const handleDeleteArtifact = (id: string) => {
    setSavedArtifacts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearAllArtifacts = () => {
    if (window.confirm('Are you sure you want to clear your saved activity log?')) {
      setSavedArtifacts([]);
    }
  };

  const handleTransferToPlanner = (tasks: ActionItem[], projectTitle: string) => {
    setTransferredMeetingTasks({ tasks, projectTitle });
    setActiveTab('tasks');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Contract */}
      <TopBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        savedCount={savedArtifacts.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Module Content */}
        {activeTab === 'email' && (
          <EmailGenerator
            onSaveArtifact={handleSaveArtifact}
            onAuditText={() => setActiveTab('prompt_lab')}
          />
        )}

        {activeTab === 'meeting' && (
          <MeetingIntelligence
            onSaveArtifact={handleSaveArtifact}
            onTransferToPlanner={handleTransferToPlanner}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskPlanner
            onSaveArtifact={handleSaveArtifact}
            incomingTasks={transferredMeetingTasks}
            onClearIncomingTasks={() => setTransferredMeetingTasks(null)}
          />
        )}

        {activeTab === 'prompt_lab' && <PromptLab />}

        {activeTab === 'history' && (
          <ActivityLog
            artifacts={savedArtifacts}
            onDeleteArtifact={handleDeleteArtifact}
            onClearAll={handleClearAllArtifacts}
          />
        )}
      </main>

      {/* Quiet, Professional Executive Footer (Anti-Slop Restraint) */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">NexusWork AI Assistant</span>
            <span aria-hidden="true">·</span>
            <span>Powered by Gemini 3.8 Flash</span>
            <span aria-hidden="true">·</span>
            <span>Human-in-the-Loop Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Client-Side PII Scrubbing Active</span>
            </span>
            <span className="text-slate-600">|</span>
            <span>Ethical Workplace Automation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
