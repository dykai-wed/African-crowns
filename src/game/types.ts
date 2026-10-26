// AFRICAN CROWNS: EMPIRES OF THE SUN
// Core Types and Data Contracts

export type CivilizationId = 'mali' | 'benin' | 'egypt';

export type TaxLevel = 'low' | 'moderate' | 'high' | 'tribute';

export type GameState = 'title' | 'playing' | 'paused' | 'victory' | 'defeat';

export interface Resources {
  food: number;
  timber: number;
  stone: number;
  gold: number;
}

export interface Population {
  total: number;
  available: number;
  farmers: number;
  lumberjacks: number;
  miners: number;
  builders: number;
  soldiers: number;
  maxCapacity: number;
}

export interface HappinessBreakdown {
  score: number; // 0 to 100
  foodFactor: number;
  taxFactor: number;
  housingFactor: number;
  securityFactor: number;
  summary: string;
}

export type BuildingType =
  | 'compound'
  | 'house'
  | 'farm'
  | 'granary'
  | 'lumber_camp'
  | 'quarry'
  | 'gold_mine'
  | 'market'
  | 'wall'
  | 'gate'
  | 'tower'
  | 'barracks';

export interface BuildingCost {
  timber: number;
  stone: number;
  gold: number;
}

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  category: 'residential' | 'food' | 'resource' | 'economy' | 'defense' | 'civic';
  cost: BuildingCost;
  width: number;
  height: number;
  maxHp: number;
  buildTime: number; // in seconds
  description: string;
  historicalNote: string;
  workerCapacity?: number;
  populationBonus?: number;
}

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  x: number; // tile coordinates
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  isConstructed: boolean;
  constructionProgress: number; // 0 to 1
  assignedWorkers: number;
  owner: 'player' | 'rival';
  lastProducedAt?: number;
}

export type UnitType = 'spearman' | 'archer' | 'cavalry' | 'villager';

export interface UnitConfig {
  type: UnitType;
  name: string;
  cost: { food: number; timber: number; gold: number };
  maxHp: number;
  damage: number;
  defense: number;
  range: number; // in tile units
  speed: number; // tiles per second
  attackCooldown: number; // seconds
  trainTime: number; // seconds
  description: string;
  role: string;
}

export interface GameUnit {
  id: string;
  type: UnitType;
  x: number; // continuous world/tile coordinates
  y: number;
  targetX?: number;
  targetY?: number;
  targetEntityId?: string; // target building or unit
  hp: number;
  maxHp: number;
  damage: number;
  defense: number;
  range: number;
  speed: number;
  cooldownRemaining: number;
  owner: 'player' | 'rival';
  role?: string;
  state: 'idle' | 'moving' | 'attacking' | 'harvesting';
  facingAngle?: number;
  lastHitTime?: number;
}

export interface TerrainResource {
  id: string;
  type: 'tree' | 'rock' | 'gold_vein' | 'water';
  x: number;
  y: number;
  amount: number;
  maxAmount: number;
}

export interface Projectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  progress: number; // 0 to 1
  damage: number;
  targetId: string;
}

export interface GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  createdAt: number;
}

export interface CampaignObjective {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  isCompleted: boolean;
}

export interface RivalState {
  aiState: 'gathering' | 'fortifying' | 'training' | 'raiding' | 'sieging';
  resources: Resources;
  raidTimer: number; // seconds until next raid
  raidInterval: number;
  threatLevel: number; // 1 to 5
  strongholdHp: number;
  strongholdMaxHp: number;
}

export interface GameSaveData {
  version: number;
  timestamp: number;
  civilization: CivilizationId;
  resources: Resources;
  population: Population;
  taxLevel: TaxLevel;
  buildings: PlacedBuilding[];
  units: GameUnit[];
  terrainResources: TerrainResource[];
  objectives: CampaignObjective[];
  rival: RivalState;
  gameTime: number;
}
