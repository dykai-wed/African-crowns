// AFRICAN CROWNS: EMPIRES OF THE SUN
// High-Performance 2.5D Volumetric Isometric Canvas Renderer
// Phase 1: Visual Foundation — Sahelian Earthen Architecture, Directional Sunlight & Cast Shadows

import { BUILDINGS, TILE_SIZE, UNITS } from './constants';
import {
  FloatingText,
  GameParticle,
  GameUnit,
  PlacedBuilding,
  Projectile,
  TerrainResource,
} from './types';
import { WorldTile } from './worldGen';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

// Convert tile coordinates (tx, ty) to 2D isometric world coordinates (screen plane)
export function tileToWorld(tx: number, ty: number): { x: number; y: number } {
  const x = (tx - ty) * (TILE_SIZE * 0.5);
  const y = (tx + ty) * (TILE_SIZE * 0.25);
  return { x, y };
}

// Convert screen coordinates back to tile coordinates
export function screenToTile(
  screenX: number,
  screenY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const worldX = (screenX - canvasWidth * 0.5) / camera.zoom + camera.x;
  const worldY = (screenY - canvasHeight * 0.5) / camera.zoom + camera.y;

  const halfW = TILE_SIZE * 0.5;
  const halfH = TILE_SIZE * 0.25;

  const tx = (worldX / halfW + worldY / halfH) * 0.5;
  const ty = (worldY / halfH - worldX / halfW) * 0.5;

  return { x: Math.floor(tx), y: Math.floor(ty) };
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const worldX = (screenX - canvasWidth * 0.5) / camera.zoom + camera.x;
  const worldY = (screenY - canvasHeight * 0.5) / camera.zoom + camera.y;
  return { x: worldX, y: worldY };
}

// Directional sunlight angle and cast shadow vector
// Sun is high in the northwest (upper-left), casting shadows towards the southeast (lower-right)
const SHADOW_DIR_X = 0.85;
const SHADOW_DIR_Y = 0.42;

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private animTick: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number,
    worldTiles: WorldTile[][],
    buildings: PlacedBuilding[],
    units: GameUnit[],
    terrain: TerrainResource[],
    projectiles: Projectile[],
    particles: GameParticle[],
    floatingTexts: FloatingText[],
    selectedBuildingId: string | null,
    selectedUnitIds: string[],
    placementPreview: { type: string; x: number; y: number; valid: boolean } | null,
    mapWidth: number,
    mapHeight: number
  ) {
    this.animTick += 0.05;
    const ctx = this.ctx;

    // Viewport Culling Bounds in World Space (with generous padding for tall towers & shadows)
    const halfViewW = (canvasWidth * 0.5) / camera.zoom;
    const halfViewH = (canvasHeight * 0.5) / camera.zoom;
    const viewMinX = camera.x - halfViewW - 160;
    const viewMaxX = camera.x + halfViewW + 160;
    const viewMinY = camera.y - halfViewH - 180;
    const viewMaxY = camera.y + halfViewH + 160;

    // Deep rich African nocturnal / warm earth ambient backdrop
    ctx.fillStyle = '#140c07';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.save();
    // Center camera
    ctx.translate(canvasWidth * 0.5, canvasHeight * 0.5);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Ground Tiles & Organic Earthen Roads
    this.drawTerrain(worldTiles, buildings, mapWidth, mapHeight, viewMinX, viewMaxX, viewMinY, viewMaxY);

    // 2. Draw Natural Terrain Resources (Acacia/Baobab Trees, Rocks, Gold Veins)
    this.drawTerrainResources(terrain, viewMinX, viewMaxX, viewMinY, viewMaxY);

    // 3. Draw Placement Preview if active
    if (placementPreview) {
      this.drawPlacementPreview(placementPreview);
    }

    // 4. Depth-sorted 2.5D Entities (Volumetric Buildings and Units)
    this.drawSortedEntities(
      buildings,
      units,
      selectedBuildingId,
      selectedUnitIds,
      viewMinX,
      viewMaxX,
      viewMinY,
      viewMaxY
    );

    // 5. Draw Flying Projectiles (Arrows with curved ballistic arc)
    this.drawProjectiles(projectiles);

    // 6. Draw Particles (Smoke, Sparks, Dust, Water Splash)
    this.drawParticles(particles);

    // 7. Draw Floating Numbers
    this.drawFloatingTexts(floatingTexts);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // TERRAIN & PATHWAYS
  // -------------------------------------------------------------
  private drawTerrain(
    worldTiles: WorldTile[][],
    buildings: PlacedBuilding[],
    mapWidth: number,
    mapHeight: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ) {
    const ctx = this.ctx;
    const halfW = TILE_SIZE * 0.5;
    const halfH = TILE_SIZE * 0.25;

    // Fast lookup for building proximity to create organic dirt footpaths
    const buildingMap = new Set<string>();
    for (const b of buildings) {
      for (let bx = -1; bx <= b.width; bx++) {
        for (let by = -1; by <= b.height; by++) {
          buildingMap.add(`${b.x + bx},${b.y + by}`);
        }
      }
    }

    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        const { x: wx, y: wy } = tileToWorld(x, y);

        // Viewport Culling
        if (wx + halfW < minX || wx - halfW > maxX || wy + halfH * 2 < minY || wy > maxY) {
          continue;
        }

        const tile = worldTiles[x]?.[y];
        const isRiver = tile ? tile.biome === 'river' : false;
        const isFord = tile ? tile.biome === 'river_ford' : false;

        // Diamond vertices
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + halfW, wy + halfH);
        ctx.lineTo(wx, wy + halfH * 2);
        ctx.lineTo(wx - halfW, wy + halfH);
        ctx.closePath();

        if (isRiver) {
          // Living flowing water with multi-tone depth and specular ripples
          const shimmer = Math.sin(this.animTick * 1.5 + (x + y) * 0.8) * 12;
          ctx.fillStyle = `rgb(22, ${82 + shimmer}, ${148 + shimmer})`;
          ctx.fill();

          // River shoreline wet silt rim
          ctx.strokeStyle = 'rgba(180, 140, 90, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Flow ripples
          ctx.beginPath();
          ctx.moveTo(wx - 7, wy + halfH);
          ctx.lineTo(wx + 7, wy + halfH);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (isFord) {
          // Shallow ford with submerged laterite stepping stones
          ctx.fillStyle = '#3a86c8';
          ctx.fill();

          ctx.fillStyle = '#b07d58';
          ctx.beginPath();
          ctx.ellipse(wx - 3, wy + halfH - 2, 4, 2.5, 0, 0, Math.PI * 2);
          ctx.ellipse(wx + 4, wy + halfH + 2, 4.5, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Check if this tile is an organic beaten dirt path near settlement buildings
          const isSettlementPath = buildingMap.has(`${x},${y}`);

          if (isSettlementPath) {
            // Trampled warm earthen path (reddish-brown laterite soil)
            ctx.fillStyle = ((x + y) % 2 === 0) ? '#a2592c' : '#944e24';
            ctx.fill();

            // Organic soil speckles
            ctx.strokeStyle = 'rgba(50, 20, 8, 0.18)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          } else {
            // Multi-biome natural terrain with subtle pseudo-random variation
            const baseColor = tile ? tile.color : '#b7791f';
            ctx.fillStyle = baseColor;
            ctx.fill();

            // Subtle organic edge
            ctx.strokeStyle = 'rgba(40, 15, 5, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Occasional natural grass tuft or desert pebble
            const seedVal = (x * 37 + y * 19) % 17;
            if (seedVal === 3 && tile && (tile.biome === 'sahel' || tile.biome === 'savanna')) {
              ctx.fillStyle = '#596b1b';
              ctx.fillRect(wx - 1, wy + halfH - 3, 2, 4);
              ctx.fillRect(wx + 2, wy + halfH - 2, 1.5, 3);
            } else if (seedVal === 7 && tile && tile.biome === 'desert') {
              ctx.fillStyle = '#eab308';
              ctx.beginPath();
              ctx.arc(wx + 1, wy + halfH, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // NATURAL RESOURCES (Acacia/Baobab trees, Rocks, Gold veins)
  // -------------------------------------------------------------
  private drawTerrainResources(
    terrain: TerrainResource[],
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ) {
    const ctx = this.ctx;
    for (const res of terrain) {
      const { x: wx, y: wy } = tileToWorld(res.x + 0.5, res.y + 0.5);

      if (wx < minX || wx > maxX || wy < minY || wy > maxY) {
        continue;
      }

      if (res.type === 'tree') {
        // Broad-crowned African Acacia / Baobab
        // 1. Long directional ground shadow (offset southeast)
        ctx.beginPath();
        ctx.ellipse(wx + 10, wy + 10, 20, 9, Math.PI * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 10, 5, 0.38)';
        ctx.fill();

        // 2. Thick weathered African hardwood trunk
        ctx.fillStyle = '#4a2810';
        ctx.beginPath();
        ctx.moveTo(wx - 4, wy + 2);
        ctx.lineTo(wx - 3, wy - 18);
        ctx.lineTo(wx + 3, wy - 18);
        ctx.lineTo(wx + 5, wy + 2);
        ctx.closePath();
        ctx.fill();

        // Forked branches
        ctx.strokeStyle = '#381c09';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(wx - 1, wy - 14);
        ctx.lineTo(wx - 10, wy - 24);
        ctx.moveTo(wx + 1, wy - 14);
        ctx.lineTo(wx + 11, wy - 23);
        ctx.stroke();

        // 3. Layered umbrella savanna canopy (Sunlit top, shaded bottom)
        // Bottom shaded canopy
        ctx.beginPath();
        ctx.ellipse(wx, wy - 22, 24, 11, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#2f490f';
        ctx.fill();

        // Top sunlit canopy (warm golden olive)
        ctx.beginPath();
        ctx.ellipse(wx - 2, wy - 26, 20, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#527c13';
        ctx.fill();

        // Highlight crest
        ctx.beginPath();
        ctx.ellipse(wx - 4, wy - 28, 12, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#7ca827';
        ctx.fill();
      } else if (res.type === 'rock') {
        // Massive laterite / granite rock outcrop
        // Ground shadow
        ctx.beginPath();
        ctx.ellipse(wx + 6, wy + 6, 15, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 10, 5, 0.42)';
        ctx.fill();

        // Shaded side (East)
        ctx.fillStyle = '#524b46';
        ctx.beginPath();
        ctx.moveTo(wx, wy - 14);
        ctx.lineTo(wx + 12, wy - 3);
        ctx.lineTo(wx + 8, wy + 5);
        ctx.lineTo(wx - 1, wy + 5);
        ctx.closePath();
        ctx.fill();

        // Sunlit side (West / Top)
        ctx.fillStyle = '#8b837c';
        ctx.beginPath();
        ctx.moveTo(wx - 11, wy + 3);
        ctx.lineTo(wx - 7, wy - 11);
        ctx.lineTo(wx, wy - 14);
        ctx.lineTo(wx - 1, wy + 5);
        ctx.closePath();
        ctx.fill();

        // Top ridge highlight
        ctx.strokeStyle = '#c4beb8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(wx - 7, wy - 11);
        ctx.lineTo(wx, wy - 14);
        ctx.stroke();
      } else if (res.type === 'gold_vein') {
        // Auriferous quartz outcrop with glittering alluvial gold
        ctx.beginPath();
        ctx.ellipse(wx + 6, wy + 6, 16, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 10, 5, 0.45)';
        ctx.fill();

        // Dark quartz host rock
        ctx.fillStyle = '#44403c';
        ctx.beginPath();
        ctx.moveTo(wx - 12, wy + 4);
        ctx.lineTo(wx - 6, wy - 12);
        ctx.lineTo(wx + 6, wy - 10);
        ctx.lineTo(wx + 13, wy + 3);
        ctx.closePath();
        ctx.fill();

        // Glittering gold clusters
        const glint = Math.sin(this.animTick * 3 + res.x) * 1.5;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(wx - 3, wy - 5, 3.5 + glint * 0.3, 0, Math.PI * 2);
        ctx.arc(wx + 4, wy - 3, 3, 0, Math.PI * 2);
        ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Bright spark
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx - 3, wy - 6, 1.5, 1.5);
      }
    }
  }

  // -------------------------------------------------------------
  // DEPTH-SORTED ENTITY PIPELINE (Buildings and Units)
  // -------------------------------------------------------------
  private drawSortedEntities(
    buildings: PlacedBuilding[],
    units: GameUnit[],
    selectedBuildingId: string | null,
    selectedUnitIds: string[],
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ) {
    const renderList: Array<{
      type: 'building' | 'unit';
      depth: number;
      data: PlacedBuilding | GameUnit;
    }> = [];

    // Buildings: depth is calculated from South corner
    buildings.forEach((b) => {
      const { x: wx, y: wy } = tileToWorld(b.x + b.width * 0.5, b.y + b.height * 0.5);
      if (wx >= minX - 100 && wx <= maxX + 100 && wy >= minY - 100 && wy <= maxY + 100) {
        const depth = b.x + b.width + b.y + b.height;
        renderList.push({ type: 'building', depth, data: b });
      }
    });

    // Units: depth is tile position (x + y)
    units.forEach((u) => {
      const { x: wx, y: wy } = tileToWorld(u.x, u.y);
      if (wx >= minX - 60 && wx <= maxX + 60 && wy >= minY - 60 && wy <= maxY + 60) {
        const depth = u.x + u.y;
        renderList.push({ type: 'unit', depth, data: u });
      }
    });

    // Sort ascending by isometric depth: background items first, foreground last
    renderList.sort((a, b) => a.depth - b.depth);

    for (const item of renderList) {
      if (item.type === 'building') {
        const b = item.data as PlacedBuilding;
        this.drawBuilding(b, b.id === selectedBuildingId);
      } else {
        const u = item.data as GameUnit;
        this.drawUnit(u, selectedUnitIds.includes(u.id));
      }
    }
  }

  // -------------------------------------------------------------
  // VOLUMETRIC ISOMETRIC GEOMETRY HELPERS
  // -------------------------------------------------------------

  /**
   * Computes the 4 ground corners of an isometric rectangle
   */
  private getIsometricBase(bx: number, by: number, bw: number, bh: number) {
    const N = tileToWorld(bx, by);
    const E = tileToWorld(bx + bw, by);
    const S = tileToWorld(bx + bw, by + bh);
    const W = tileToWorld(bx, by + bh);
    const center = tileToWorld(bx + bw * 0.5, by + bh * 0.5);
    return { N, E, S, W, center };
  }

  /**
   * Draws a realistic cast ground shadow projecting southeast along the sunlight angle
   */
  private drawCastShadow(
    N: { x: number; y: number },
    E: { x: number; y: number },
    S: { x: number; y: number },
    W: { x: number; y: number },
    height: number
  ) {
    const ctx = this.ctx;
    const sDx = height * SHADOW_DIR_X;
    const sDy = height * SHADOW_DIR_Y;

    ctx.save();
    ctx.fillStyle = 'rgba(22, 11, 5, 0.42)';
    ctx.beginPath();
    ctx.moveTo(W.x, W.y);
    ctx.lineTo(W.x + sDx, W.y + sDy);
    ctx.lineTo(N.x + sDx, N.y + sDy);
    ctx.lineTo(E.x + sDx, E.y + sDy);
    ctx.lineTo(E.x, E.y);
    ctx.lineTo(S.x, S.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draws contact ambient occlusion beneath the building base
   */
  private drawContactShadow(
    N: { x: number; y: number },
    E: { x: number; y: number },
    S: { x: number; y: number },
    W: { x: number; y: number }
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(20, 10, 5, 0.35)';
    ctx.beginPath();
    ctx.moveTo(N.x, N.y);
    ctx.lineTo(E.x + 4, E.y + 2);
    ctx.lineTo(S.x, S.y + 3);
    ctx.lineTo(W.x - 4, W.y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draws a complete volumetric 2.5D extruded earthen block (base, walls, roof, toron posts)
   */
  private drawEarthenBlock(params: {
    bx: number;
    by: number;
    bw: number;
    bh: number;
    height: number;
    sunlitColor?: string;
    shadedColor?: string;
    roofColor?: string;
    drawTorons?: boolean;
    toronSpacing?: number;
    parapet?: boolean;
    crenellations?: boolean;
  }) {
    const ctx = this.ctx;
    const { N, E, S, W } = this.getIsometricBase(params.bx, params.by, params.bw, params.bh);
    const H = params.height;

    // Extruded roof vertices
    const TN = { x: N.x, y: N.y - H };
    const TE = { x: E.x, y: E.y - H };
    const TS = { x: S.x, y: S.y - H };
    const TW = { x: W.x, y: W.y - H };

    // 1. Cast Shadow
    this.drawCastShadow(N, E, S, W, H);

    // 2. Base Contact AO
    this.drawContactShadow(N, E, S, W);

    // Default authentic West African Sahelian earth palette
    const colSunlit = params.sunlitColor || '#ca7e30'; // warm golden ochre mud
    const colShaded = params.shadedColor || '#6d2e0e'; // deep burnt umber laterite
    const colRoof = params.roofColor || '#d9a05b'; // sun-bleached clay terrace

    // 3. West / South-West Facade (Sunlit)
    ctx.fillStyle = colSunlit;
    ctx.beginPath();
    ctx.moveTo(W.x, W.y);
    ctx.lineTo(S.x, S.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.lineTo(TW.x, TW.y);
    ctx.closePath();
    ctx.fill();

    // Subtle earthen wall striations
    ctx.strokeStyle = 'rgba(70, 30, 10, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W.x, W.y);
    ctx.lineTo(TW.x, TW.y);
    ctx.stroke();

    // 4. East / South-East Facade (Shaded)
    ctx.fillStyle = colShaded;
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(E.x, E.y);
    ctx.lineTo(TE.x, TE.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.closePath();
    ctx.fill();

    // Corner shadow line
    ctx.strokeStyle = 'rgba(30, 12, 5, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.stroke();

    // 5. Roof Terrace (Top Plane)
    ctx.fillStyle = colRoof;
    ctx.beginPath();
    ctx.moveTo(TN.x, TN.y);
    ctx.lineTo(TE.x, TE.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.lineTo(TW.x, TW.y);
    ctx.closePath();
    ctx.fill();

    // Roof edge highlight
    ctx.strokeStyle = 'rgba(255, 230, 180, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TW.x, TW.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.stroke();

    // 6. Projecting Toron Wooden Beams (Iconic Sudano-Sahelian feature)
    if (params.drawTorons) {
      const spacing = params.toronSpacing || 3;
      ctx.fillStyle = '#3a1909'; // dark acacia hardwood
      ctx.strokeStyle = 'rgba(15, 6, 2, 0.5)';
      ctx.lineWidth = 1;

      // Sunlit wall torons
      const steps = Math.floor(params.bh * spacing);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const bx = W.x + (S.x - W.x) * t;
        const by = W.y + (S.y - W.y) * t;
        const rowCount = Math.max(1, Math.floor(H / 14));
        for (let r = 1; r <= rowCount; r++) {
          const py = by - (H * (r / (rowCount + 1)));
          // Projecting timber peg sticking out along southwest normal
          ctx.beginPath();
          ctx.moveTo(bx, py);
          ctx.lineTo(bx - 4, py + 2);
          ctx.stroke();
          // Drop shadow from toron
          ctx.fillStyle = 'rgba(20, 10, 5, 0.4)';
          ctx.fillRect(bx - 3, py + 2.5, 3, 1);
        }
      }

      // Shaded wall torons
      const stepsE = Math.floor(params.bw * spacing);
      for (let i = 1; i < stepsE; i++) {
        const t = i / stepsE;
        const bx = S.x + (E.x - S.x) * t;
        const by = S.y + (E.y - S.y) * t;
        const rowCount = Math.max(1, Math.floor(H / 14));
        for (let r = 1; r <= rowCount; r++) {
          const py = by - (H * (r / (rowCount + 1)));
          ctx.beginPath();
          ctx.moveTo(bx, py);
          ctx.lineTo(bx + 4, py + 2);
          ctx.stroke();
        }
      }
    }

    // 7. Parapet and Sudano-Sahelian Adobe Pinnacles
    if (params.parapet) {
      ctx.fillStyle = '#b66b26';
      // Low earthen perimeter parapet
      ctx.beginPath();
      ctx.moveTo(TW.x, TW.y - 3);
      ctx.lineTo(TS.x, TS.y - 3);
      ctx.lineTo(TE.x, TE.y - 3);
      ctx.stroke();
    }

    if (params.crenellations) {
      // Conical adobe corner spires
      this.drawAdobePinnacle(TW.x, TW.y);
      this.drawAdobePinnacle(TS.x, TS.y);
      this.drawAdobePinnacle(TE.x, TE.y);
      this.drawAdobePinnacle(TN.x, TN.y);
    }

    return { N, E, S, W, TN, TE, TS, TW };
  }

  /**
   * Conical Sudano-Sahelian Adobe Pinnacle (often crowned with an ostrich egg finial)
   */
  private drawAdobePinnacle(x: number, y: number, height: number = 8) {
    const ctx = this.ctx;
    // Tapered mud spire
    ctx.fillStyle = '#c5782a';
    ctx.beginPath();
    ctx.moveTo(x - 2.5, y);
    ctx.lineTo(x, y - height);
    ctx.lineTo(x + 2.5, y);
    ctx.closePath();
    ctx.fill();

    // Shaded side
    ctx.fillStyle = '#6b2909';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - height);
    ctx.lineTo(x + 2.5, y);
    ctx.closePath();
    ctx.fill();

    // Polished cream ostrich egg finial at the pinnacle tip
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x, y - height - 1.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // -------------------------------------------------------------
  // VOLUMETRIC ARCHITECTURAL RENDERERS
  // -------------------------------------------------------------

  private drawBuilding(b: PlacedBuilding, isSelected: boolean) {
    const ctx = this.ctx;
    const { center, S, N, E, W } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const wx = center.x;
    const wy = center.y;

    // Selection highlight ring (isometric ground ellipse)
    if (isSelected) {
      ctx.beginPath();
      ctx.ellipse(wx, wy, b.width * 20, b.height * 10, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Under construction scaffolding
    if (!b.isConstructed) {
      this.drawUnderConstruction(b, center);
      return;
    }

    const isRival = b.owner === 'rival';

    switch (b.type) {
      case 'compound':
        this.drawRoyalCompound(b, isRival);
        break;
      case 'house':
        this.drawRoundhouse(b);
        break;
      case 'farm':
        this.drawFarm(b);
        break;
      case 'granary':
        this.drawGranary(b);
        break;
      case 'lumber_camp':
        this.drawLumberCamp(b);
        break;
      case 'quarry':
        this.drawQuarry(b);
        break;
      case 'gold_mine':
        this.drawGoldMine(b);
        break;
      case 'market':
        this.drawMarket(b);
        break;
      case 'wall':
        this.drawWall(b, isRival);
        break;
      case 'gate':
        this.drawGate(b, isRival);
        break;
      case 'tower':
        this.drawTower(b, isRival);
        break;
      case 'barracks':
        this.drawBarracks(b, isRival);
        break;
      default:
        this.drawEarthenBlock({
          bx: b.x,
          by: b.y,
          bw: b.width,
          bh: b.height,
          height: 24,
        });
        break;
    }

    // Health bar if damaged
    if (b.hp < b.maxHp) {
      const barW = Math.max(34, b.width * 16);
      const barH = 5;
      const barX = wx - barW * 0.5;
      const barY = wy - b.height * 16 - 28;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      const hpRatio = Math.max(0, b.hp / b.maxHp);
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }
  }

  /**
   * Construction Scaffolding with Timber Poles
   */
  private drawUnderConstruction(b: PlacedBuilding, center: { x: number; y: number }) {
    const ctx = this.ctx;
    const { N, E, S, W } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const H = 22;

    // Ground footprint
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(N.x, N.y);
    ctx.lineTo(E.x, E.y);
    ctx.lineTo(S.x, S.y);
    ctx.lineTo(W.x, W.y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Timber upright poles
    ctx.strokeStyle = '#5c2d0c';
    ctx.lineWidth = 2;
    [N, E, S, W].forEach((pt) => {
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x, pt.y - H);
      ctx.stroke();
    });

    // Cross-bracing
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W.x, W.y);
    ctx.lineTo(S.x, S.y - H);
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(E.x, E.y - H);
    ctx.stroke();

    // Partial mud brick filling
    const fillH = H * b.constructionProgress;
    ctx.fillStyle = 'rgba(161, 98, 7, 0.7)';
    ctx.beginPath();
    ctx.moveTo(W.x, W.y);
    ctx.lineTo(S.x, S.y);
    ctx.lineTo(S.x, S.y - fillH);
    ctx.lineTo(W.x, W.y - fillH);
    ctx.closePath();
    ctx.fill();

    // Progress bar
    const barW = 36;
    const barH = 5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(center.x - barW * 0.5, center.y - H - 14, barW, barH);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(center.x - barW * 0.5, center.y - H - 14, barW * b.constructionProgress, barH);
  }

  /**
   * 1. ROYAL COMPOUND (3x3 Multi-Tiered Sudano-Sahelian Palace)
   */
  private drawRoyalCompound(b: PlacedBuilding, isRival: boolean) {
    const ctx = this.ctx;
    const sunColor = isRival ? '#991b1b' : '#c87a2a';
    const shadeColor = isRival ? '#591111' : '#612508';
    const roofColor = isRival ? '#b91c1c' : '#dca15d';

    // Tier 1 Base: Massive 3x3 volumetric earthen bastion (Height 32px)
    const base = this.drawEarthenBlock({
      bx: b.x,
      by: b.y,
      bw: 3,
      bh: 3,
      height: 32,
      sunlitColor: sunColor,
      shadedColor: shadeColor,
      roofColor: roofColor,
      drawTorons: true,
      toronSpacing: 2.5,
      parapet: true,
      crenellations: true,
    });

    // Monumental recessed arched portal on the sunlit south-west facade
    const portalCenter = {
      x: base.W.x + (base.S.x - base.W.x) * 0.5,
      y: base.W.y + (base.S.y - base.W.y) * 0.5,
    };
    ctx.fillStyle = '#1e0c03';
    ctx.beginPath();
    ctx.arc(portalCenter.x, portalCenter.y - 10, 6, Math.PI, 0, false);
    ctx.lineTo(portalCenter.x + 6, portalCenter.y + 1);
    ctx.lineTo(portalCenter.x - 6, portalCenter.y + 1);
    ctx.closePath();
    ctx.fill();

    // Heavy studded timber lintel
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tier 2 Court: Elevated sovereign pavilion in the center (2x2, height 22px higher)
    const tier2 = this.drawEarthenBlock({
      bx: b.x + 0.5,
      by: b.y + 0.5,
      bw: 2,
      bh: 2,
      height: 48,
      sunlitColor: isRival ? '#a82424' : '#d98c36',
      shadedColor: isRival ? '#6e1515' : '#722e0b',
      roofColor: isRival ? '#dc2626' : '#e5af70',
      drawTorons: true,
      toronSpacing: 2,
      crenellations: true,
    });

    // Central Monumental Minaret Tower (reaching up to height 66px)
    const minaretCenter = tileToWorld(b.x + 1.5, b.y + 1.5);
    const minH = 68;
    ctx.fillStyle = isRival ? '#881337' : '#be6e20';
    ctx.beginPath();
    ctx.moveTo(minaretCenter.x - 6, minaretCenter.y - 48);
    ctx.lineTo(minaretCenter.x, minaretCenter.y - minH);
    ctx.lineTo(minaretCenter.x + 6, minaretCenter.y - 48);
    ctx.closePath();
    ctx.fill();

    // Ostrich egg finial atop the minaret spire
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(minaretCenter.x, minaretCenter.y - minH - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Billowing Royal Silk Banner
    const wave = Math.sin(this.animTick * 2.5) * 4;
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(minaretCenter.x + 4, minaretCenter.y - 48);
    ctx.lineTo(minaretCenter.x + 4, minaretCenter.y - 74);
    ctx.stroke();

    // Golden banner standard
    ctx.fillStyle = isRival ? '#ef4444' : '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(minaretCenter.x + 4, minaretCenter.y - 74);
    ctx.lineTo(minaretCenter.x + 20 + wave, minaretCenter.y - 70);
    ctx.lineTo(minaretCenter.x + 16 + wave, minaretCenter.y - 62);
    ctx.lineTo(minaretCenter.x + 4, minaretCenter.y - 64);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 2. COMPOUND ROUNDHOUSE (2x2 Thatched Conical Mud Dwelling)
   */
  private drawRoundhouse(b: PlacedBuilding) {
    const ctx = this.ctx;
    const { center } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const cx = center.x;
    const cy = center.y;
    const radius = 22;
    const wallH = 18;
    const roofApexH = 40;

    // 1. Cast ground shadow
    ctx.beginPath();
    ctx.ellipse(cx + 12, cy + 8, radius * 1.1, radius * 0.55, Math.PI * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 10, 5, 0.42)';
    ctx.fill();

    // 2. Base Contact AO
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, radius * 0.9, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(25, 12, 5, 0.35)';
    ctx.fill();

    // 3. Cylindrical Earthen Mud Wall
    // Draw base ring to top ring
    const grad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    grad.addColorStop(0, '#c67d2e'); // sunlit left
    grad.addColorStop(0.55, '#a4571d');
    grad.addColorStop(1, '#5a2208'); // shaded right

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 0.85, radius * 0.42, 0, 0, Math.PI);
    ctx.lineTo(cx - radius * 0.85, cy - wallH);
    ctx.ellipse(cx, cy - wallH, radius * 0.85, radius * 0.42, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();

    // Arched entrance portal
    ctx.fillStyle = '#1c0b03';
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 2, 4.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Conical Thatched Grass / Straw Roof
    const roofBaseY = cy - wallH + 2;
    const apexY = cy - roofApexH;

    // Roof cone with directional sunlight
    const roofGrad = ctx.createLinearGradient(cx - radius, roofBaseY, cx + radius, roofBaseY);
    roofGrad.addColorStop(0, '#d99738'); // sunlit thatch
    roofGrad.addColorStop(0.5, '#b87520');
    roofGrad.addColorStop(1, '#653a0b'); // shaded thatch

    ctx.fillStyle = roofGrad;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 1.05, roofBaseY);
    ctx.lineTo(cx, apexY);
    ctx.lineTo(cx + radius * 1.05, roofBaseY);
    ctx.ellipse(cx, roofBaseY, radius * 1.05, radius * 0.5, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fill();

    // Tiered grass thatch rings
    ctx.strokeStyle = 'rgba(70, 35, 10, 0.35)';
    ctx.lineWidth = 1;
    for (let t = 0.3; t < 0.9; t += 0.25) {
      const ringY = apexY + (roofBaseY - apexY) * t;
      const ringR = radius * t;
      ctx.beginPath();
      ctx.ellipse(cx, ringY, ringR, ringR * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Carved wood crown spire
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, apexY + 3);
    ctx.lineTo(cx, apexY - 5);
    ctx.stroke();
  }

  /**
   * 3. IRRIGATED FARMSTEAD (2x2 Cultivated Millet, Sorghum & Water Ditches)
   */
  private drawFarm(b: PlacedBuilding) {
    const ctx = this.ctx;
    const { N, E, S, W, center } = this.getIsometricBase(b.x, b.y, b.width, b.height);

    // Earthen boundary bund
    this.drawContactShadow(N, E, S, W);

    // Dark fertile irrigated silt loam
    ctx.fillStyle = '#3a1e0b';
    ctx.beginPath();
    ctx.moveTo(N.x, N.y);
    ctx.lineTo(E.x, E.y);
    ctx.lineTo(S.x, S.y);
    ctx.lineTo(W.x, W.y);
    ctx.closePath();
    ctx.fill();

    // Irrigated water channels reflecting sky
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Central ditch
    ctx.moveTo(W.x + 8, W.y + 4);
    ctx.lineTo(E.x - 8, E.y - 4);
    ctx.stroke();

    // Swaying crops: lush millet stalks with golden seed heads
    const sway = Math.sin(this.animTick * 2 + center.x) * 1.5;
    for (let rx = -16; rx <= 16; rx += 7) {
      for (let ry = -8; ry <= 8; ry += 5) {
        const px = center.x + rx + (ry % 2 === 0 ? 3 : 0);
        const py = center.y + ry * 0.5;

        // Green stalk
        ctx.strokeStyle = '#4d7c0f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + sway, py - 9);
        ctx.stroke();

        // Golden grain head
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(px + sway, py - 11, 2, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Small woven palm farmer shade shelter in corner
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(W.x + 4, W.y - 12);
    ctx.lineTo(W.x + 14, W.y - 16);
    ctx.lineTo(W.x + 18, W.y - 6);
    ctx.lineTo(W.x + 8, W.y - 2);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 4. MUD-PILLAR GRANARY (2x2 Sudanese Raised Silo on Heavy Stilts)
   */
  private drawGranary(b: PlacedBuilding) {
    const ctx = this.ctx;
    const { center } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const cx = center.x;
    const cy = center.y;

    // Ground shadow beneath raised stilts
    ctx.beginPath();
    ctx.ellipse(cx + 10, cy + 6, 18, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 10, 5, 0.45)';
    ctx.fill();

    // 4 Heavy timber / stone pilings
    ctx.fillStyle = '#4a2610';
    const stiltOffsets = [
      { x: -10, y: -4 },
      { x: 10, y: -4 },
      { x: -6, y: 5 },
      { x: 8, y: 5 },
    ];
    stiltOffsets.forEach((pt) => {
      ctx.fillRect(cx + pt.x - 2, cy + pt.y - 12, 4, 14);
    });

    // Elevated wooden platform
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 12, 17, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rounded earthen mud grain silo
    const siloGrad = ctx.createLinearGradient(cx - 15, cy - 12, cx + 15, cy - 12);
    siloGrad.addColorStop(0, '#ca7e30');
    siloGrad.addColorStop(1, '#612607');
    ctx.fillStyle = siloGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Conical thatched roof cap
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(cx - 17, cy - 22);
    ctx.lineTo(cx, cy - 40);
    ctx.lineTo(cx + 17, cy - 22);
    ctx.closePath();
    ctx.fill();

    // Slanted wooden access ladder
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 4);
    ctx.lineTo(cx - 12, cy - 16);
    ctx.moveTo(cx - 4, cy + 4);
    ctx.lineTo(cx - 8, cy - 16);
    ctx.stroke();
  }

  /**
   * 5. WOODCUTTER CAMP (2x2 Open-Air Timber Framing & Hardwood Piles)
   */
  private drawLumberCamp(b: PlacedBuilding) {
    const ctx = this.ctx;
    const { N, E, S, W, center } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const cx = center.x;
    const cy = center.y;

    this.drawContactShadow(N, E, S, W);

    // Forked acacia timber frame
    ctx.strokeStyle = '#4a250e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 2);
    ctx.lineTo(cx - 14, cy - 20);
    ctx.moveTo(cx + 14, cy + 2);
    ctx.lineTo(cx + 14, cy - 20);
    ctx.moveTo(cx - 16, cy - 20);
    ctx.lineTo(cx + 16, cy - 20);
    ctx.stroke();

    // Woven palm thatch roof
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 20);
    ctx.lineTo(cx, cy - 26);
    ctx.lineTo(cx + 18, cy - 20);
    ctx.lineTo(cx + 14, cy - 16);
    ctx.lineTo(cx - 14, cy - 16);
    ctx.closePath();
    ctx.fill();

    // Stacked African rosewood & mahogany logs
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 16, cy - 4, 14, 5);
    ctx.fillRect(cx - 14, cy - 9, 11, 4);

    // Chopping block with embedded iron axe
    ctx.fillStyle = '#5c2d0c';
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy - 2, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 3);
    ctx.lineTo(cx + 10, cy - 10);
    ctx.stroke();
  }

  /**
   * 6. STONE QUARRY (2x2 Stepped Terraced Bedrock Excavation)
   */
  private drawQuarry(b: PlacedBuilding) {
    const ctx = this.ctx;
    const { N, E, S, W, center } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const cx = center.x;
    const cy = center.y;

    // Sunken pit shadow
    ctx.fillStyle = '#261c16';
    ctx.beginPath();
    ctx.moveTo(N.x, N.y);
    ctx.lineTo(E.x, E.y);
    ctx.lineTo(S.x, S.y);
    ctx.lineTo(W.x, W.y);
    ctx.closePath();
    ctx.fill();

    // Stepped red laterite and grey stone strata
    ctx.fillStyle = '#9c4424';
    ctx.fillRect(cx - 14, cy - 10, 28, 8);
    ctx.fillStyle = '#57534e';
    ctx.fillRect(cx - 11, cy - 4, 22, 9);

    // Dressed square building stone blocks
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(cx - 8, cy - 14, 7, 6);
    ctx.fillRect(cx + 3, cy - 12, 8, 6);

    // Timber haulage crane
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy + 4);
    ctx.lineTo(cx + 12, cy - 22);
    ctx.lineTo(cx + 2, cy - 16);
    ctx.stroke();
  }

  /**
   * 7. GOLD SHAFT (2x2 Timber-Braced Mine Entrance & Sluice)
   */
  private drawGoldMine(b: PlacedBuilding) {
    const ctx = this.ctx;
    const { center } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const cx = center.x;
    const cy = center.y;

    // Dark rocky mound
    ctx.fillStyle = '#3e3733';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep mine portal
    ctx.fillStyle = '#0f0a07';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 6, 8, Math.PI, 0, false);
    ctx.lineTo(cx + 5, cy + 2);
    ctx.lineTo(cx - 11, cy + 2);
    ctx.closePath();
    ctx.fill();

    // Heavy timber portal frame
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 3);
    ctx.lineTo(cx - 12, cy - 14);
    ctx.lineTo(cx + 6, cy - 14);
    ctx.lineTo(cx + 6, cy + 3);
    ctx.stroke();

    // Golden ore wash trough & piles
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(cx + 8, cy - 4, 7, 4);

    const glint = Math.sin(this.animTick * 3 + b.x) * 1.5;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx + 11, cy - 6, 2.5 + glint * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 8. CARAVAN MARKET (2x2 Vibrant Textile Canopies & Trade Goods)
   */
  private drawMarket(b: PlacedBuilding) {
    const ctx = this.ctx;
    const { center } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const cx = center.x;
    const cy = center.y;

    // Trampled market courtyard shadow
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy + 4, 24, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 10, 5, 0.42)';
    ctx.fill();

    // Multiple colorful woven textile canopies
    const stalls = [
      { x: cx - 12, y: cy - 6, color: '#dc2626' }, // madder red
      { x: cx, y: cy - 12, color: '#f59e0b' }, // saffron gold
      { x: cx + 12, y: cy - 4, color: '#0284c7' }, // indigo blue
    ];

    stalls.forEach((s) => {
      // Timber support posts
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, s.y + 12);
      ctx.stroke();

      // Canopy fabric with animated sway
      const sway = Math.sin(this.animTick * 2 + s.x) * 1;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + sway, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Decorative fringe
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Market trade goods (terracotta grain pots, woven spice baskets, salt blocks)
    ctx.fillStyle = '#b45309'; // terracotta
    ctx.beginPath();
    ctx.arc(cx - 6, cy + 2, 3, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy + 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc'; // Saharan salt slab
    ctx.fillRect(cx - 2, cy + 1, 5, 3);
  }

  /**
   * 9. EARTHEN WALL (1x1 Massive Continuous Rammed-Earth Fortification)
   */
  private drawWall(b: PlacedBuilding, isRival: boolean) {
    const ctx = this.ctx;
    const sunColor = isRival ? '#991b1b' : '#c67b28';
    const shadeColor = isRival ? '#591111' : '#5e2307';
    const roofColor = isRival ? '#b91c1c' : '#d89b56';

    const { N, E, S, W } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const H = 18;

    // 1. Cast shadow
    this.drawCastShadow(N, E, S, W, H);
    this.drawContactShadow(N, E, S, W);

    const TN = { x: N.x, y: N.y - H };
    const TE = { x: E.x, y: E.y - H };
    const TS = { x: S.x, y: S.y - H };
    const TW = { x: W.x, y: W.y - H };

    // Sunlit southwest face
    ctx.fillStyle = sunColor;
    ctx.beginPath();
    ctx.moveTo(W.x, W.y);
    ctx.lineTo(S.x, S.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.lineTo(TW.x, TW.y);
    ctx.closePath();
    ctx.fill();

    // Shaded southeast face
    ctx.fillStyle = shadeColor;
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(E.x, E.y);
    ctx.lineTo(TE.x, TE.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.closePath();
    ctx.fill();

    // Rampart walkway along the top
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(TN.x, TN.y);
    ctx.lineTo(TE.x, TE.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.lineTo(TW.x, TW.y);
    ctx.closePath();
    ctx.fill();

    // Crenellated outer parapet (battlements) along southwest face
    ctx.fillStyle = sunColor;
    // Left battlement
    ctx.fillRect(TW.x + 2, TW.y - 4, 6, 5);
    // Right battlement
    ctx.fillRect(TS.x - 7, TS.y - 4, 6, 5);

    // Toron beam projecting from wall
    ctx.strokeStyle = '#351606';
    ctx.lineWidth = 1.5;
    const midX = W.x + (S.x - W.x) * 0.5;
    const midY = W.y + (S.y - W.y) * 0.5 - H * 0.5;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX - 3.5, midY + 1.5);
    ctx.stroke();
  }

  /**
   * 10. FORTIFIED GATE (2x1 Double Bastions with Portcullis & Timber Doors)
   */
  private drawGate(b: PlacedBuilding, isRival: boolean) {
    const ctx = this.ctx;
    const sunColor = isRival ? '#991b1b' : '#c67b28';
    const shadeColor = isRival ? '#591111' : '#5e2307';
    const roofColor = isRival ? '#b91c1c' : '#d89b56';

    const { N, E, S, W, center } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const H = 26;

    // Overall cast shadow
    this.drawCastShadow(N, E, S, W, H);
    this.drawContactShadow(N, E, S, W);

    // Left Bastion (Width 0.7)
    this.drawEarthenBlock({
      bx: b.x,
      by: b.y,
      bw: 0.7,
      bh: 1,
      height: H,
      sunlitColor: sunColor,
      shadedColor: shadeColor,
      roofColor: roofColor,
      crenellations: true,
    });

    // Right Bastion (Width 0.7)
    this.drawEarthenBlock({
      bx: b.x + 1.3,
      by: b.y,
      bw: 0.7,
      bh: 1,
      height: H,
      sunlitColor: sunColor,
      shadedColor: shadeColor,
      roofColor: roofColor,
      crenellations: true,
    });

    const cx = center.x;
    const cy = center.y;

    // Overhead Rampart Bridge connecting the two bastions
    ctx.fillStyle = shadeColor;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - H + 4);
    ctx.lineTo(cx + 14, cy - H + 4);
    ctx.lineTo(cx + 14, cy - H + 10);
    ctx.lineTo(cx - 14, cy - H + 10);
    ctx.closePath();
    ctx.fill();

    // Stepped crenellation on overhead sentry bridge
    ctx.fillStyle = sunColor;
    ctx.fillRect(cx - 5, cy - H - 1, 10, 5);

    // Deep vaulted arched entryway
    ctx.fillStyle = '#1c0c04';
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 7.5, Math.PI, 0, false);
    ctx.lineTo(cx + 7.5, cy + 3);
    ctx.lineTo(cx - 7.5, cy + 3);
    ctx.closePath();
    ctx.fill();

    // Heavy iron-reinforced acacia double doors
    ctx.fillStyle = '#2c1407';
    ctx.fillRect(cx - 6, cy - 6, 12, 9);

    // Bronze door studs and center seam
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx, cy + 3);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 4, cy - 3, 2, 2);
    ctx.fillRect(cx + 2, cy - 3, 2, 2);
  }

  /**
   * 11. SAHELIAN WATCHTOWER (1x1 Tapered Earthen Bastion with Sentry Platform)
   */
  private drawTower(b: PlacedBuilding, isRival: boolean) {
    const ctx = this.ctx;
    const { N, E, S, W, center } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    const H = 46;

    // 1. Long directional shadow
    this.drawCastShadow(N, E, S, W, H);
    this.drawContactShadow(N, E, S, W);

    // Tapered (battered) earthen walls
    const sunColor = isRival ? '#991b1b' : '#c87a2a';
    const shadeColor = isRival ? '#591111' : '#612508';

    // Top tapered corners (tapers inward by 25%)
    const TN = { x: N.x * 0.45 + center.x * 0.55, y: N.y - H };
    const TE = { x: E.x * 0.45 + center.x * 0.55, y: E.y - H };
    const TS = { x: S.x * 0.45 + center.x * 0.55, y: S.y - H };
    const TW = { x: W.x * 0.45 + center.x * 0.55, y: W.y - H };

    // Sunlit west face
    ctx.fillStyle = sunColor;
    ctx.beginPath();
    ctx.moveTo(W.x, W.y);
    ctx.lineTo(S.x, S.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.lineTo(TW.x, TW.y);
    ctx.closePath();
    ctx.fill();

    // Shaded east face
    ctx.fillStyle = shadeColor;
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(E.x, E.y);
    ctx.lineTo(TE.x, TE.y);
    ctx.lineTo(TS.x, TS.y);
    ctx.closePath();
    ctx.fill();

    // Protruding toron beams on the tower facade
    ctx.strokeStyle = '#351606';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(TW.x + (TS.x - TW.x) * 0.5, TW.y + (TS.y - TW.y) * 0.5 + 8);
    ctx.lineTo(TW.x + (TS.x - TW.x) * 0.5 - 4, TW.y + (TS.y - TW.y) * 0.5 + 10);
    ctx.moveTo(TW.x + (TS.x - TW.x) * 0.5, TW.y + (TS.y - TW.y) * 0.5 + 20);
    ctx.lineTo(TW.x + (TS.x - TW.x) * 0.5 - 4, TW.y + (TS.y - TW.y) * 0.5 + 22);
    ctx.stroke();

    // Elevated timber observation deck
    ctx.fillStyle = '#4a250e';
    ctx.beginPath();
    ctx.moveTo(TN.x - 2, TN.y);
    ctx.lineTo(TE.x + 2, TE.y);
    ctx.lineTo(TS.x + 2, TS.y);
    ctx.lineTo(TW.x - 2, TW.y);
    ctx.closePath();
    ctx.fill();

    // Thatched sentry sun canopy
    const apexY = center.y - H - 15;
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(center.x - 11, center.y - H - 3);
    ctx.lineTo(center.x, apexY);
    ctx.lineTo(center.x + 11, center.y - H - 3);
    ctx.closePath();
    ctx.fill();

    // Timber canopy posts
    ctx.strokeStyle = '#2d1406';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(center.x - 8, center.y - H + 2);
    ctx.lineTo(center.x - 8, center.y - H - 3);
    ctx.moveTo(center.x + 8, center.y - H + 2);
    ctx.lineTo(center.x + 8, center.y - H - 3);
    ctx.stroke();

    // Arrow slit in center of tower
    ctx.fillStyle = '#1c0e05';
    ctx.fillRect(center.x - 1, center.y - H + 14, 2.5, 7);
  }

  /**
   * 12. WARRIORS' LODGE (3x2 Earthen Military Compound with Painted Frieze)
   */
  private drawBarracks(b: PlacedBuilding, isRival: boolean) {
    const ctx = this.ctx;
    const sunColor = isRival ? '#991b1b' : '#c87a2a';
    const shadeColor = isRival ? '#591111' : '#612508';
    const roofColor = isRival ? '#b91c1c' : '#dca15d';

    const base = this.drawEarthenBlock({
      bx: b.x,
      by: b.y,
      bw: 3,
      bh: 2,
      height: 28,
      sunlitColor: sunColor,
      shadedColor: shadeColor,
      roofColor: roofColor,
      drawTorons: true,
      toronSpacing: 2,
      parapet: true,
    });

    // Broad hipped thatched roof
    const { center } = this.getIsometricBase(b.x, b.y, b.width, b.height);
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(base.TW.x - 2, base.TW.y);
    ctx.lineTo(center.x, base.TW.y - 18);
    ctx.lineTo(base.TE.x + 2, base.TE.y);
    ctx.lineTo(base.TS.x, base.TS.y + 2);
    ctx.closePath();
    ctx.fill();

    // Traditional West African painted chevron motif along the frieze
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(base.W.x + 6, base.W.y - 20);
    ctx.lineTo(base.W.x + 10, base.W.y - 25);
    ctx.lineTo(base.W.x + 14, base.W.y - 20);
    ctx.fill();

    // Propped ox-hide war shield & spear outside
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(center.x + 10, center.y + 4, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(center.x + 14, center.y + 10);
    ctx.lineTo(center.x + 14, center.y - 8);
    ctx.stroke();
  }

  // -------------------------------------------------------------
  // UNITS & SOLDIERS
  // -------------------------------------------------------------
  private drawUnit(u: GameUnit, isSelected: boolean) {
    const ctx = this.ctx;
    const { x: wx, y: wy } = tileToWorld(u.x, u.y);

    if (isSelected) {
      ctx.beginPath();
      ctx.ellipse(wx, wy + 2, 12, 6.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(wx, wy + 2, 8, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 10, 5, 0.42)';
      ctx.fill();
    }

    const isRival = u.owner === 'rival';
    const tunicColor = isRival ? '#dc2626' : u.type === 'cavalry' ? '#f59e0b' : '#38bdf8';

    const isMoving = u.state === 'moving';
    const bob = isMoving ? Math.sin(this.animTick * 6 + u.x * 2) * 2 : 0;

    if (u.type === 'cavalry') {
      // Mandekalu Royal Cavalry
      ctx.fillStyle = '#78350f';
      ctx.fillRect(wx - 10, wy - 12 + bob, 20, 10);
      ctx.fillRect(wx + 6, wy - 18 + bob, 7, 9);
      ctx.fillStyle = tunicColor;
      ctx.fillRect(wx - 4, wy - 24 + bob, 8, 12);
      ctx.fillStyle = '#5c2d0c';
      ctx.beginPath();
      ctx.arc(wx, wy - 28 + bob, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx - 2, wy - 20 + bob);
      ctx.lineTo(wx + 18, wy - 30 + bob);
      ctx.stroke();
    } else {
      // Pedestrian unit
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx - 2, wy - 2 + bob);
      ctx.lineTo(wx - 2, wy + 3);
      ctx.moveTo(wx + 2, wy - 2 + bob);
      ctx.lineTo(wx + 2, wy + 3);
      ctx.stroke();

      ctx.fillStyle = tunicColor;
      ctx.fillRect(wx - 4, wy - 14 + bob, 8, 12);

      ctx.fillStyle = '#5c2d0c';
      ctx.beginPath();
      ctx.arc(wx, wy - 17 + bob, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (u.type === 'spearman') {
        ctx.fillStyle = isRival ? '#991b1b' : '#ca8a04';
        ctx.beginPath();
        ctx.ellipse(wx - 5, wy - 10 + bob, 3, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(wx + 2, wy - 2 + bob);
        ctx.lineTo(wx + 8, wy - 22 + bob);
        ctx.stroke();
      } else if (u.type === 'archer') {
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wx + 4, wy - 10 + bob, 6, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      } else if (u.type === 'villager') {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(wx - 3, wy - 24 + bob, 6, 4);
      }
    }

    if (u.hp < u.maxHp) {
      const barW = 18;
      const barH = 3;
      const barX = wx - barW * 0.5;
      const barY = wy - 28 + bob;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barW, barH);

      const ratio = Math.max(0, u.hp / u.maxHp);
      ctx.fillStyle = isRival ? '#ef4444' : '#22c55e';
      ctx.fillRect(barX, barY, barW * ratio, barH);
    }
  }

  // -------------------------------------------------------------
  // PLACEMENT PREVIEW & EFFECTS
  // -------------------------------------------------------------
  private drawPlacementPreview(preview: { type: string; x: number; y: number; valid: boolean }) {
    const ctx = this.ctx;
    const bConfig = BUILDINGS[preview.type as keyof typeof BUILDINGS];
    if (!bConfig) return;

    const w = bConfig.width;
    const h = bConfig.height;

    for (let bx = 0; bx < w; bx++) {
      for (let by = 0; by < h; by++) {
        const { x: wx, y: wy } = tileToWorld(preview.x + bx, preview.y + by);
        const halfW = TILE_SIZE * 0.5;
        const halfH = TILE_SIZE * 0.25;

        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + halfW, wy + halfH);
        ctx.lineTo(wx, wy + halfH * 2);
        ctx.lineTo(wx - halfW, wy + halfH);
        ctx.closePath();

        ctx.fillStyle = preview.valid ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)';
        ctx.fill();
        ctx.strokeStyle = preview.valid ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  private drawProjectiles(projectiles: Projectile[]) {
    const ctx = this.ctx;
    for (const p of projectiles) {
      const { x: wx, y: wy } = tileToWorld(p.currentX, p.currentY);
      const arcHeight = Math.sin(p.progress * Math.PI) * 25;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(wx, wy, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx, wy - arcHeight);
      ctx.lineTo(wx - 4, wy - arcHeight + 3);
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(wx - 4, wy - arcHeight + 2, 2, 2);
    }
  }

  private drawParticles(particles: GameParticle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      const { x: wx, y: wy } = tileToWorld(p.x, p.y);
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(wx, wy, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFloatingTexts(texts: FloatingText[]) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    for (const t of texts) {
      const { x: wx, y: wy } = tileToWorld(t.x, t.y);
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.fillStyle = t.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.strokeText(t.text, wx, wy);
      ctx.fillText(t.text, wx, wy);
    }
    ctx.restore();
  }
}
