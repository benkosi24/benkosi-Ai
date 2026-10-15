import React from 'react';
import { ActiveTab } from '../types';
import { ShieldCheck, Sparkles, Plus } from 'lucide-react';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickAction?: () => void;
  savedCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onQuickAction,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('email')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors whitespace-nowrap">
                NexusWork AI
              </span>
            </button>
            <span className="text-xs text-slate-500 hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Gemini 3.8 Flash
            </span>
          </div>

          {/* Zone 2: 4-5 clean single-line text navigation links */}
          <nav className="flex items-center gap-1 sm:gap-2 md:gap-6 overflow-x-auto py-2 scrollbar-none">
            <button
              onClick={() => onTabChange('email')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'email'
                  ? 'text-white bg-slate-800 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Email Engine
            </button>

            <button
              onClick={() => onTabChange('meeting')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'meeting'
                  ? 'text-white bg-slate-800 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Meeting Intelligence
            </button>

            <button
              onClick={() => onTabChange('tasks')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'tasks'
                  ? 'text-white bg-slate-800 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Task Planner
            </button>

            <button
              onClick={() => onTabChange('prompt_lab')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'prompt_lab'
                  ? 'text-white bg-slate-800 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Prompt Lab & Ethics
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'history'
                  ? 'text-white bg-slate-800 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Activity Log {savedCount > 0 && <span className="font-mono tabular-nums text-xs ml-1 text-indigo-400">({savedCount})</span>}
            </button>
          </nav>

          {/* Zone 3: 1 primary action with profile avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('prompt_lab')}
              title="Audit text for ethical risks and PII"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-md transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ethical Shield</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src="/src/assets/images/avatar_workplace_exec_1792063938983.jpg"
                alt="Executive User"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
              <div className="hidden xl:block text-left text-xs leading-tight">
                <p className="font-medium text-slate-200">Sarah Jenkins</p>
                <p className="text-slate-400 text-[10px]">VP Operations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
