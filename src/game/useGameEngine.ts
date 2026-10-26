// AFRICAN CROWNS: EMPIRES OF THE SUN
// Core Game Engine & Simulation Hook with Continuous World Generation & Precise Selection

import { useCallback, useEffect, useRef, useState } from 'react';
import { sound } from './audio';
import { Camera, GameRenderer, screenToTile, screenToWorld, tileToWorld } from './canvasRenderer';
import { BUILDINGS, CIVILIZATIONS, MAP_HEIGHT, MAP_WIDTH, UNITS } from './constants';
import {
  calculateCombatDamage,
  calculateFoodConsumption,
  calculateHappiness,
  calculateTaxIncome,
  canAfford,
  checkDefeat,
  checkPlacementCollision,
  checkVictory,
  deductResources,
} from './rules';
import { findClickedEntity, HitResult } from './selection';
import {
  BuildingType,
  CampaignObjective,
  CivilizationId,
  FloatingText,
  GameParticle,
  GameSaveData,
  GameState,
  GameUnit,
  PlacedBuilding,
  Population,
  Projectile,
  Resources,
  RivalState,
  TaxLevel,
  TerrainResource,
  UnitType,
} from './types';
import { generateContinuousWorld, GeneratedWorld, WorldTile } from './worldGen';

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [civilization, setCivilization] = useState<CivilizationId>('mali');
  const [taxLevel, setTaxLevel] = useState<TaxLevel>('moderate');
  const [worldSeed, setWorldSeed] = useState<string>('SUNDIATA_MANSA_1324');

  // Throttled HUD state
  const [hudResources, setHudResources] = useState<Resources>({
    food: 95,
    timber: 80,
    stone: 40,
    gold: 65,
  });
  const [hudPopulation, setHudPopulation] = useState<Population>({
    total: 8,
    available: 3,
    farmers: 2,
    lumberjacks: 2,
    miners: 0,
    builders: 1,
    soldiers: 0,
    maxCapacity: 15,
  });
  const [hudHappiness, setHudHappiness] = useState<number>(80);
  const [hudHappinessSummary, setHudHappinessSummary] = useState<string>('The kingdom is peaceful.');
  const [gameSpeed, setGameSpeed] = useState<number>(1);
  const [gameTime, setGameTime] = useState<number>(0);
  const [objectives, setObjectives] = useState<CampaignObjective[]>([
    {
      id: 'food',
      title: 'Feed the Settlement',
      description: 'Construct 2 Irrigated Farms and stockpile 60 Food.',
      target: 60,
      current: 40,
      isCompleted: false,
    },
    {
      id: 'pop',
      title: 'Attract Kingdom Settlers',
      description: 'Build Roundhouses and reach a population of 14.',
      target: 14,
      current: 8,
      isCompleted: false,
    },
    {
      id: 'army',
      title: 'Muster the Royal Guard',
      description: "Build a Warriors' Lodge and recruit 3 soldiers.",
      target: 3,
      current: 0,
      isCompleted: false,
    },
    {
      id: 'rival',
      title: 'Subdue the Rival Stronghold',
      description: 'Advance across the continuous river and dismantle the rival warlord compound.',
      target: 1,
      current: 0,
      isCompleted: false,
    },
  ]);

  // Selected Entities & Contextual State
  const [selectedBuilding, setSelectedBuilding] = useState<PlacedBuilding | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<GameUnit[]>([]);
  const [selectedResource, setSelectedResource] = useState<TerrainResource | null>(null);
  const [commandMode, setCommandMode] = useState<'inspect' | 'command'>('inspect'); // Mobile tap-to-move/attack mode
  const [placementMode, setPlacementMode] = useState<BuildingType | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas and Camera Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 1.0 });

  // High-frequency simulation state kept in mutable ref for 60fps performance
  const simState = useRef({
    resources: { food: 95, timber: 80, stone: 40, gold: 65 } as Resources,
    population: {
      total: 8,
      available: 3,
      farmers: 2,
      lumberjacks: 2,
      miners: 0,
      builders: 1,
      soldiers: 0,
      maxCapacity: 15,
    } as Population,
    buildings: [] as PlacedBuilding[],
    units: [] as GameUnit[],
    terrain: [] as TerrainResource[],
    worldTiles: [] as WorldTile[][],
    riverTiles: new Set<string>(),
    fordTiles: new Set<string>(),
    blockedTiles: new Set<string>(),
    projectiles: [] as Projectile[],
    particles: [] as GameParticle[],
    floatingTexts: [] as FloatingText[],
    rival: {
      aiState: 'gathering',
      resources: { food: 100, timber: 80, stone: 40, gold: 50 },
      raidTimer: 85,
      raidInterval: 80,
      threatLevel: 1,
      strongholdHp: 1000,
      strongholdMaxHp: 1000,
    } as RivalState,
    selectedBuildingId: null as string | null,
    selectedUnitIds: [] as string[],
    placementPreview: null as { type: string; x: number; y: number; valid: boolean } | null,
    lastTick: performance.now(),
    lastEconomicTick: 0,
    lastGrowthTick: 0,
    lastAiTick: 0,
    gameTime: 0,
    isInteracting: false,
    panStart: { x: 0, y: 0 },
    cameraStart: { x: 0, y: 0 },
    pointerDownButton: 0,
    hasMovedPastDragThreshold: false,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Initialize Continuous World, Terrain & Starter Scenario
  const initScenario = useCallback((civ: CivilizationId, seedStr: string = 'SUNDIATA_MANSA_1324') => {
    const s = simState.current;
    s.resources = { food: 95, timber: 80, stone: 40, gold: 65 };
    s.population = {
      total: 8,
      available: 3,
      farmers: 2,
      lumberjacks: 2,
      miners: 0,
      builders: 1,
      soldiers: 0,
      maxCapacity: 15,
    };
    s.projectiles = [];
    s.particles = [];
    s.floatingTexts = [];
    s.gameTime = 0;
    s.selectedBuildingId = null;
    s.selectedUnitIds = [];
    setSelectedBuilding(null);
    setSelectedUnits([]);
    setSelectedResource(null);

    // 1. Generate Continuous 72x72 World with Seeded Multi-Layer Biomes
    const world: GeneratedWorld = generateContinuousWorld({
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      seedString: seedStr,
    });

    s.worldTiles = world.tiles;
    s.riverTiles = world.riverTiles;
    s.fordTiles = world.fordTiles;
    s.blockedTiles = world.blockedTiles;
    s.terrain = world.terrainResources;

    // 2. Guaranteed Viable Player Starting Settlement at playerSpawn
    const px = world.playerSpawn.x;
    const py = world.playerSpawn.y;

    s.buildings = [
      {
        id: 'player_compound',
        type: 'compound',
        x: px,
        y: py,
        width: 3,
        height: 3,
        hp: 1600,
        maxHp: 1600,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'player',
      },
      {
        id: 'player_house_1',
        type: 'house',
        x: px - 2,
        y: py - 2,
        width: 2,
        height: 2,
        hp: 200,
        maxHp: 200,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'player',
      },
      {
        id: 'player_farm_1',
        type: 'farm',
        x: px + 4,
        y: py,
        width: 2,
        height: 2,
        hp: 180,
        maxHp: 180,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 2,
        owner: 'player',
      },
      {
        id: 'player_lumber_1',
        type: 'lumber_camp',
        x: px - 4,
        y: py,
        width: 2,
        height: 2,
        hp: 220,
        maxHp: 220,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 2,
        owner: 'player',
      },
      {
        id: 'player_market_1',
        type: 'market',
        x: px + 1,
        y: py - 2,
        width: 2,
        height: 2,
        hp: 280,
        maxHp: 280,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'player',
      },
      // Defensive Fortification Ring
      {
        id: 'player_tower_1',
        type: 'tower',
        x: px - 1,
        y: py + 3,
        width: 1,
        height: 1,
        hp: 450,
        maxHp: 450,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'player',
      },
      {
        id: 'player_wall_1',
        type: 'wall',
        x: px,
        y: py + 3,
        width: 1,
        height: 1,
        hp: 400,
        maxHp: 400,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'player',
      },
      {
        id: 'player_gate_1',
        type: 'gate',
        x: px + 1,
        y: py + 3,
        width: 2,
        height: 1,
        hp: 500,
        maxHp: 500,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'player',
      },
      {
        id: 'player_wall_2',
        type: 'wall',
        x: px + 3,
        y: py + 3,
        width: 1,
        height: 1,
        hp: 400,
        maxHp: 400,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'player',
      },
      {
        id: 'player_tower_2',
        type: 'tower',
        x: px + 4,
        y: py + 3,
        width: 1,
        height: 1,
        hp: 450,
        maxHp: 450,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'player',
      },
      // 3. Rival Stronghold across the river in distant territory
      {
        id: 'rival_stronghold',
        type: 'compound',
        x: world.rivalSpawn.x,
        y: world.rivalSpawn.y,
        width: 3,
        height: 3,
        hp: 1000,
        maxHp: 1000,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'rival',
      },
      {
        id: 'rival_barracks',
        type: 'barracks',
        x: world.rivalSpawn.x - 2,
        y: world.rivalSpawn.y + 2,
        width: 3,
        height: 2,
        hp: 500,
        maxHp: 500,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'rival',
      },
      {
        id: 'rival_tower',
        type: 'tower',
        x: world.rivalSpawn.x - 3,
        y: world.rivalSpawn.y - 3,
        width: 1,
        height: 1,
        hp: 400,
        maxHp: 400,
        isConstructed: true,
        constructionProgress: 1,
        assignedWorkers: 0,
        owner: 'rival',
      },
    ];

    // Initial Units
    s.units = [
      {
        id: 'villager_1',
        type: 'villager',
        x: px + 1,
        y: py + 3,
        hp: 50,
        maxHp: 50,
        damage: 5,
        defense: 1,
        range: 1.0,
        speed: 2.2,
        cooldownRemaining: 0,
        owner: 'player',
        state: 'idle',
      },
      {
        id: 'villager_2',
        type: 'villager',
        x: px + 2,
        y: py + 3,
        hp: 50,
        maxHp: 50,
        damage: 5,
        defense: 1,
        range: 1.0,
        speed: 2.2,
        cooldownRemaining: 0,
        owner: 'player',
        state: 'idle',
      },
      {
        id: 'spearman_1',
        type: 'spearman',
        x: px + 3,
        y: py + 4,
        hp: 110,
        maxHp: 110,
        damage: 16,
        defense: 4,
        range: 1.1,
        speed: 2.2,
        cooldownRemaining: 0,
        owner: 'player',
        state: 'idle',
      },
      {
        id: 'spearman_2',
        type: 'spearman',
        x: px - 1,
        y: py + 4,
        hp: 110,
        maxHp: 110,
        damage: 16,
        defense: 4,
        range: 1.1,
        speed: 2.2,
        cooldownRemaining: 0,
        owner: 'player',
        state: 'idle',
      },
      // Rival guards
      {
        id: 'rival_guard_1',
        type: 'spearman',
        x: world.rivalSpawn.x - 2,
        y: world.rivalSpawn.y - 1,
        hp: 110,
        maxHp: 110,
        damage: 15,
        defense: 4,
        range: 1.1,
        speed: 2.2,
        cooldownRemaining: 0,
        owner: 'rival',
        state: 'idle',
      },
      {
        id: 'rival_archer_1',
        type: 'archer',
        x: world.rivalSpawn.x + 1,
        y: world.rivalSpawn.y - 2,
        hp: 75,
        maxHp: 75,
        damage: 12,
        defense: 2,
        range: 4.8,
        speed: 2.0,
        cooldownRemaining: 0,
        owner: 'rival',
        state: 'idle',
      },
    ];

    // Center camera on player compound
    const { x: initCamX, y: initCamY } = tileToWorld(px + 1.5, py + 1.5);
    cameraRef.current = { x: initCamX, y: initCamY, zoom: 1.15 };
  }, []);

  // Start new game
  const startGame = useCallback(
    (selectedCiv: CivilizationId = 'mali', seedStr: string = 'SUNDIATA_MANSA_1324') => {
      setCivilization(selectedCiv);
      setWorldSeed(seedStr);
      initScenario(selectedCiv, seedStr);
      setGameState('playing');
      document.body.dataset.state = 'playing';
      sound.startBGM();
      showToast(`Scenario: The First Crown — Sovereign Realm of ${CIVILIZATIONS[selectedCiv].name}`);
    },
    [initScenario, showToast]
  );

  // Restart scenario
  const restartGame = useCallback(() => {
    initScenario(civilization, worldSeed);
    setGameState('playing');
    document.body.dataset.state = 'playing';
  }, [civilization, initScenario, worldSeed]);

  // Save game to localStorage
  const saveGame = useCallback(() => {
    const s = simState.current;
    const saveData: GameSaveData = {
      version: 2,
      timestamp: Date.now(),
      civilization,
      resources: { ...s.resources },
      population: { ...s.population },
      taxLevel,
      buildings: s.buildings,
      units: s.units,
      terrainResources: s.terrain,
      objectives,
      rival: s.rival,
      gameTime: s.gameTime,
    };
    try {
      localStorage.setItem('african_crowns_save', JSON.stringify(saveData));
      showToast('Kingdom archives sealed! Game saved successfully.');
    } catch {
      showToast('Save failed: local storage limit reached.');
    }
  }, [civilization, objectives, showToast, taxLevel]);

  // Load game from localStorage
  const loadGame = useCallback(() => {
    try {
      const raw = localStorage.getItem('african_crowns_save');
      if (!raw) {
        showToast('No saved kingdom archives found.');
        return false;
      }
      const data: GameSaveData = JSON.parse(raw);
      setCivilization(data.civilization);
      setTaxLevel(data.taxLevel);
      setObjectives(data.objectives);

      // Re-generate continuous world tiles
      initScenario(data.civilization, worldSeed);

      const s = simState.current;
      s.resources = data.resources;
      s.population = data.population;
      s.buildings = data.buildings;
      s.units = data.units;
      s.terrain = data.terrainResources;
      s.rival = data.rival;
      s.gameTime = data.gameTime;

      setGameState('playing');
      document.body.dataset.state = 'playing';
      sound.startBGM();
      showToast('Kingdom restored from royal archives!');
      return true;
    } catch {
      showToast('Failed to load archive: corrupted data.');
      return false;
    }
  }, [initScenario, showToast, worldSeed]);

  // Start Building Construction
  const startPlacingBuilding = useCallback((type: BuildingType) => {
    const cost = BUILDINGS[type].cost;
    const s = simState.current;
    if (!canAfford(s.resources, cost)) {
      showToast(
        `Insufficient resources! Requires: ${cost.timber ? `${cost.timber} Timber ` : ''}${
          cost.stone ? `${cost.stone} Stone ` : ''
        }${cost.gold ? `${cost.gold} Gold` : ''}`
      );
      return;
    }
    setPlacementMode(type);
    showToast(`Select construction site for ${BUILDINGS[type].name}`);
  }, [showToast]);

  const cancelPlacement = useCallback(() => {
    setPlacementMode(null);
    simState.current.placementPreview = null;
  }, []);

  const confirmPlacement = useCallback(
    (tileX: number, tileY: number) => {
      if (!placementMode) return;
      const config = BUILDINGS[placementMode];
      const s = simState.current;

      const isValid = checkPlacementCollision(
        tileX,
        tileY,
        config.width,
        config.height,
        s.buildings,
        MAP_WIDTH,
        MAP_HEIGHT,
        s.blockedTiles
      );

      if (!isValid) {
        showToast('Site obstructed or unsuitable for construction!');
        sound.playDjembeSlap();
        return;
      }

      try {
        s.resources = deductResources(s.resources, config.cost);
        const newBuilding: PlacedBuilding = {
          id: `building_${Date.now()}`,
          type: placementMode,
          x: tileX,
          y: tileY,
          width: config.width,
          height: config.height,
          hp: config.maxHp,
          maxHp: config.maxHp,
          isConstructed: config.buildTime === 0,
          constructionProgress: config.buildTime === 0 ? 1 : 0,
          assignedWorkers: 0,
          owner: 'player',
        };

        s.buildings.push(newBuilding);
        sound.playBuildPlace();
        showToast(`${config.name} foundations established!`);

        s.floatingTexts.push({
          id: `float_${Date.now()}`,
          text: `-${config.cost.timber || 0}W -${config.cost.gold || 0}G`,
          x: tileX + config.width * 0.5,
          y: tileY + config.height * 0.5,
          color: '#fbbf24',
          alpha: 1,
          createdAt: performance.now(),
        });

        setPlacementMode(null);
        simState.current.placementPreview = null;
      } catch (err) {
        showToast((err as Error).message);
      }
    },
    [placementMode, showToast]
  );

  // Train Military Unit
  const recruitUnit = useCallback(
    (unitType: UnitType) => {
      const config = UNITS[unitType];
      const s = simState.current;

      if (
        s.resources.food < config.cost.food ||
        s.resources.timber < config.cost.timber ||
        s.resources.gold < config.cost.gold
      ) {
        showToast(`Cannot afford ${config.name}! Need ${config.cost.food}F, ${config.cost.timber}W, ${config.cost.gold}G`);
        return;
      }

      if (s.population.total >= s.population.maxCapacity) {
        showToast('Housing capacity reached! Construct more roundhouses.');
        return;
      }

      s.resources.food -= config.cost.food;
      s.resources.timber -= config.cost.timber;
      s.resources.gold -= config.cost.gold;
      s.population.total += 1;
      s.population.soldiers += 1;

      // Spawn near compound or barracks
      const barracks = s.buildings.find((b) => b.type === 'barracks' && b.owner === 'player' && b.isConstructed);
      const compound = s.buildings.find((b) => b.type === 'compound' && b.owner === 'player');
      const spawnX = barracks ? barracks.x + 1 : compound ? compound.x + 1 : 18;
      const spawnY = barracks ? barracks.y + 2 : compound ? compound.y + 3 : 18;

      const newUnit: GameUnit = {
        id: `unit_${Date.now()}`,
        type: unitType,
        x: spawnX,
        y: spawnY,
        hp: config.maxHp,
        maxHp: config.maxHp,
        damage: config.damage,
        defense: config.defense,
        range: config.range,
        speed: config.speed,
        cooldownRemaining: 0,
        owner: 'player',
        state: 'idle',
      };

      s.units.push(newUnit);
      sound.playUnitOrder();
      showToast(`${config.name} rallied to your service!`);

      setObjectives((prev) =>
        prev.map((obj) => (obj.id === 'army' ? { ...obj, current: obj.current + 1 } : obj))
      );
    },
    [showToast]
  );

  // Issue Unit Order (Move or Attack)
  const orderSelectedUnits = useCallback(
    (targetTileX: number, targetTileY: number, targetEntityId?: string) => {
      const s = simState.current;
      if (s.selectedUnitIds.length === 0) return;

      s.units.forEach((u) => {
        if (s.selectedUnitIds.includes(u.id) && u.owner === 'player') {
          u.targetX = targetTileX + (Math.random() - 0.5) * 0.8;
          u.targetY = targetTileY + (Math.random() - 0.5) * 0.8;
          u.targetEntityId = targetEntityId;
          u.state = targetEntityId ? 'attacking' : 'moving';
        }
      });

      sound.playUnitOrder();
    },
    []
  );

  // Clear / Deselect Selection
  const clearSelection = useCallback(() => {
    const s = simState.current;
    s.selectedBuildingId = null;
    s.selectedUnitIds = [];
    setSelectedBuilding(null);
    setSelectedUnits([]);
    setSelectedResource(null);
  }, []);

  // Quick Command: Select All Military Units
  const selectAllTroops = useCallback(() => {
    const s = simState.current;
    const army = s.units.filter((u) => u.owner === 'player' && u.type !== 'villager');
    s.selectedUnitIds = army.map((u) => u.id);
    s.selectedBuildingId = null;
    setSelectedUnits(army);
    setSelectedBuilding(null);
    setSelectedResource(null);
    showToast(`${army.length} warriors rallied!`);
  }, [showToast]);

  // Center Camera on Player Compound
  const centerOnCompound = useCallback(() => {
    const compound = simState.current.buildings.find((b) => b.id === 'player_compound');
    if (compound) {
      const { x: cx, y: cy } = tileToWorld(compound.x + 1.5, compound.y + 1.5);
      cameraRef.current.x = cx;
      cameraRef.current.y = cy;
    }
  }, []);

  // ----------------------------------------------------
  // The 60 FPS Game Loop
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new GameRenderer(ctx);
    let animId: number;

    const gameLoop = (timestamp: number) => {
      const s = simState.current;
      const rawDt = (timestamp - s.lastTick) / 1000;
      s.lastTick = timestamp;

      const dt = Math.min(rawDt, 0.05) * gameSpeed;

      if (gameState === 'playing') {
        s.gameTime += dt;

        // 1. Economic & Harvest Tick (every 1 second)
        if (timestamp - s.lastEconomicTick > 1000 / gameSpeed) {
          s.lastEconomicTick = timestamp;

          // Population food consumption
          const consumed = calculateFoodConsumption(s.population.total);
          s.resources.food = Math.max(0, Number((s.resources.food - consumed).toFixed(1)));

          // Production from operational buildings
          s.buildings.forEach((b) => {
            if (!b.isConstructed || b.owner !== 'player') return;

            if (b.type === 'farm') {
              const yieldBonus = civilization === 'egypt' ? 4 : 3;
              s.resources.food += yieldBonus;
            } else if (b.type === 'lumber_camp') {
              s.resources.timber += 3;
            } else if (b.type === 'quarry') {
              s.resources.stone += 2;
            } else if (b.type === 'gold_mine') {
              const goldBonus = civilization === 'mali' ? 4 : 3;
              s.resources.gold += goldBonus;
            } else if (b.type === 'market') {
              s.resources.gold += 2;
            }
          });

          // Tax revenue
          const taxes = calculateTaxIncome(taxLevel, s.population.total);
          s.resources.gold += taxes;

          const hasForts = s.buildings.some(
            (b) => (b.type === 'wall' || b.type === 'tower') && b.owner === 'player'
          );

          const happiness = calculateHappiness(s.resources, s.population, taxLevel, hasForts, civilization);
          setHudHappiness(happiness.score);
          setHudHappinessSummary(happiness.summary);

          setHudResources({ ...s.resources });
          setHudPopulation({ ...s.population });
          setGameTime(Math.floor(s.gameTime));

          setObjectives((prev) =>
            prev.map((obj) => {
              if (obj.id === 'food') {
                return {
                  ...obj,
                  current: Math.floor(s.resources.food),
                  isCompleted: s.resources.food >= obj.target,
                };
              }
              if (obj.id === 'pop') {
                return {
                  ...obj,
                  current: s.population.total,
                  isCompleted: s.population.total >= obj.target,
                };
              }
              return obj;
            })
          );
        }

        // 2. Population Growth / Emigration Tick
        if (timestamp - s.lastGrowthTick > 12000 / gameSpeed) {
          s.lastGrowthTick = timestamp;
          const hasSpace = s.population.total < s.population.maxCapacity;

          if (hudHappiness >= 75 && hasSpace && s.resources.food > 15) {
            s.population.total += 1;
            s.population.available += 1;
            showToast('New settlers arrived at the royal compound!');
            sound.playHarvest('food');
          } else if (hudHappiness < 30 && s.population.total > 4) {
            s.population.total -= 1;
            s.population.available = Math.max(0, s.population.available - 1);
            showToast('Discontented villagers emigrated to a rival land.');
          }
        }

        // 3. Advance Construction
        s.buildings.forEach((b) => {
          if (!b.isConstructed) {
            const config = BUILDINGS[b.type];
            b.constructionProgress += dt / Math.max(1, config.buildTime);
            if (b.constructionProgress >= 1) {
              b.constructionProgress = 1;
              b.isConstructed = true;
              sound.playHarvest('gold');

              if (config.populationBonus) {
                s.population.maxCapacity += config.populationBonus;
              }

              for (let i = 0; i < 12; i++) {
                s.particles.push({
                  x: b.x + b.width * 0.5,
                  y: b.y + b.height * 0.5,
                  vx: (Math.random() - 0.5) * 1.5,
                  vy: (Math.random() - 0.5) * 1.5,
                  color: '#fbbf24',
                  alpha: 1,
                  life: 0,
                  maxLife: 1.2,
                  size: 3,
                });
              }
            }
          }
        });

        // 4. Units Simulation & Movement
        for (let i = s.units.length - 1; i >= 0; i--) {
          const u = s.units[i];

          if (u.hp <= 0) {
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                x: u.x,
                y: u.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: u.owner === 'player' ? '#38bdf8' : '#ef4444',
                alpha: 1,
                life: 0,
                maxLife: 0.8,
                size: 2.5,
              });
            }
            s.units.splice(i, 1);
            continue;
          }

          if (u.cooldownRemaining > 0) {
            u.cooldownRemaining = Math.max(0, u.cooldownRemaining - dt);
          }

          let targetX = u.targetX;
          let targetY = u.targetY;

          if (u.targetEntityId) {
            const targetUnit = s.units.find((other) => other.id === u.targetEntityId);
            const targetBuilding = s.buildings.find((b) => b.id === u.targetEntityId);

            if (targetUnit) {
              targetX = targetUnit.x;
              targetY = targetUnit.y;
            } else if (targetBuilding) {
              targetX = targetBuilding.x + targetBuilding.width * 0.5;
              targetY = targetBuilding.y + targetBuilding.height * 0.5;
            } else {
              u.targetEntityId = undefined;
              u.state = 'idle';
            }
          } else {
            const enemy = s.units.find(
              (other) =>
                other.owner !== u.owner &&
                Math.hypot(other.x - u.x, other.y - u.y) <= (u.type === 'archer' ? 5 : 2.5)
            );
            if (enemy) {
              u.targetEntityId = enemy.id;
              targetX = enemy.x;
              targetY = enemy.y;
            }
          }

          if (targetX !== undefined && targetY !== undefined) {
            const dx = targetX - u.x;
            const dy = targetY - u.y;
            const dist = Math.hypot(dx, dy);

            if (u.targetEntityId && dist <= u.range) {
              u.state = 'attacking';
              if (u.cooldownRemaining <= 0) {
                u.cooldownRemaining = UNITS[u.type].attackCooldown;

                const targetUnit = s.units.find((other) => other.id === u.targetEntityId);
                const targetBuilding = s.buildings.find((b) => b.id === u.targetEntityId);

                if (u.type === 'archer') {
                  sound.playArrowShoot();
                  s.projectiles.push({
                    id: `proj_${Date.now()}_${Math.random()}`,
                    startX: u.x,
                    startY: u.y,
                    targetX,
                    targetY,
                    currentX: u.x,
                    currentY: u.y,
                    progress: 0,
                    damage: u.damage,
                    targetId: u.targetEntityId,
                  });
                } else {
                  sound.playAttackStrike();
                  if (targetUnit) {
                    const dmg = calculateCombatDamage(u.damage, targetUnit.defense, u.type === 'cavalry');
                    targetUnit.hp -= dmg;
                    s.floatingTexts.push({
                      id: `dmg_${Date.now()}_${Math.random()}`,
                      text: `-${dmg}`,
                      x: targetUnit.x,
                      y: targetUnit.y - 0.5,
                      color: '#ef4444',
                      alpha: 1,
                      createdAt: performance.now(),
                    });
                  } else if (targetBuilding) {
                    targetBuilding.hp -= u.damage;
                    s.floatingTexts.push({
                      id: `dmg_${Date.now()}_${Math.random()}`,
                      text: `-${u.damage}`,
                      x: targetBuilding.x + targetBuilding.width * 0.5,
                      y: targetBuilding.y + targetBuilding.height * 0.5,
                      color: '#f97316',
                      alpha: 1,
                      createdAt: performance.now(),
                    });
                  }
                }
              }
            } else if (dist > 0.2) {
              u.state = 'moving';
              const moveDist = u.speed * dt;
              u.x += (dx / dist) * Math.min(dist, moveDist);
              u.y += (dy / dist) * Math.min(dist, moveDist);
            } else {
              u.state = 'idle';
              u.targetX = undefined;
              u.targetY = undefined;
            }
          } else {
            u.state = 'idle';
          }
        }

        // 5. Watchtower Firing
        s.buildings.forEach((b) => {
          if (b.type === 'tower' && b.isConstructed) {
            const towerX = b.x + 0.5;
            const towerY = b.y + 0.5;
            const enemy = s.units.find(
              (u) => u.owner !== b.owner && Math.hypot(u.x - towerX, u.y - towerY) <= 5.2
            );
            if (enemy && Math.random() < dt * 0.8) {
              sound.playArrowShoot();
              s.projectiles.push({
                id: `tower_arrow_${Date.now()}`,
                startX: towerX,
                startY: towerY,
                targetX: enemy.x,
                targetY: enemy.y,
                currentX: towerX,
                currentY: towerY,
                progress: 0,
                damage: 18,
                targetId: enemy.id,
              });
            }
          }
        });

        // 6. Projectiles
        for (let i = s.projectiles.length - 1; i >= 0; i--) {
          const p = s.projectiles[i];
          p.progress += dt * 3.5;
          p.currentX = p.startX + (p.targetX - p.startX) * p.progress;
          p.currentY = p.startY + (p.targetY - p.startY) * p.progress;

          if (p.progress >= 1) {
            const hitUnit = s.units.find((u) => u.id === p.targetId);
            const hitBuilding = s.buildings.find((b) => b.id === p.targetId);

            if (hitUnit) {
              hitUnit.hp -= p.damage;
              s.floatingTexts.push({
                id: `arrow_hit_${Date.now()}`,
                text: `-${p.damage}`,
                x: hitUnit.x,
                y: hitUnit.y - 0.5,
                color: '#ef4444',
                alpha: 1,
                createdAt: performance.now(),
              });
            } else if (hitBuilding) {
              hitBuilding.hp -= p.damage;
              s.floatingTexts.push({
                id: `arrow_hit_${Date.now()}`,
                text: `-${p.damage}`,
                x: hitBuilding.x + hitBuilding.width * 0.5,
                y: hitBuilding.y + hitBuilding.height * 0.5,
                color: '#f97316',
                alpha: 1,
                createdAt: performance.now(),
              });
            }
            s.projectiles.splice(i, 1);
          }
        }

        // 7. Rival AI
        if (timestamp - s.lastAiTick > 2000 / gameSpeed) {
          s.lastAiTick = timestamp;
          s.rival.raidTimer -= 2;

          if (s.rival.raidTimer <= 0) {
            s.rival.raidTimer = s.rival.raidInterval;
            s.rival.threatLevel = Math.min(5, s.rival.threatLevel + 1);

            const raidSize = s.rival.threatLevel * 2;
            const rivalBase = s.buildings.find((b) => b.id === 'rival_stronghold');
            const spawnRx = rivalBase ? rivalBase.x - 2 : MAP_WIDTH * 0.75;
            const spawnRy = rivalBase ? rivalBase.y - 2 : MAP_HEIGHT * 0.75;
            const playerCompound = s.buildings.find((b) => b.id === 'player_compound');
            const targetPx = playerCompound ? playerCompound.x + 1 : 18;
            const targetPy = playerCompound ? playerCompound.y + 1 : 18;

            for (let r = 0; r < raidSize; r++) {
              const isArcher = r % 2 === 1;
              s.units.push({
                id: `raider_${Date.now()}_${r}`,
                type: isArcher ? 'archer' : 'spearman',
                x: spawnRx + (Math.random() - 0.5) * 3,
                y: spawnRy + (Math.random() - 0.5) * 3,
                hp: isArcher ? 75 : 110,
                maxHp: isArcher ? 75 : 110,
                damage: isArcher ? 12 : 16,
                defense: 3,
                range: isArcher ? 4.8 : 1.1,
                speed: 2.1,
                cooldownRemaining: 0,
                owner: 'rival',
                state: 'moving',
                targetX: targetPx + (Math.random() - 0.5) * 4,
                targetY: targetPy + (Math.random() - 0.5) * 4,
                targetEntityId: 'player_compound',
              });
            }

            sound.playWarHorn();
            showToast('WAR HORN SOUNDS! A rival raiding host advances across the river!');
          }
        }

        // 8. Particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const pt = s.particles[i];
          pt.life += dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.alpha = 1 - pt.life / pt.maxLife;
          if (pt.life >= pt.maxLife) {
            s.particles.splice(i, 1);
          }
        }

        // 9. Floating Texts
        for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
          const ft = s.floatingTexts[i];
          ft.y -= dt * 0.8;
          ft.alpha -= dt * 0.7;
          if (ft.alpha <= 0) {
            s.floatingTexts.splice(i, 1);
          }
        }

        // 10. Win & Defeat check
        const rivalStronghold = s.buildings.find((b) => b.id === 'rival_stronghold');
        const playerCompound = s.buildings.find((b) => b.id === 'player_compound');

        if (rivalStronghold && checkVictory(rivalStronghold.hp)) {
          setGameState('victory');
          document.body.dataset.state = 'gameover';
          sound.playVictoryFanfare();
          setObjectives((prev) =>
            prev.map((obj) => (obj.id === 'rival' ? { ...obj, current: 1, isCompleted: true } : obj))
          );
        } else if (!playerCompound || checkDefeat(playerCompound.hp)) {
          setGameState('defeat');
          document.body.dataset.state = 'gameover';
          sound.playDefeatSting();
        }
      }

      // Render Frame with Viewport Culling & Multi-biome Terrain
      renderer.render(
        cameraRef.current,
        canvas.width,
        canvas.height,
        s.worldTiles,
        s.buildings,
        s.units,
        s.terrain,
        s.projectiles,
        s.particles,
        s.floatingTexts,
        s.selectedBuildingId,
        s.selectedUnitIds,
        s.placementPreview,
        MAP_WIDTH,
        MAP_HEIGHT
      );

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [civilization, gameSpeed, gameState, hudHappiness, showToast, taxLevel]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard Shortcuts (Space: pause, WASD/arrows: pan, Escape: cancel/deselect/pause, C: command mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        if (e.key === 'Escape') {
          if (placementMode) {
            cancelPlacement();
          } else if (
            simState.current.selectedUnitIds.length > 0 ||
            simState.current.selectedBuildingId !== null ||
            selectedResource !== null
          ) {
            clearSelection();
          } else {
            setGameState('paused');
          }
        } else if (e.key === ' ' || e.key === 'p') {
          setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        } else if (e.key === 'c' || e.key === 'C') {
          setCommandMode((prev) => (prev === 'command' ? 'inspect' : 'command'));
        } else if (e.key === 'w' || e.key === 'ArrowUp') {
          cameraRef.current.y -= 25;
        } else if (e.key === 's' || e.key === 'ArrowDown') {
          cameraRef.current.y += 25;
        } else if (e.key === 'a' || e.key === 'ArrowLeft') {
          cameraRef.current.x -= 25;
        } else if (e.key === 'd' || e.key === 'ArrowRight') {
          cameraRef.current.x += 25;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelPlacement, clearSelection, gameState, placementMode, selectedResource, setCommandMode]);

  // ----------------------------------------------------
  // Robust Pointer Handling: Hit-Testing, Click vs Drag, Right-Click Orders, Selection/Deselection
  // ----------------------------------------------------
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = simState.current;
    s.isInteracting = true;
    s.pointerDownButton = e.button;
    s.panStart = { x: e.clientX, y: e.clientY };
    s.cameraStart = { x: cameraRef.current.x, y: cameraRef.current.y };
    s.hasMovedPastDragThreshold = false;
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const s = simState.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (s.isInteracting) {
        const dx = e.clientX - s.panStart.x;
        const dy = e.clientY - s.panStart.y;
        if (Math.hypot(dx, dy) > 8) {
          s.hasMovedPastDragThreshold = true;
        }

        // Camera Pan
        cameraRef.current.x = s.cameraStart.x - dx / cameraRef.current.zoom;
        cameraRef.current.y = s.cameraStart.y - dy / cameraRef.current.zoom;
      }

      // Placement preview
      if (placementMode) {
        const tile = screenToTile(
          e.clientX,
          e.clientY,
          cameraRef.current,
          canvas.width,
          canvas.height
        );
        const config = BUILDINGS[placementMode];
        const valid = checkPlacementCollision(
          tile.x,
          tile.y,
          config.width,
          config.height,
          s.buildings,
          MAP_WIDTH,
          MAP_HEIGHT,
          s.blockedTiles
        );
        s.placementPreview = { type: placementMode, x: tile.x, y: tile.y, valid };
      }
    },
    [placementMode]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const s = simState.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const wasDragging = s.hasMovedPastDragThreshold;
      s.isInteracting = false;

      // If user was panning the camera, do NOT trigger clicks or orders!
      if (wasDragging) {
        return;
      }

      const worldPos = screenToWorld(
        e.clientX,
        e.clientY,
        cameraRef.current,
        canvas.width,
        canvas.height
      );
      const tilePos = screenToTile(
        e.clientX,
        e.clientY,
        cameraRef.current,
        canvas.width,
        canvas.height
      );

      // Handle Building Placement Confirmation
      if (placementMode) {
        confirmPlacement(tilePos.x, tilePos.y);
        return;
      }

      // Handle Right-Click Order on Desktop (button === 2)
      if (e.button === 2) {
        if (s.selectedUnitIds.length > 0) {
          const hit = findClickedEntity(
            worldPos.x,
            worldPos.y,
            tilePos.x,
            tilePos.y,
            s.units,
            s.buildings,
            s.terrain
          );
          if (hit.type === 'unit' && hit.entity && (hit.entity as GameUnit).owner !== 'player') {
            orderSelectedUnits(tilePos.x, tilePos.y, (hit.entity as GameUnit).id);
            showToast('Assault command dispatched!');
          } else if (
            hit.type === 'building' &&
            hit.entity &&
            (hit.entity as PlacedBuilding).owner !== 'player'
          ) {
            orderSelectedUnits(tilePos.x, tilePos.y, (hit.entity as PlacedBuilding).id);
            showToast('Assault command against enemy stronghold!');
          } else {
            orderSelectedUnits(tilePos.x, tilePos.y);
            showToast('Warriors marching to position.');
          }
        }
        return;
      }

      // Left Click / Touch Tap:
      // Accurate entity hit testing across upright sprites and isometric bases
      const hit = findClickedEntity(
        worldPos.x,
        worldPos.y,
        tilePos.x,
        tilePos.y,
        s.units,
        s.buildings,
        s.terrain
      );

      // If in Mobile Command Mode and units are selected:
      if (commandMode === 'command' && s.selectedUnitIds.length > 0) {
        if (hit.type === 'unit' && hit.entity && (hit.entity as GameUnit).owner !== 'player') {
          orderSelectedUnits(tilePos.x, tilePos.y, (hit.entity as GameUnit).id);
          showToast('Attack order commanded!');
        } else if (
          hit.type === 'building' &&
          hit.entity &&
          (hit.entity as PlacedBuilding).owner !== 'player'
        ) {
          orderSelectedUnits(tilePos.x, tilePos.y, (hit.entity as PlacedBuilding).id);
          showToast('Assault order commanded!');
        } else {
          orderSelectedUnits(tilePos.x, tilePos.y);
        }
        return;
      }

      // Selection & Inspection Mode
      if (hit.type === 'unit' && hit.entity) {
        const u = hit.entity as GameUnit;
        s.selectedUnitIds = [u.id];
        s.selectedBuildingId = null;
        setSelectedUnits([u]);
        setSelectedBuilding(null);
        setSelectedResource(null);
        sound.playUnitOrder();
      } else if (hit.type === 'building' && hit.entity) {
        const b = hit.entity as PlacedBuilding;
        s.selectedBuildingId = b.id;
        s.selectedUnitIds = [];
        setSelectedBuilding(b);
        setSelectedUnits([]);
        setSelectedResource(null);
        sound.playDjembeSlap();
      } else if (hit.type === 'resource' && hit.entity) {
        const res = hit.entity as TerrainResource;
        s.selectedBuildingId = null;
        s.selectedUnitIds = [];
        setSelectedBuilding(null);
        setSelectedUnits([]);
        setSelectedResource(res);
        showToast(
          `Inspecting: Natural ${res.type === 'tree' ? 'Acacia Grove' : res.type === 'rock' ? 'Granite Rock' : 'Gold Vein'} (${res.amount} left)`
        );
      } else {
        // Genuine Empty Walkable Terrain Clicked -> CLEAR SELECTION!
        s.selectedBuildingId = null;
        s.selectedUnitIds = [];
        setSelectedBuilding(null);
        setSelectedUnits([]);
        setSelectedResource(null);
      }
    },
    [commandMode, confirmPlacement, orderSelectedUnits, placementMode, showToast]
  );

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default browser context menu for RTS controls
  }, []);

  const zoomIn = () => {
    cameraRef.current.zoom = Math.min(2.0, cameraRef.current.zoom + 0.2);
  };

  const zoomOut = () => {
    cameraRef.current.zoom = Math.max(0.55, cameraRef.current.zoom - 0.2);
  };

  return {
    gameState,
    setGameState,
    civilization,
    setCivilization,
    taxLevel,
    setTaxLevel,
    worldSeed,
    setWorldSeed,
    resources: hudResources,
    population: hudPopulation,
    happiness: hudHappiness,
    happinessSummary: hudHappinessSummary,
    gameSpeed,
    setGameSpeed,
    gameTime,
    objectives,
    selectedBuilding,
    selectedUnits,
    selectedResource,
    commandMode,
    setCommandMode,
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
    clearSelection,
    centerOnCompound,
    zoomIn,
    zoomOut,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onContextMenu,
  };
}
