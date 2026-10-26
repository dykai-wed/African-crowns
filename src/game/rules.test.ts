// Unit tests for African Crowns core logic
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAfford,
  deductResources,
  calculateFoodConsumption,
  calculateTaxIncome,
  calculateHappiness,
  checkPlacementCollision,
  calculateCombatDamage,
  checkVictory,
  checkDefeat,
} from './rules';
import { GameUnit, PlacedBuilding, Population, Resources, TerrainResource } from './types';
import { generateContinuousWorld } from './worldGen';
import { findClickedEntity } from './selection';
import { tileToWorld } from './canvasRenderer';
import { MAP_WIDTH, MAP_HEIGHT } from './constants';

test('canAfford accurately checks resource thresholds', () => {
  const current: Resources = { food: 50, timber: 30, stone: 15, gold: 20 };
  assert.equal(canAfford(current, { timber: 20, stone: 10, gold: 15 }), true);
  assert.equal(canAfford(current, { timber: 35, stone: 5, gold: 10 }), false);
  assert.equal(canAfford(current, { timber: 10, stone: 20, gold: 5 }), false);
});

test('deductResources decreases stocks without mutating negative values', () => {
  const current: Resources = { food: 50, timber: 30, stone: 15, gold: 20 };
  const next = deductResources(current, { timber: 10, stone: 5, gold: 15 });
  assert.equal(next.timber, 20);
  assert.equal(next.stone, 10);
  assert.equal(next.gold, 5);
  assert.equal(next.food, 50); // food remains untouched
});

test('calculateFoodConsumption scales with population', () => {
  assert.equal(calculateFoodConsumption(10), 2.0);
  assert.equal(calculateFoodConsumption(5), 1.0);
  assert.equal(calculateFoodConsumption(0), 0);
});

test('calculateTaxIncome increases with higher tax brackets', () => {
  const pop = 20;
  const lowTax = calculateTaxIncome('low', pop);
  const modTax = calculateTaxIncome('moderate', pop);
  const highTax = calculateTaxIncome('high', pop);
  const tributeTax = calculateTaxIncome('tribute', pop);

  assert.ok(lowTax < modTax, 'Low tax should yield less than moderate');
  assert.ok(modTax < highTax, 'Moderate tax should yield less than high');
  assert.ok(highTax < tributeTax, 'High tax should yield less than royal tribute');
});

test('calculateHappiness drops in famine and surges with food and low tax', () => {
  const starvedRes: Resources = { food: 0, timber: 20, stone: 20, gold: 20 };
  const pop: Population = {
    total: 10,
    available: 5,
    farmers: 2,
    lumberjacks: 1,
    miners: 1,
    builders: 1,
    soldiers: 0,
    maxCapacity: 15,
  };
  const famineState = calculateHappiness(starvedRes, pop, 'tribute', false, 'mali');
  assert.ok(famineState.score < 40, `Famine score should be low, got ${famineState.score}`);

  const prosperousRes: Resources = { food: 100, timber: 50, stone: 50, gold: 100 };
  const happyState = calculateHappiness(prosperousRes, pop, 'low', true, 'mali');
  assert.ok(happyState.score > 80, `Prosperous score should be high, got ${happyState.score}`);
});

test('checkPlacementCollision rejects out-of-bounds or overlapping placements', () => {
  const existing: PlacedBuilding[] = [
    {
      id: 'b1',
      type: 'compound',
      x: 10,
      y: 10,
      width: 3,
      height: 3,
      hp: 1000,
      maxHp: 1000,
      isConstructed: true,
      constructionProgress: 1,
      assignedWorkers: 0,
      owner: 'player',
    },
  ];

  // Overlapping
  assert.equal(checkPlacementCollision(11, 11, 2, 2, existing, 36, 36), false);
  // Free space
  assert.equal(checkPlacementCollision(15, 15, 2, 2, existing, 36, 36), true);
  // Out of bounds
  assert.equal(checkPlacementCollision(0, 0, 2, 2, existing, 36, 36), false);
  assert.equal(checkPlacementCollision(35, 35, 2, 2, existing, 36, 36), false);
});

test('calculateCombatDamage accounts for defense and spearmen resistance', () => {
  const dmg = calculateCombatDamage(20, 5, false);
  assert.equal(dmg, 15);

  const cavalryVsSpear = calculateCombatDamage(20, 5, true);
  assert.equal(cavalryVsSpear, 9); // reduced damage by 40%
});

test('checkVictory and checkDefeat detect critical HP state', () => {
  assert.equal(checkVictory(0), true);
  assert.equal(checkVictory(50), false);

  assert.equal(checkDefeat(0), true);
  assert.equal(checkDefeat(100), false);
});

test('generateContinuousWorld generates 72x72 map deterministically', () => {
  const world1 = generateContinuousWorld({ width: MAP_WIDTH, height: MAP_HEIGHT, seedString: 'mali_kingdom_123' });
  const world2 = generateContinuousWorld({ width: MAP_WIDTH, height: MAP_HEIGHT, seedString: 'mali_kingdom_123' });
  const world3 = generateContinuousWorld({ width: MAP_WIDTH, height: MAP_HEIGHT, seedString: 'songhai_empire_456' });

  // Verify dimensions (72x72 = 5,184 tiles)
  assert.equal(world1.width, 72);
  assert.equal(world1.height, 72);
  assert.equal(world1.tiles.length, 72);
  assert.equal(world1.tiles[0].length, 72);

  // Determinism check: identical seeds yield identical spawns, river tiles, and biomes
  assert.deepEqual(world1.playerSpawn, world2.playerSpawn);
  assert.deepEqual(world1.rivalSpawn, world2.rivalSpawn);
  assert.equal(world1.riverTiles.size, world2.riverTiles.size);
  assert.equal(world1.fordTiles.size, world2.fordTiles.size);
  assert.equal(world1.tiles[20][20].biome, world2.tiles[20][20].biome);

  // Variation check: different seeds produce different seeds and geography
  assert.notEqual(world1.seed, world3.seed);
  assert.ok(world1.fordTiles.size > 0, 'World must include shallow river fords');
});

test('generateContinuousWorld provides guaranteed viable starting resources near player spawn', () => {
  const world = generateContinuousWorld({ width: MAP_WIDTH, height: MAP_HEIGHT, seedString: 'benin_bronze_789' });
  const px = world.playerSpawn.x;
  const py = world.playerSpawn.y;

  // Check nearby resources within 12 tiles
  const nearby = world.terrainResources.filter((r) => {
    const dist = Math.hypot(r.x - px, r.y - py);
    return dist <= 12;
  });

  const hasTrees = nearby.some((r) => r.type === 'tree');
  const hasRocks = nearby.some((r) => r.type === 'rock');
  const hasGold = nearby.some((r) => r.type === 'gold_vein');

  assert.ok(hasTrees, 'Player must have timber trees near spawn');
  assert.ok(hasRocks, 'Player must have stone rocks near spawn');
  assert.ok(hasGold, 'Player must have gold deposit near spawn');

  // Check player compound footprint is unblocked
  const playerCompoundKey = `${px},${py}`;
  assert.equal(world.blockedTiles.has(playerCompoundKey), false, 'Spawn point must not be blocked by river or rock');
});

test('findClickedEntity selects foreground unit over background building when sprites overlap', () => {
  // Building at tile (10, 10), 3x3 footprint
  const building: PlacedBuilding = {
    id: 'barracks_1',
    type: 'barracks',
    x: 10,
    y: 10,
    width: 3,
    height: 3,
    hp: 400,
    maxHp: 400,
    isConstructed: true,
    constructionProgress: 1,
    assignedWorkers: 0,
    owner: 'player',
  };

  // Unit standing in front of building at tile (12, 12)
  const foregroundUnit: GameUnit = {
    id: 'warrior_front',
    type: 'spearman',
    x: 12,
    y: 12,
    hp: 120,
    maxHp: 120,
    damage: 14,
    defense: 6,
    range: 1.2,
    speed: 2.2,
    cooldownRemaining: 0,
    owner: 'player',
    state: 'idle',
  };

  const { x: unitWx, y: unitWy } = tileToWorld(12, 12);
  // Click on the unit's upright chest (slightly above ground)
  const clickWx = unitWx;
  const clickWy = unitWy - 15;

  const hit = findClickedEntity(
    clickWx,
    clickWy,
    12,
    12,
    [foregroundUnit],
    [building],
    []
  );

  assert.equal(hit.type, 'unit', 'Foreground unit should be selected over background building');
  assert.equal((hit.entity as GameUnit)?.id, 'warrior_front');
});

test('findClickedEntity returns ground on empty terrain allowing clean deselection', () => {
  const hit = findClickedEntity(
    9999,
    9999,
    50,
    50,
    [],
    [],
    []
  );

  assert.equal(hit.type, 'ground');
  assert.equal(hit.entity, undefined);
});

test('drag-pan distance threshold (> 8px) differentiates map pan from deliberate tap', () => {
  const isPan = (dx: number, dy: number) => Math.hypot(dx, dy) > 8;

  // Small pointer jitter during tap
  assert.equal(isPan(2, 3), false, 'Tiny jitter <= 8px should register as tap/click');
  assert.equal(isPan(0, 0), false, 'Zero movement is tap');
  assert.equal(isPan(5, 5), false, 'Movement under 8px is tap');

  // Intentional camera drag
  assert.equal(isPan(10, 0), true, '10px drag is camera pan');
  assert.equal(isPan(6, 7), true, 'Hypot(6, 7) ~ 9.2px is camera pan');
  assert.equal(isPan(50, 40), true, 'Large drag is camera pan');
});

