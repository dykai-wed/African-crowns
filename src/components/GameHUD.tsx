// AFRICAN CROWNS: EMPIRES OF THE SUN
// Mobile-First In-Game HUD & Command Dock

import React, { useState } from 'react';
import { BUILDINGS, CIVILIZATIONS, UNITS } from '../game/constants';
import {
  BuildingType,
  CampaignObjective,
  CivilizationId,
  GameUnit,
  PlacedBuilding,
  Population,
  Resources,
  TaxLevel,
  TerrainResource,
  UnitType,
} from '../game/types';

interface GameHUDProps {
  resources: Resources;
  population: Population;
  happiness: number;
  happinessSummary: string;
  gameSpeed: number;
  gameTime: number;
  civilization: CivilizationId;
  taxLevel: TaxLevel;
  objectives: CampaignObjective[];
  selectedBuilding: PlacedBuilding | null;
  selectedUnits: GameUnit[];
  selectedResource: TerrainResource | null;
  commandMode: 'inspect' | 'command';
  placementMode: BuildingType | null;
  toastMessage: string | null;
  isAudioMuted: boolean;
  onSetGameSpeed: (speed: number) => void;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenCodex: () => void;
  onSaveGame: () => void;
  onSetTaxLevel: (level: TaxLevel) => void;
  onStartPlacingBuilding: (type: BuildingType) => void;
  onCancelPlacement: () => void;
  onRecruitUnit: (type: UnitType) => void;
  onSelectAllTroops: () => void;
  onSetCommandMode: (mode: 'inspect' | 'command') => void;
  onClearSelection: () => void;
  onCenterCompound: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  resources,
  population,
  happiness,
  happinessSummary,
  gameSpeed,
  gameTime,
  civilization,
  taxLevel,
  objectives,
  selectedBuilding,
  selectedUnits,
  selectedResource,
  commandMode,
  placementMode,
  toastMessage,
  isAudioMuted,
  onSetGameSpeed,
  onToggleMute,
  onPause,
  onOpenCodex,
  onSaveGame,
  onSetTaxLevel,
  onStartPlacingBuilding,
  onCancelPlacement,
  onRecruitUnit,
  onSelectAllTroops,
  onSetCommandMode,
  onClearSelection,
  onCenterCompound,
  onZoomIn,
  onZoomOut,
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'military' | 'taxes' | 'objectives' | null>('build');
  const [buildCategory, setBuildCategory] = useState<'all' | 'food' | 'residential' | 'resource' | 'defense'>('all');

  const civInfo = CIVILIZATIONS[civilization];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const buildingList = Object.values(BUILDINGS).filter((b) => {
    if (b.type === 'compound') return false; // cannot place second compound
    if (buildCategory === 'all') return true;
    if (buildCategory === 'food') return b.category === 'food';
    if (buildCategory === 'residential') return b.category === 'residential';
    if (buildCategory === 'resource') return b.category === 'resource' || b.category === 'economy';
    if (buildCategory === 'defense') return b.category === 'defense';
    return true;
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-1.5 sm:p-4 select-none">
      {/* 1. Top Perimeter Resource Bar */}
      <header className="flex flex-col gap-1.5 w-full max-w-6xl mx-auto pointer-events-auto">
        {/* Mobile Top Row: Crest + Utilities (Visible on small screens) */}
        <div className="flex sm:hidden items-center justify-between gap-1 w-full">
          <div className="flex items-center gap-1.5 bg-[#26150c]/90 border border-amber-900/70 rounded-xl px-2.5 py-1 shadow-lg shadow-black/40">
            <span className="text-sm">👑</span>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-amber-200 tracking-wide truncate max-w-[120px]">{civInfo.name}</h2>
              <span className="text-[10px] text-amber-400/80 font-mono">({formatTime(gameTime)})</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#26150c]/90 border border-amber-900/70 rounded-xl px-1.5 py-1 shadow-lg shadow-black/40">
            <button
              onClick={() => onSetGameSpeed(gameSpeed === 1 ? 2 : 1)}
              className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono font-bold text-amber-300"
            >
              {gameSpeed}x
            </button>
            <button onClick={onToggleMute} className="p-1 text-xs text-amber-200">
              {isAudioMuted ? '🔇' : '🔊'}
            </button>
            <button onClick={onSaveGame} className="p-1 text-xs text-amber-200">
              💾
            </button>
            <button onClick={onOpenCodex} className="p-1 text-xs text-amber-200">
              📜
            </button>
            <button onClick={onPause} className="p-1 text-xs text-amber-200">
              ⏸️
            </button>
          </div>
        </div>

        {/* Desktop Header Row (Visible on sm and up) */}
        <div className="hidden sm:flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 bg-[#26150c]/90 border border-amber-900/70 rounded-xl px-3 py-1.5 shadow-lg shadow-black/40">
            <span className="text-base">👑</span>
            <div className="leading-tight">
              <h2 className="text-xs font-bold text-amber-200 tracking-wide">{civInfo.name}</h2>
              <span className="text-[10px] text-amber-400/80 font-mono">Time: {formatTime(gameTime)}</span>
            </div>
          </div>

          {/* Desktop Resource Cluster */}
          <div className="flex items-center gap-3 bg-[#26150c]/95 border border-amber-800/80 rounded-xl px-3 py-1.5 shadow-xl shadow-black/50 text-xs">
            <div className="flex items-center gap-1">
              <span>🌾</span>
              <div className="flex flex-col">
                <span className="font-mono font-bold text-amber-100 tabular-nums">{Math.floor(resources.food)}</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-400/70 font-semibold">Food</span>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-amber-900/50" />
            <div className="flex items-center gap-1">
              <span>🪵</span>
              <div className="flex flex-col">
                <span className="font-mono font-bold text-amber-100 tabular-nums">{Math.floor(resources.timber)}</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-400/70 font-semibold">Timber</span>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-amber-900/50" />
            <div className="flex items-center gap-1">
              <span>🪨</span>
              <div className="flex flex-col">
                <span className="font-mono font-bold text-amber-100 tabular-nums">{Math.floor(resources.stone)}</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-400/70 font-semibold">Stone</span>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-amber-900/50" />
            <div className="flex items-center gap-1">
              <span>🪙</span>
              <div className="flex flex-col">
                <span className="font-mono font-bold text-amber-300 tabular-nums">{Math.floor(resources.gold)}</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-400/70 font-semibold">Gold</span>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-amber-900/50" />
            <div className="flex items-center gap-1">
              <span>👥</span>
              <div className="flex flex-col">
                <span className="font-mono font-bold text-sky-200 tabular-nums">
                  {population.total}/{population.maxCapacity}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-sky-400/70 font-semibold">Pop</span>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-amber-900/50" />
            <div className="flex items-center gap-1.5" title={happinessSummary}>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  happiness >= 75 ? 'bg-emerald-500' : happiness >= 45 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
                }`}
              />
              <div className="flex flex-col">
                <span className="font-mono font-bold text-amber-100 tabular-nums">{happiness}%</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-400/70 font-semibold">Mood</span>
              </div>
            </div>
          </div>

          {/* Desktop Utilities */}
          <div className="flex items-center gap-1 bg-[#26150c]/90 border border-amber-900/70 rounded-xl p-1 shadow-lg shadow-black/40">
            <button
              onClick={() => onSetGameSpeed(gameSpeed === 1 ? 2 : 1)}
              className="px-2 py-1 rounded bg-black/40 hover:bg-amber-950 text-xs font-mono font-bold text-amber-300 transition"
            >
              {gameSpeed}x
            </button>
            <button onClick={onToggleMute} className="p-1.5 rounded hover:bg-amber-950 text-xs text-amber-200 transition">
              {isAudioMuted ? '🔇' : '🔊'}
            </button>
            <button onClick={onSaveGame} className="p-1.5 rounded hover:bg-amber-950 text-xs text-amber-200 transition">
              💾
            </button>
            <button onClick={onOpenCodex} className="p-1.5 rounded hover:bg-amber-950 text-xs text-amber-200 transition">
              📜
            </button>
            <button onClick={onPause} className="p-1.5 rounded hover:bg-amber-950 text-xs text-amber-200 transition">
              ⏸️
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Resource Strip */}
        <div className="flex sm:hidden items-center justify-between gap-1.5 bg-[#26150c]/95 border border-amber-800/80 rounded-xl px-2.5 py-1 shadow-xl text-[11px] overflow-x-auto w-full">
          <div className="flex items-center gap-1">
            <span>🌾</span>
            <span className="font-mono font-bold text-amber-100 tabular-nums">{Math.floor(resources.food)}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-amber-900/50" />
          <div className="flex items-center gap-1">
            <span>🪵</span>
            <span className="font-mono font-bold text-amber-100 tabular-nums">{Math.floor(resources.timber)}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-amber-900/50" />
          <div className="flex items-center gap-1">
            <span>🪨</span>
            <span className="font-mono font-bold text-amber-100 tabular-nums">{Math.floor(resources.stone)}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-amber-900/50" />
          <div className="flex items-center gap-1">
            <span>🪙</span>
            <span className="font-mono font-bold text-amber-300 tabular-nums">{Math.floor(resources.gold)}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-amber-900/50" />
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span className="font-mono font-bold text-sky-200 tabular-nums">{population.total}/{population.maxCapacity}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-amber-900/50" />
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${happiness >= 75 ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span className="font-mono font-bold text-amber-100 tabular-nums">{happiness}%</span>
          </div>
        </div>
      </header>

      {/* 2. Toast / War Horn Notification Banner */}
      {toastMessage && (
        <div className="pointer-events-auto mx-auto my-2 max-w-lg rounded-xl bg-gradient-to-r from-amber-950 via-[#3a1a0c] to-amber-950 border border-amber-500/80 px-4 py-2.5 shadow-2xl text-center text-xs font-semibold text-amber-200 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 3. Floating Quick Action Controls (Right Perimeter) */}
      <div className="absolute right-3 top-24 pointer-events-auto flex flex-col gap-2">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          aria-label="Zoom in map"
          className="w-10 h-10 rounded-xl bg-[#26150c]/90 border border-amber-700/60 hover:bg-amber-900 text-amber-100 font-bold shadow-lg flex items-center justify-center transition active:scale-95"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          aria-label="Zoom out map"
          className="w-10 h-10 rounded-xl bg-[#26150c]/90 border border-amber-700/60 hover:bg-amber-900 text-amber-100 font-bold shadow-lg flex items-center justify-center transition active:scale-95"
        >
          −
        </button>
        <button
          onClick={onCenterCompound}
          title="Center on Royal Compound"
          aria-label="Center camera on royal compound"
          className="w-10 h-10 rounded-xl bg-[#26150c]/90 border border-amber-700/60 hover:bg-amber-900 text-amber-100 text-sm shadow-lg flex items-center justify-center transition active:scale-95"
        >
          📍
        </button>
        <button
          onClick={onSelectAllTroops}
          title="Rally All Warriors"
          aria-label="Select all army troops"
          className="w-10 h-10 rounded-xl bg-amber-600/90 hover:bg-amber-500 border border-amber-400 text-stone-950 font-bold shadow-lg flex items-center justify-center transition active:scale-95"
        >
          ⚔️
        </button>
      </div>

      {/* 4. Placement Preview Cancellation Floating Banner */}
      {placementMode && (
        <div className="pointer-events-auto mx-auto mb-2 bg-[#26150c]/95 border border-amber-500 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4">
          <div>
            <p className="text-xs font-bold text-amber-300">
              Placing: {BUILDINGS[placementMode].name}
            </p>
            <p className="text-[11px] text-amber-100/80">Tap valid green ground to construct</p>
          </div>
          <button
            onClick={onCancelPlacement}
            className="px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 border border-rose-500 text-xs font-bold text-rose-100 transition"
          >
            Cancel Placement
          </button>
        </div>
      )}

      {/* 5. Contextual Inspector Card (When Building, Unit, or Natural Resource is Selected) */}
      {(selectedBuilding || selectedUnits.length > 0 || selectedResource) && (
        <div className="pointer-events-auto mx-auto mb-2 w-full max-w-xl bg-[#26150c]/95 border border-amber-600/80 rounded-2xl p-3 shadow-2xl text-xs backdrop-blur-sm animate-fade-in">
          {/* Building Inspector */}
          {selectedBuilding && (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 text-sm">
                    {BUILDINGS[selectedBuilding.type].name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-700/50 text-amber-400 uppercase font-semibold">
                    {selectedBuilding.owner === 'player' ? 'Royal Realm' : 'Rival Warlord'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-100/80 mt-0.5">
                  {BUILDINGS[selectedBuilding.type].description}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-amber-300/90">
                  <span>
                    Integrity: {selectedBuilding.hp} / {selectedBuilding.maxHp} HP
                  </span>
                  {!selectedBuilding.isConstructed && (
                    <span className="text-amber-400 font-bold">
                      Under Construction ({Math.round(selectedBuilding.constructionProgress * 100)}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={onClearSelection}
                  className="px-2 py-1 rounded-lg bg-black/40 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[10px] transition cursor-pointer"
                  title="Deselect (Hotkey: Esc)"
                >
                  ✕ Deselect
                </button>

                {selectedBuilding.type === 'barracks' && selectedBuilding.owner === 'player' && (
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Train Soldiers:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onRecruitUnit('spearman')}
                        className="px-2 py-1 rounded bg-amber-800 hover:bg-amber-700 text-amber-100 text-[10px] font-bold cursor-pointer"
                      >
                        Spearman (10G)
                      </button>
                      <button
                        onClick={() => onRecruitUnit('archer')}
                        className="px-2 py-1 rounded bg-amber-800 hover:bg-amber-700 text-amber-100 text-[10px] font-bold cursor-pointer"
                      >
                        Archer (15G)
                      </button>
                      <button
                        onClick={() => onRecruitUnit('cavalry')}
                        className="px-2 py-1 rounded bg-amber-800 hover:bg-amber-700 text-amber-100 text-[10px] font-bold cursor-pointer"
                      >
                        Cavalry (35G)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unit Inspector & Command Controls */}
          {selectedUnits.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 text-sm">
                    {selectedUnits.length === 1
                      ? UNITS[selectedUnits[0].type].name
                      : `${selectedUnits.length} Warriors Selected`}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 font-mono">
                    {selectedUnits[0]?.state.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-amber-100/80 mt-0.5">
                  {commandMode === 'command'
                    ? '⚔️ Command Mode active: Tap destination or rival to order march/assault.'
                    : '🔍 Inspect Mode: Right-click anytime, or toggle Command Mode to tap-to-move.'}
                </p>
                {selectedUnits.length === 1 && (
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-amber-300/90">
                    <span>
                      HP: {selectedUnits[0].hp} / {selectedUnits[0].maxHp}
                    </span>
                    <span>ATK: {selectedUnits[0].damage}</span>
                    <span>DEF: {selectedUnits[0].defense}</span>
                    <span>SPD: {selectedUnits[0].speed}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSetCommandMode(commandMode === 'command' ? 'inspect' : 'command')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    commandMode === 'command'
                      ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-lg shadow-amber-500/30'
                      : 'bg-black/50 text-amber-300 border-amber-700/60 hover:bg-amber-950'
                  }`}
                  title="Toggle tap-to-move/attack (Hotkey: C)"
                >
                  <span>{commandMode === 'command' ? '⚔️' : '🔍'}</span>
                  <span>{commandMode === 'command' ? 'Order Mode: ON' : 'Order Mode: OFF'}</span>
                </button>
                <button
                  onClick={onClearSelection}
                  className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs transition cursor-pointer"
                  title="Deselect units (Hotkey: Esc)"
                >
                  ✕ Clear
                </button>
              </div>
            </div>
          )}

          {/* Natural Resource Inspector */}
          {selectedResource && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/40 border border-amber-700/60 flex items-center justify-center text-xl shrink-0">
                  {selectedResource.type === 'tree' ? '🌳' : selectedResource.type === 'rock' ? '🪨' : '🪙'}
                </div>
                <div>
                  <span className="font-bold text-amber-300 text-sm">
                    {selectedResource.type === 'tree'
                      ? 'Acacia Tree Grove'
                      : selectedResource.type === 'rock'
                      ? 'Granite Rock Deposit'
                      : 'Rich Gold Vein'}
                  </span>
                  <p className="text-[11px] text-amber-100/80 mt-0.5">
                    {selectedResource.type === 'tree'
                      ? 'Yields seasoned timber essential for roundhouses, granaries, and war bows.'
                      : selectedResource.type === 'rock'
                      ? 'Heft stone boulders for fortifications, watchtowers, and palisades.'
                      : 'Lustrous alluvial gold for imperial prestige and royal army upkeep.'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-amber-300/90">
                    <span>Deposit Remaining: {selectedResource.amount} units</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClearSelection}
                className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs transition cursor-pointer"
                title="Deselect (Hotkey: Esc)"
              >
                ✕ Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. Bottom Master Command Dock */}
      <footer className="pointer-events-auto w-full max-w-4xl mx-auto bg-[#26150c]/95 border border-amber-800/80 rounded-2xl shadow-2xl p-2.5 backdrop-blur-none">
        {/* Navigation Tabs */}
        <nav className="flex items-center justify-between border-b border-amber-900/60 pb-2 mb-2 text-xs" aria-label="Command Navigation">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('build')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'build'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'bg-black/40 text-amber-200 hover:bg-amber-950/60'
              }`}
            >
              <span>🔨</span>
              <span>Construction</span>
            </button>

            <button
              onClick={() => setActiveTab('military')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'military'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'bg-black/40 text-amber-200 hover:bg-amber-950/60'
              }`}
            >
              <span>🛡️</span>
              <span>Warriors</span>
            </button>

            <button
              onClick={() => setActiveTab('taxes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'taxes'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'bg-black/40 text-amber-200 hover:bg-amber-950/60'
              }`}
            >
              <span>⚖️</span>
              <span>Taxes & Realm</span>
            </button>

            <button
              onClick={() => setActiveTab('objectives')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'objectives'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'bg-black/40 text-amber-200 hover:bg-amber-950/60'
              }`}
            >
              <span>🎯</span>
              <span>Objectives</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab(activeTab ? null : 'build')}
            className="text-[11px] text-amber-400/80 hover:text-amber-200 px-2 py-1"
          >
            {activeTab ? '▼ Minimize' : '▲ Open Dock'}
          </button>
        </nav>

        {/* Tab Content Panels */}
        {activeTab === 'build' && (
          <div className="space-y-2">
            {/* Category Pills */}
            <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-1">
              {(['all', 'residential', 'food', 'resource', 'defense'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setBuildCategory(cat)}
                  className={`px-2.5 py-1 rounded-full capitalize font-medium transition ${
                    buildCategory === cat
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-black/40 text-amber-300 hover:bg-amber-950'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Building Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
              {buildingList.map((b) => {
                const canPay =
                  resources.timber >= b.cost.timber &&
                  resources.stone >= b.cost.stone &&
                  resources.gold >= b.cost.gold;

                return (
                  <button
                    key={b.type}
                    onClick={() => onStartPlacingBuilding(b.type)}
                    disabled={!canPay}
                    className={`flex flex-col text-left p-2 rounded-xl border transition ${
                      canPay
                        ? 'border-amber-700/60 bg-black/40 hover:border-amber-400 hover:bg-amber-950/60 cursor-pointer'
                        : 'border-stone-800 bg-stone-950/40 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-bold text-amber-200 text-xs truncate">{b.name}</span>
                    <span className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                      {b.cost.timber ? `${b.cost.timber}W ` : ''}
                      {b.cost.stone ? `${b.cost.stone}S ` : ''}
                      {b.cost.gold ? `${b.cost.gold}G` : ''}
                    </span>
                    <span className="text-[9px] text-amber-300/60 line-clamp-1 mt-0.5">
                      {b.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'military' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['villager', 'spearman', 'archer', 'cavalry'] as UnitType[]).map((uType) => {
              const u = UNITS[uType];
              const canPay =
                resources.food >= u.cost.food &&
                resources.timber >= u.cost.timber &&
                resources.gold >= u.cost.gold &&
                population.total < population.maxCapacity;

              return (
                <button
                  key={uType}
                  onClick={() => onRecruitUnit(uType)}
                  disabled={!canPay}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition ${
                    canPay
                      ? 'border-amber-700/60 bg-black/40 hover:border-amber-400 hover:bg-amber-950/60'
                      : 'border-stone-800 bg-stone-950/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-200 text-xs">{u.name}</span>
                    <span className="text-xs">
                      {uType === 'spearman' ? '🗡️' : uType === 'archer' ? '🏹' : uType === 'cavalry' ? '🐎' : '🧑'}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono mt-1">
                    {u.cost.food}F · {u.cost.timber}W · {u.cost.gold}G
                  </span>
                  <span className="text-[9px] text-amber-300/60 mt-0.5">{u.role}</span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'taxes' && (
          <div className="space-y-2 text-xs">
            <p className="text-amber-300 font-medium">Select Royal Tribute & Taxation Rate</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { level: 'low', label: 'Low Tax', effect: '+Gold 15% · Satisfaction +15' },
                  { level: 'moderate', label: 'Moderate', effect: '+Gold 35% · Balanced' },
                  { level: 'high', label: 'High Tax', effect: '+Gold 70% · Satisfaction -18' },
                  { level: 'tribute', label: 'Royal Tribute', effect: '+Gold 110% · Satisfaction -35' },
                ] as const
              ).map((t) => (
                <button
                  key={t.level}
                  onClick={() => onSetTaxLevel(t.level)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    taxLevel === t.level
                      ? 'border-amber-400 bg-amber-950/80 shadow'
                      : 'border-amber-900/50 bg-black/40 hover:bg-amber-950/40'
                  }`}
                >
                  <span className="font-bold text-amber-200 block">{t.label}</span>
                  <span className="text-[10px] text-amber-400/80 mt-0.5 block">{t.effect}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'objectives' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-36 overflow-y-auto">
            {objectives.map((obj) => (
              <div
                key={obj.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                  obj.isCompleted
                    ? 'border-emerald-600/60 bg-emerald-950/40 text-emerald-100'
                    : 'border-amber-900/50 bg-black/40 text-amber-200'
                }`}
              >
                <div>
                  <span className="font-bold block">{obj.title}</span>
                  <span className="text-[10px] opacity-80 block">{obj.description}</span>
                </div>
                <div className="text-right font-mono text-[11px] font-bold">
                  {obj.isCompleted ? (
                    <span className="text-emerald-400">✓ Complete</span>
                  ) : (
                    <span>
                      {obj.current} / {obj.target}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
};
