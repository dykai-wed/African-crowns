// AFRICAN CROWNS: EMPIRES OF THE SUN
// Procedural Continuous World Generation (Deterministic Multi-Layer Biomes & Rivers)

import { PlacedBuilding, TerrainResource } from './types';

export type BiomeType =
  | 'desert'
  | 'sahel'
  | 'savanna'
  | 'woodland'
  | 'rainforest'
  | 'highland'
  | 'river'
  | 'river_ford'
  | 'wetland';

export interface WorldTile {
  x: number;
  y: number;
  elevation: number; // 0 to 1
  moisture: number; // 0 to 1
  fertility: number; // 0 to 1
  biome: BiomeType;
  isWater: boolean;
  isPassable: boolean;
  color: string;
}

export interface GeneratedWorld {
  width: number;
  height: number;
  seed: number;
  seedString: string;
  tiles: WorldTile[][];
  terrainResources: TerrainResource[];
  riverTiles: Set<string>;
  fordTiles: Set<string>;
  blockedTiles: Set<string>;
  playerSpawn: { x: number; y: number };
  rivalSpawn: { x: number; y: number };
}

// Deterministic PRNG: Mulberry32
export function createRng(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash === 0 ? 1337 : hash;
}

// 2D Value Noise with Bicubic/Cosine smoothing
function smoothNoise(x: number, y: number, seed: number): number {
  const n = (Math.sin(x * 12.9898 + y * 78.233 + seed * 0.123) * 43758.5453) % 1;
  return n < 0 ? n + 1 : n;
}

function interpolatedNoise(x: number, y: number, seed: number): number {
  const intX = Math.floor(x);
  const fracX = x - intX;
  const intY = Math.floor(y);
  const fracY = y - intY;

  // Cosine interpolation
  const sx = (1 - Math.cos(fracX * Math.PI)) * 0.5;
  const sy = (1 - Math.cos(fracY * Math.PI)) * 0.5;

  const v1 = smoothNoise(intX, intY, seed);
  const v2 = smoothNoise(intX + 1, intY, seed);
  const v3 = smoothNoise(intX, intY + 1, seed);
  const v4 = smoothNoise(intX + 1, intY + 1, seed);

  const i1 = v1 * (1 - sx) + v2 * sx;
  const i2 = v3 * (1 - sx) + v4 * sx;

  return i1 * (1 - sy) + i2 * sy;
}

// Fractal Brownian Motion (fBM) Octaves
export function fbm(
  x: number,
  y: number,
  seed: number,
  octaves: number = 4,
  lacunarity: number = 2.0,
  gain: number = 0.5
): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += interpolatedNoise(x * frequency, y * frequency, seed + i * 31) * amplitude;
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

// African Biome Palettes
export const BIOME_COLORS: Record<BiomeType, string> = {
  desert: '#d4a373', // Sahara ochre sand
  sahel: '#b08968', // Sahel dry clay & thornveld
  savanna: '#c59b27', // Golden Serengeti grasses
  woodland: '#7f8a32', // Acacia & Baobab woodland
  rainforest: '#2d6a4f', // Deep West African rainforest
  highland: '#8d7b68', // Granite rocky outcrop
  river: '#1e6091', // Living river water
  river_ford: '#4895ef', // Shallow passable ford
  wetland: '#52796f', // Delta marsh
};

export function classifyBiome(
  elevation: number,
  moisture: number,
  isRiver: boolean,
  isFord: boolean
): BiomeType {
  if (isRiver) {
    return isFord ? 'river_ford' : 'river';
  }
  if (elevation > 0.72) {
    return 'highland';
  }
  if (moisture > 0.75 && elevation < 0.35) {
    return 'wetland';
  }
  if (moisture < 0.28) {
    return 'desert';
  }
  if (moisture < 0.45) {
    return 'sahel';
  }
  if (moisture < 0.65) {
    return 'savanna';
  }
  if (moisture < 0.82) {
    return 'woodland';
  }
  return 'rainforest';
}

export interface GenerateWorldOptions {
  width?: number; // default 72 (4x original continuous area)
  height?: number; // default 72
  seedString?: string;
}

export function generateContinuousWorld(options: GenerateWorldOptions = {}): GeneratedWorld {
  const width = options.width || 72;
  const height = options.height || 72;
  const seedString = options.seedString || 'SUNDIATA_MANSA_1324';
  const seed = stringToSeed(seedString);
  const rng = createRng(seed);

  const tiles: WorldTile[][] = [];
  const riverTiles = new Set<string>();
  const fordTiles = new Set<string>();
  const blockedTiles = new Set<string>();
  const terrainResources: TerrainResource[] = [];

  // 1. Generate River Course (Natural Meandering River across continent)
  // River flows across the middle of the continent with natural oxbows
  const riverCenterY = Math.floor(height * 0.48);
  const fordX1 = Math.floor(width * 0.35);
  const fordX2 = Math.floor(width * 0.65);

  for (let x = 0; x < width; x++) {
    // Continuous Sine Wave with secondary harmonic for natural curves
    const wave =
      Math.sin(x * 0.09 + seed * 0.05) * 5.5 +
      Math.sin(x * 0.22 + seed * 0.02) * 2.5;
    const yCenter = Math.floor(riverCenterY + wave);

    // River width = 2-3 tiles
    for (let dy = -1; dy <= 1; dy++) {
      const y = yCenter + dy;
      if (y >= 0 && y < height) {
        const key = `${x},${y}`;
        // Create natural shallow fords that are passable by units
        const isFord = (x >= fordX1 - 1 && x <= fordX1 + 1) || (x >= fordX2 - 1 && x <= fordX2 + 1);
        if (isFord) {
          fordTiles.add(key);
        } else {
          riverTiles.add(key);
          blockedTiles.add(key); // Deep water blocks movement and construction
        }
      }
    }
  }

  // 2. Generate Elevation, Moisture & Biomes
  for (let x = 0; x < width; x++) {
    tiles[x] = [];
    for (let y = 0; y < height; y++) {
      const key = `${x},${y}`;
      const isRiver = riverTiles.has(key);
      const isFord = fordTiles.has(key);

      // Elevation: Continental slope (highlands in north-east, river valley in center, lowlands in south)
      const nx = x / width;
      const ny = y / height;
      const elevBase = fbm(nx * 3.5, ny * 3.5, seed, 4);
      const elevation = Math.max(0, Math.min(1, elevBase * 0.75 + (nx * 0.25)));

      // Moisture: Arid in North (Sahara/Sahel) -> Wetter in South (Savanna/Forest) + River Proximity
      const moistBase = fbm(nx * 3.2, ny * 3.2, seed + 100, 4);
      // Distance to nearest river tile increases fertility & moisture
      const distToRiver = Math.abs(y - (riverCenterY + Math.sin(x * 0.09) * 5.5));
      const riverMoistureBonus = Math.max(0, 1 - distToRiver / 6) * 0.45;
      const moisture = Math.max(0, Math.min(1, moistBase * 0.55 + ny * 0.35 + riverMoistureBonus));

      const fertility = Math.max(0, Math.min(1, moisture * 0.7 + (1 - elevation) * 0.3));
      const biome = classifyBiome(elevation, moisture, isRiver, isFord);
      const isWater = isRiver || isFord;
      const isPassable = !isRiver; // Ford is passable, river is blocked

      tiles[x][y] = {
        x,
        y,
        elevation,
        moisture,
        fertility,
        biome,
        isWater,
        isPassable,
        color: BIOME_COLORS[biome],
      };
    }
  }

  // 3. Determine Guaranteed Viable Player Spawn Location
  // Player spawns south-west of river on flat, buildable savannah/sahel with fertile soil
  const playerSpawn = {
    x: Math.floor(width * 0.22),
    y: Math.floor(height * 0.25),
  };

  // Rival settlement placed across the river in distant north-east territory
  const rivalSpawn = {
    x: Math.floor(width * 0.76),
    y: Math.floor(height * 0.75),
  };

  // Clear player starting compound footprint (6x6 area around spawn)
  const reservedKeys = new Set<string>();
  for (let dx = -3; dx <= 5; dx++) {
    for (let dy = -3; dy <= 5; dy++) {
      reservedKeys.add(`${playerSpawn.x + dx},${playerSpawn.y + dy}`);
      reservedKeys.add(`${rivalSpawn.x + dx},${rivalSpawn.y + dy}`);
    }
  }

  // 4. Guaranteed Starter Resources for Player Spawn
  // Essential timber grove (Acacia/Baobab)
  const starterTrees = [
    { dx: -4, dy: -2 },
    { dx: -5, dy: -2 },
    { dx: -4, dy: -3 },
    { dx: 4, dy: -3 },
    { dx: 5, dy: -3 },
    { dx: 4, dy: -4 },
  ];
  starterTrees.forEach(({ dx, dy }, idx) => {
    const tx = playerSpawn.x + dx;
    const ty = playerSpawn.y + dy;
    terrainResources.push({
      id: `starter_tree_${idx}`,
      type: 'tree',
      x: tx,
      y: ty,
      amount: 250,
      maxAmount: 250,
    });
    blockedTiles.add(`${tx},${ty}`);
  });

  // Essential starter stone rock
  const starterRocks = [
    { dx: 6, dy: 4 },
    { dx: 6, dy: 5 },
    { dx: 7, dy: 5 },
  ];
  starterRocks.forEach(({ dx, dy }, idx) => {
    const rx = playerSpawn.x + dx;
    const ry = playerSpawn.y + dy;
    terrainResources.push({
      id: `starter_rock_${idx}`,
      type: 'rock',
      x: rx,
      y: ry,
      amount: 350,
      maxAmount: 350,
    });
    blockedTiles.add(`${rx},${ry}`);
  });

  // Starter gold vein nearby
  const gx = playerSpawn.x - 5;
  const gy = playerSpawn.y + 4;
  terrainResources.push({
    id: 'starter_gold_1',
    type: 'gold_vein',
    x: gx,
    y: gy,
    amount: 500,
    maxAmount: 500,
  });
  blockedTiles.add(`${gx},${gy}`);

  // 5. Procedurally Distribute Biome-Aware Natural Resources across the World
  let resId = 0;
  for (let x = 2; x < width - 2; x++) {
    for (let y = 2; y < height - 2; y++) {
      const key = `${x},${y}`;
      if (reservedKeys.has(key) || blockedTiles.has(key) || riverTiles.has(key)) {
        continue;
      }

      const tile = tiles[x][y];
      const rVal = rng();

      // Trees: dense in woodland and rainforest, moderate in savanna, sparse in sahel/desert
      let treeChance = 0.02;
      if (tile.biome === 'woodland') treeChance = 0.22;
      if (tile.biome === 'rainforest') treeChance = 0.35;
      if (tile.biome === 'savanna') treeChance = 0.09;
      if (tile.biome === 'sahel') treeChance = 0.04;
      if (tile.biome === 'desert') treeChance = 0.005;

      if (rVal < treeChance) {
        terrainResources.push({
          id: `tree_${resId++}`,
          type: 'tree',
          x,
          y,
          amount: 200,
          maxAmount: 200,
        });
        blockedTiles.add(key);
        continue;
      }

      // Stone rocks: frequent in highlands and foothills
      let rockChance = 0.01;
      if (tile.biome === 'highland') rockChance = 0.20;
      if (tile.elevation > 0.6) rockChance = 0.08;

      if (rVal > 1 - rockChance) {
        terrainResources.push({
          id: `rock_${resId++}`,
          type: 'rock',
          x,
          y,
          amount: 300,
          maxAmount: 300,
        });
        blockedTiles.add(key);
        continue;
      }

      // Gold veins: strategically clustered in ancient ridges & highlands
      if (tile.biome === 'highland' || (tile.elevation > 0.65 && tile.moisture < 0.4)) {
        if (rVal > 0.985) {
          terrainResources.push({
            id: `gold_${resId++}`,
            type: 'gold_vein',
            x,
            y,
            amount: 450,
            maxAmount: 450,
          });
          blockedTiles.add(key);
        }
      }
    }
  }

  return {
    width,
    height,
    seed,
    seedString,
    tiles,
    terrainResources,
    riverTiles,
    fordTiles,
    blockedTiles,
    playerSpawn,
    rivalSpawn,
  };
}
