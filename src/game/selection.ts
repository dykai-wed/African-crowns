// AFRICAN CROWNS: EMPIRES OF THE SUN
// Entity Hit-Testing, Selection & Command Logic

import { tileToWorld } from './canvasRenderer';
import { BUILDINGS } from './constants';
import { GameUnit, PlacedBuilding, TerrainResource } from './types';

export interface HitResult {
  type: 'unit' | 'building' | 'resource' | 'ground';
  entity?: GameUnit | PlacedBuilding | TerrainResource;
  tileX: number;
  tileY: number;
}

export function findClickedEntity(
  worldX: number,
  worldY: number,
  tileX: number,
  tileY: number,
  units: GameUnit[],
  buildings: PlacedBuilding[],
  terrainResources: TerrainResource[]
): HitResult {
  // 1. Check Units first (Foreground entities)
  // Sort by depth descending so topmost/foreground unit is tested first
  const sortedUnits = [...units].sort((a, b) => (b.x + b.y) - (a.x + a.y));

  for (const u of sortedUnits) {
    const { x: gx, y: gy } = tileToWorld(u.x, u.y);
    // Unit vertical sprite bounding box: width 24px, height 36px upright
    const minX = gx - 14;
    const maxX = gx + 14;
    const minY = gy - 34; // extends up to head
    const maxY = gy + 8; // base shadow

    if (worldX >= minX && worldX <= maxX && worldY >= minY && worldY <= maxY) {
      return { type: 'unit', entity: u, tileX, tileY };
    }
  }

  // 2. Check Buildings (Sorted by depth descending)
  const sortedBuildings = [...buildings].sort(
    (a, b) => (b.x + b.width * 0.5 + b.y + b.height * 0.5) - (a.x + a.width * 0.5 + a.y + a.height * 0.5)
  );

  for (const b of sortedBuildings) {
    const bConfig = BUILDINGS[b.type];
    const { x: gx, y: gy } = tileToWorld(b.x + b.width * 0.5, b.y + b.height * 0.5);

    // Height of building sprite upright
    const spriteHeight = b.type === 'compound' ? 68 : b.type === 'tower' ? 58 : 42;
    const halfW = b.width * 18;

    // Check upright building bounding box + isometric base
    const minX = gx - halfW;
    const maxX = gx + halfW;
    const minY = gy - spriteHeight;
    const maxY = gy + b.height * 10;

    // Direct tile containment or upright sprite hit
    const insideTile =
      tileX >= b.x &&
      tileX < b.x + b.width &&
      tileY >= b.y &&
      tileY < b.y + b.height;

    const insideSprite =
      worldX >= minX && worldX <= maxX && worldY >= minY && worldY <= maxY;

    if (insideTile || insideSprite) {
      return { type: 'building', entity: b, tileX, tileY };
    }
  }

  // 3. Check Terrain Resources (Trees, Rocks, Gold veins)
  for (const res of terrainResources) {
    const { x: gx, y: gy } = tileToWorld(res.x + 0.5, res.y + 0.5);
    const spriteH = res.type === 'tree' ? 32 : 16;
    if (
      worldX >= gx - 16 &&
      worldX <= gx + 16 &&
      worldY >= gy - spriteH &&
      worldY <= gy + 8
    ) {
      return { type: 'resource', entity: res, tileX, tileY };
    }
  }

  // 4. Fallback: Genuine Empty Ground
  return { type: 'ground', tileX, tileY };
}
