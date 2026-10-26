// AFRICAN CROWNS: EMPIRES OF THE SUN
// Atmospheric Title Screen & Civilization Selection

import React from 'react';
import { CIVILIZATIONS } from '../game/constants';
import { CivilizationId } from '../game/types';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  onStartGame: (civ: CivilizationId) => void;
  onLoadGame: () => boolean;
  onOpenCodex: () => void;
  selectedCiv: CivilizationId;
  onSelectCiv: (civ: CivilizationId) => void;
  isAudioMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onLoadGame,
  onOpenCodex,
  selectedCiv,
  onSelectCiv,
  isAudioMuted,
  onToggleMute,
}) => {
  const currentCivInfo = CIVILIZATIONS[selectedCiv];

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#2a130b] via-[#1a0e08] to-[#0d0704] text-amber-100 p-3 sm:p-6">
      {/* Top Bar with sound, PWA install, and codex buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10 w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[11px] sm:text-xs uppercase tracking-widest text-amber-400/90 font-bold">
            Mobile RTS & Kingdom Builder
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <PWAInstallButton />
          <button
            onClick={onToggleMute}
            aria-label="Toggle Audio"
            className="px-2.5 py-1.5 rounded-lg border border-amber-700/50 bg-black/50 hover:bg-amber-950/60 text-xs text-amber-200 transition"
          >
            {isAudioMuted ? '🔇 Muted' : '🔊 Sound'}
          </button>
          <button
            onClick={onOpenCodex}
            aria-label="Historical Codex"
            className="px-2.5 py-1.5 rounded-lg border border-amber-500/60 bg-amber-900/50 hover:bg-amber-800/60 text-xs text-amber-200 font-semibold transition"
          >
            📜 Codex
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Inline Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto py-4 z-10 text-center max-w-4xl mx-auto">
        {/* Crown & Sun Emblem Lockup */}
        <div className="mb-4">
          <svg className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-2xl" viewBox="0 0 160 160" fill="none">
            {/* Radiant Sun Glow */}
            <circle cx="80" cy="80" r="70" fill="url(#titleGlow)" />
            {/* Sun Rays */}
            <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
              <line x1="80" y1="12" x2="80" y2="24" />
              <line x1="80" y1="136" x2="80" y2="148" />
              <line x1="12" y1="80" x2="24" y2="80" />
              <line x1="136" y1="80" x2="148" y2="80" />
              <line x1="32" y1="32" x2="41" y2="41" />
              <line x1="119" y1="119" x2="128" y2="128" />
              <line x1="32" y1="128" x2="41" y2="119" />
              <line x1="119" y1="41" x2="128" y2="32" />
            </g>
            {/* Crown Base */}
            <path
              d="M 40 105 L 120 105 L 115 116 L 45 116 Z"
              fill="#78350f"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            {/* Crown Peaks */}
            <path
              d="M 40 105 L 45 70 L 58 88 L 70 55 L 80 82 L 90 55 L 102 88 L 115 70 L 120 105 Z"
              fill="url(#goldCrown)"
              stroke="#451a03"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Central Spire and Gems */}
            <path d="M 74 85 L 80 38 L 86 85 Z" fill="#fef08a" stroke="#b45309" strokeWidth="1.5" />
            <circle cx="80" cy="36" r="5" fill="#ef4444" stroke="#fde047" strokeWidth="1.2" />
            <circle cx="70" cy="54" r="3.5" fill="#ef4444" stroke="#fde047" strokeWidth="1" />
            <circle cx="90" cy="54" r="3.5" fill="#ef4444" stroke="#fde047" strokeWidth="1" />
            <defs>
              <radialGradient id="titleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#9a3412" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#451a03" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="goldCrown" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title Lockup */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-wider text-amber-200 drop-shadow-lg uppercase font-serif">
          African Crowns
        </h1>
        <p className="text-sm sm:text-lg font-medium tracking-widest text-amber-400/90 uppercase mt-1 mb-6">
          Empires of the Sun
        </p>

        {/* Civilization Picker */}
        <div className="w-full max-w-2xl bg-black/50 border border-amber-900/60 rounded-2xl p-4 sm:p-5 backdrop-blur-none mb-6">
          <p className="text-xs uppercase tracking-wider text-amber-300/80 mb-3 font-semibold">
            Choose Your Sovereign Civilization
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            {(['mali', 'benin', 'egypt'] as CivilizationId[]).map((id) => {
              const info = CIVILIZATIONS[id];
              const isSelected = selectedCiv === id;
              return (
                <button
                  key={id}
                  onClick={() => onSelectCiv(id)}
                  className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/80 shadow-lg shadow-amber-900/40 scale-102'
                      : 'border-amber-900/40 bg-black/40 hover:border-amber-700/60 hover:bg-amber-950/30'
                  }`}
                >
                  <span className="text-xl sm:text-2xl mb-1">
                    {id === 'mali' ? '👑' : id === 'benin' ? '🛡️' : '☀️'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-amber-100">{info.name}</span>
                  <span className="text-[10px] text-amber-400/80 mt-0.5 line-clamp-1">
                    {info.dynastyTitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Civ Highlight details */}
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-xl p-3 text-left text-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-bold text-amber-300">{currentCivInfo.name}</span>
              <span className="text-[11px] text-amber-400/70">{currentCivInfo.historicalPeriod}</span>
            </div>
            <p className="text-amber-100/90 leading-relaxed">{currentCivInfo.lore}</p>
            <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              <span className="text-amber-300 font-semibold">
                Bonus: <span className="text-amber-100 font-normal">{currentCivInfo.bonusDescription}</span>
              </span>
              <span className="text-amber-300 font-semibold">
                Elite Unit: <span className="text-amber-100 font-normal">{currentCivInfo.uniqueUnit}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          <button
            data-start="true"
            onClick={() => onStartGame(selectedCiv)}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-bold text-sm sm:text-base shadow-xl shadow-amber-950/60 transform active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Play Scenario: The First Crown</span>
            <span className="font-bold text-lg">→</span>
          </button>

          <button
            onClick={onLoadGame}
            className="w-full sm:w-auto py-3.5 px-5 rounded-xl border border-amber-700/60 bg-black/40 hover:bg-amber-950/60 text-amber-200 text-xs sm:text-sm font-semibold transition"
          >
            📂 Load Realm
          </button>
        </div>
      </div>

      {/* Flat borderless control hint line */}
      <div className="text-center z-10 text-[11px] text-amber-400/60 tracking-wider">
        Touch Drag to Pan · Tap to Place & Command · WASD / Space / Esc Controls
      </div>
    </div>
  );
};
