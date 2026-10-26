// AFRICAN CROWNS: EMPIRES OF THE SUN
// Outcome Status Modals & PWA Install Component

import React from 'react';
import { CampaignObjective, Resources } from '../game/types';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onSave: () => void;
  onQuitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onSave,
  onQuitToTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
      <div className="w-full max-w-sm bg-[#24130a] border border-amber-600/80 rounded-2xl p-6 text-center text-amber-100 shadow-2xl space-y-4">
        <h2 className="text-2xl font-bold text-amber-200 uppercase tracking-wide">
          Royal Council Paused
        </h2>
        <p className="text-xs text-amber-400/80">
          The sun stands still over your empire. Choose an action:
        </p>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm shadow transition"
          >
            ▶️ Resume Ruling
          </button>
          <button
            onClick={onSave}
            className="w-full py-2.5 rounded-xl border border-amber-700/60 bg-black/40 hover:bg-amber-950/60 text-amber-200 text-xs font-semibold transition"
          >
            💾 Save Kingdom
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl border border-amber-700/60 bg-black/40 hover:bg-amber-950/60 text-amber-200 text-xs font-semibold transition"
          >
            🔄 Restart Scenario
          </button>
          <button
            onClick={onQuitToTitle}
            className="w-full py-2.5 rounded-xl border border-stone-700 bg-stone-900/60 hover:bg-stone-800 text-stone-300 text-xs font-medium transition"
          >
            🚪 Return to Title
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  isOpen: boolean;
  gameTime: number;
  finalResources: Resources;
  objectives: CampaignObjective[];
  onPlayAgain: () => void;
  onQuitToTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  gameTime,
  finalResources,
  objectives,
  onPlayAgain,
  onQuitToTitle,
}) => {
  if (!isOpen) return null;

  const m = Math.floor(gameTime / 60);
  const s = Math.floor(gameTime % 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none">
      <div className="w-full max-w-md bg-[#24130a] border-2 border-amber-400 rounded-3xl p-6 text-center text-amber-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="text-4xl">👑</div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
            Scenario Complete
          </span>
          <h2 className="text-3xl font-black text-amber-200 uppercase tracking-wide mt-1">
            Victory of the Sun!
          </h2>
          <p className="text-xs text-amber-300/80 mt-1">
            The rival stronghold has crumbled! Your kingdom stands sovereign, renowned across all the
            lands.
          </p>
        </div>

        {/* Run Metrics */}
        <div className="grid grid-cols-2 gap-2 bg-black/40 border border-amber-900/60 rounded-xl p-3 text-left text-xs font-mono">
          <div>
            <span className="text-amber-400/70 text-[10px] block">Time Elapsed</span>
            <span className="text-sm font-bold text-amber-100">{m}m {s}s</span>
          </div>
          <div>
            <span className="text-amber-400/70 text-[10px] block">Treasury Gold</span>
            <span className="text-sm font-bold text-amber-300">{Math.floor(finalResources.gold)}</span>
          </div>
          <div>
            <span className="text-amber-400/70 text-[10px] block">Stored Food</span>
            <span className="text-sm font-bold text-amber-100">{Math.floor(finalResources.food)}</span>
          </div>
          <div>
            <span className="text-amber-400/70 text-[10px] block">Objectives Cleared</span>
            <span className="text-sm font-bold text-emerald-400">
              {objectives.filter((o) => o.isCompleted).length} / {objectives.length}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            data-start="true"
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-xl transition"
          >
            Play Scenario Again
          </button>
          <button
            onClick={onQuitToTitle}
            className="w-full py-2.5 rounded-xl border border-amber-700/60 bg-black/40 hover:bg-amber-950/60 text-amber-200 text-xs font-semibold transition"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};

interface DefeatModalProps {
  isOpen: boolean;
  onRetry: () => void;
  onQuitToTitle: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  isOpen,
  onRetry,
  onQuitToTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none">
      <div className="w-full max-w-sm bg-[#1c0c08] border-2 border-rose-700/80 rounded-3xl p-6 text-center text-amber-100 shadow-2xl space-y-4">
        <div className="text-4xl">🥀</div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">
            The Dynasty Falls
          </span>
          <h2 className="text-2xl font-black text-rose-200 uppercase tracking-wide mt-1">
            Kingdom Captured
          </h2>
          <p className="text-xs text-rose-300/80 mt-1">
            Your royal compound has fallen to enemy raiders. The courtyards are silent.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            data-start="true"
            onClick={onRetry}
            className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow transition"
          >
            Try Again
          </button>
          <button
            onClick={onQuitToTitle}
            className="w-full py-2.5 rounded-xl border border-stone-700 bg-black/40 hover:bg-stone-900 text-stone-300 text-xs font-semibold transition"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
