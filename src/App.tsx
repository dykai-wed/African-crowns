// AFRICAN CROWNS: EMPIRES OF THE SUN
// Main Application & Game Shell

import React, { useEffect, useState } from 'react';
import { sound } from './game/audio';
import { useGameEngine } from './game/useGameEngine';
import { CodexModal } from './components/CodexModal';
import { GameHUD } from './components/GameHUD';
import { DefeatModal, PauseModal, VictoryModal } from './components/StatusModals';
import { TitleScreen } from './components/TitleScreen';

export function App() {
  const {
    gameState,
    setGameState,
    civilization,
    setCivilization,
    taxLevel,
    setTaxLevel,
    resources,
    population,
    happiness,
    happinessSummary,
    gameSpeed,
    setGameSpeed,
    gameTime,
    objectives,
    selectedBuilding,
    selectedUnits,
    selectedResource,
    commandMode,
    setCommandMode,
    clearSelection,
    placementMode,
    toastMessage,
    canvasRef,
    startGame,
    restartGame,
    saveGame,
    loadGame,
    startPlacingBuilding,
    cancelPlacement,
    recruitUnit,
    selectAllTroops,
    centerOnCompound,
    zoomIn,
    zoomOut,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onContextMenu,
  } = useGameEngine();

  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Check ?autostart=1 parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame('mali');
    }
  }, [startGame]);

  // Handle title screen Enter / Space start hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        startGame(civilization);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [civilization, gameState, startGame]);

  const handleToggleMute = () => {
    const muted = sound.toggleMuteAll();
    setIsAudioMuted(muted);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a0e08]">
      {/* 1. Title Screen Shell */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={startGame}
          onLoadGame={loadGame}
          onOpenCodex={() => setIsCodexOpen(true)}
          selectedCiv={civilization}
          onSelectCiv={setCivilization}
          isAudioMuted={isAudioMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. Isolated Canvas 2D Viewport */}
      <div
        className={`w-full h-full ${gameState === 'title' ? 'hidden' : 'block'}`}
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onContextMenu={onContextMenu}
          className="w-full h-full block cursor-crosshair"
        />
      </div>

      {/* 3. In-Game HUD Overlay (Rendered when playing or paused) */}
      {gameState !== 'title' && (
        <GameHUD
          resources={resources}
          population={population}
          happiness={happiness}
          happinessSummary={happinessSummary}
          gameSpeed={gameSpeed}
          gameTime={gameTime}
          civilization={civilization}
          taxLevel={taxLevel}
          objectives={objectives}
          selectedBuilding={selectedBuilding}
          selectedUnits={selectedUnits}
          selectedResource={selectedResource}
          commandMode={commandMode}
          placementMode={placementMode}
          toastMessage={toastMessage}
          isAudioMuted={isAudioMuted}
          onSetGameSpeed={setGameSpeed}
          onToggleMute={handleToggleMute}
          onPause={() => setGameState('paused')}
          onOpenCodex={() => setIsCodexOpen(true)}
          onSaveGame={saveGame}
          onSetTaxLevel={setTaxLevel}
          onStartPlacingBuilding={startPlacingBuilding}
          onCancelPlacement={cancelPlacement}
          onRecruitUnit={recruitUnit}
          onSelectAllTroops={selectAllTroops}
          onSetCommandMode={setCommandMode}
          onClearSelection={clearSelection}
          onCenterCompound={centerOnCompound}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
      )}

      {/* 4. Historical Codex Modal */}
      <CodexModal isOpen={isCodexOpen} onClose={() => setIsCodexOpen(false)} />

      {/* 5. Status Modals */}
      <PauseModal
        isOpen={gameState === 'paused'}
        onResume={() => setGameState('playing')}
        onRestart={restartGame}
        onSave={saveGame}
        onQuitToTitle={() => {
          setGameState('title');
          document.body.dataset.state = 'title';
        }}
      />

      <VictoryModal
        isOpen={gameState === 'victory'}
        gameTime={gameTime}
        finalResources={resources}
        objectives={objectives}
        onPlayAgain={restartGame}
        onQuitToTitle={() => {
          setGameState('title');
          document.body.dataset.state = 'title';
        }}
      />

      <DefeatModal
        isOpen={gameState === 'defeat'}
        onRetry={restartGame}
        onQuitToTitle={() => {
          setGameState('title');
          document.body.dataset.state = 'title';
        }}
      />
    </div>
  );
}

export default App;
