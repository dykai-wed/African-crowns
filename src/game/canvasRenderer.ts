// AFRICAN CROWNS: EMPIRES OF THE SUN
// High-Performance 2.5D Isometric Canvas Renderer with Viewport Culling & Multi-Biome Terrain

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

export function tileToWorld(tx: number, ty: number): { x: number; y: number } {
  const x = (tx - ty) * (TILE_SIZE * 0.5);
  const y = (tx + ty) * (TILE_SIZE * 0.25);
  return { x, y };
}

export function screenToTile(
  screenX: number,
  screenY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  // Undo camera translation and zoom
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

    // Viewport Culling Bounds in World Space
    const halfViewW = (canvasWidth * 0.5) / camera.zoom;
    const halfViewH = (canvasHeight * 0.5) / camera.zoom;
    const viewMinX = camera.x - halfViewW - 120;
    const viewMaxX = camera.x + halfViewW + 120;
    const viewMinY = camera.y - halfViewH - 120;
    const viewMaxY = camera.y + halfViewH + 120;

    // Clear viewport with warm African nocturnal/earth tone
    ctx.fillStyle = '#180f09';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.save();
    // Center camera
    ctx.translate(canvasWidth * 0.5, canvasHeight * 0.5);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Ground Tiles with Viewport Culling
    this.drawTerrain(worldTiles, mapWidth, mapHeight, viewMinX, viewMaxX, viewMinY, viewMaxY);

    // 2. Draw Natural Terrain Resources (Culling check)
    this.drawTerrainResources(terrain, viewMinX, viewMaxX, viewMinY, viewMaxY);

    // 3. Draw Placement Preview if active
    if (placementPreview) {
      this.drawPlacementPreview(placementPreview);
    }

    // 4. Collect depth-sortable entities (Buildings and Units)
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

    // 5. Draw Flying Projectiles (Arrows)
    this.drawProjectiles(projectiles);

    // 6. Draw Particles (Smoke, Sparks, Dust)
    this.drawParticles(particles);

    // 7. Draw Floating Numbers
    this.drawFloatingTexts(floatingTexts);

    ctx.restore();
  }

  private drawTerrain(
    worldTiles: WorldTile[][],
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

        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + halfW, wy + halfH);
        ctx.lineTo(wx, wy + halfH * 2);
        ctx.lineTo(wx - halfW, wy + halfH);
        ctx.closePath();

        if (isRiver) {
          // Living river water
          const shimmer = Math.sin(this.animTick + (x + y) * 0.7) * 14;
          ctx.fillStyle = `rgb(24, ${90 + shimmer}, ${155 + shimmer})`;
          ctx.fill();

          ctx.strokeStyle = 'rgba(125, 211, 252, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // River flow ripple
          ctx.beginPath();
          ctx.moveTo(wx - 8, wy + halfH);
          ctx.lineTo(wx + 8, wy + halfH);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.stroke();
        } else if (isFord) {
          // Translucent shallow ford with stepping stones
          ctx.fillStyle = '#4895ef';
          ctx.fill();

          ctx.fillStyle = '#b08968';
          ctx.beginPath();
          ctx.arc(wx - 3, wy + halfH - 2, 3, 0, Math.PI * 2);
          ctx.arc(wx + 4, wy + halfH + 2, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Biome-specific coloring with subtle natural noise
          const baseColor = tile ? tile.color : '#b7791f';
          ctx.fillStyle = baseColor;
          ctx.fill();

          // Subtle organic tile boundary
          ctx.strokeStyle = 'rgba(50, 20, 5, 0.12)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

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

      // Culling
      if (wx < minX || wx > maxX || wy < minY || wy > maxY) {
        continue;
      }

      if (res.type === 'tree') {
        // Acacia & Baobab African Tree
        // Ground shadow
        ctx.beginPath();
        ctx.ellipse(wx, wy + 8, 14, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();

        // Sturdy Trunk
        ctx.fillStyle = '#5c3317';
        ctx.fillRect(wx - 3, wy - 18, 6, 20);

        // Broad flat-topped umbrella savannah acacia canopy
        ctx.beginPath();
        ctx.ellipse(wx, wy - 22, 22, 11, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#3f6212';
        ctx.fill();
        ctx.strokeStyle = '#273f0c';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(wx - 2, wy - 25, 16, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#4d7c0f';
        ctx.fill();
      } else if (res.type === 'rock') {
        // Granite Boulder
        ctx.beginPath();
        ctx.ellipse(wx, wy + 4, 12, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(wx - 10, wy + 2);
        ctx.lineTo(wx - 6, wy - 10);
        ctx.lineTo(wx + 4, wy - 12);
        ctx.lineTo(wx + 11, wy - 2);
        ctx.lineTo(wx + 7, wy + 6);
        ctx.lineTo(wx - 7, wy + 6);
        ctx.closePath();
        ctx.fillStyle = '#78716c';
        ctx.fill();
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (res.type === 'gold_vein') {
        // Sparkling Gold Vein
        ctx.beginPath();
        ctx.ellipse(wx, wy + 4, 14, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        // Quartz rock
        ctx.beginPath();
        ctx.arc(wx, wy - 4, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#57534e';
        ctx.fill();

        // Sparkling gold crystals
        const sparkle = Math.sin(this.animTick * 3 + res.x) * 2;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(wx - 3, wy - 6, 3 + sparkle * 0.3, 0, Math.PI * 2);
        ctx.arc(wx + 4, wy - 3, 2.5, 0, Math.PI * 2);
        ctx.arc(wx, wy - 1, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

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
    const renderList: Array<{ type: 'building' | 'unit'; depth: number; data: PlacedBuilding | GameUnit }> = [];

    buildings.forEach((b) => {
      const { x: wx, y: wy } = tileToWorld(b.x + b.width * 0.5, b.y + b.height * 0.5);
      if (wx >= minX - 80 && wx <= maxX + 80 && wy >= minY - 80 && wy <= maxY + 80) {
        const depth = b.x + b.width * 0.5 + b.y + b.height * 0.5;
        renderList.push({ type: 'building', depth, data: b });
      }
    });

    units.forEach((u) => {
      const { x: wx, y: wy } = tileToWorld(u.x, u.y);
      if (wx >= minX - 60 && wx <= maxX + 60 && wy >= minY - 60 && wy <= maxY + 60) {
        const depth = u.x + u.y;
        renderList.push({ type: 'unit', depth, data: u });
      }
    });

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

  private drawBuilding(b: PlacedBuilding, isSelected: boolean) {
    const ctx = this.ctx;
    const { x: wx, y: wy } = tileToWorld(b.x + b.width * 0.5, b.y + b.height * 0.5);

    // Selection ring
    if (isSelected) {
      ctx.beginPath();
      ctx.ellipse(wx, wy + 4, b.width * 18, b.height * 10, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Shadow on ground
    ctx.beginPath();
    ctx.ellipse(wx, wy + 6, b.width * 16, b.height * 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    // Under construction scaffolding
    if (!b.isConstructed) {
      this.drawUnderConstruction(wx, wy, b);
      return;
    }

    const isRival = b.owner === 'rival';
    const mainMudColor = isRival ? '#7f1d1d' : '#854d0e';
    const trimColor = isRival ? '#dc2626' : '#d97706';

    switch (b.type) {
      case 'compound':
        this.drawRoyalCompound(wx, wy, isRival);
        break;
      case 'house':
        this.drawRoundhouse(wx, wy);
        break;
      case 'farm':
        this.drawFarm(wx, wy);
        break;
      case 'granary':
        this.drawGranary(wx, wy);
        break;
      case 'lumber_camp':
        this.drawLumberCamp(wx, wy);
        break;
      case 'quarry':
        this.drawQuarry(wx, wy);
        break;
      case 'gold_mine':
        this.drawGoldMine(wx, wy);
        break;
      case 'market':
        this.drawMarket(wx, wy);
        break;
      case 'wall':
        this.drawWall(wx, wy, mainMudColor);
        break;
      case 'gate':
        this.drawGate(wx, wy, mainMudColor);
        break;
      case 'tower':
        this.drawTower(wx, wy, mainMudColor, trimColor);
        break;
      case 'barracks':
        this.drawBarracks(wx, wy, mainMudColor, trimColor);
        break;
      default:
        ctx.fillStyle = mainMudColor;
        ctx.fillRect(wx - 16, wy - 24, 32, 28);
        break;
    }

    // Health bar if damaged
    if (b.hp < b.maxHp) {
      const barW = Math.max(30, b.width * 18);
      const barH = 5;
      const barX = wx - barW * 0.5;
      const barY = wy - b.height * 18 - 20;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      const hpRatio = Math.max(0, b.hp / b.maxHp);
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }
  }

  private drawUnderConstruction(wx: number, wy: number, b: PlacedBuilding) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;

    const w = b.width * 14;
    const h = b.height * 14;

    ctx.strokeRect(wx - w, wy - h, w * 2, h);

    ctx.beginPath();
    ctx.moveTo(wx - w, wy - h);
    ctx.lineTo(wx + w, wy);
    ctx.moveTo(wx + w, wy - h);
    ctx.lineTo(wx - w, wy);
    ctx.stroke();

    const progressH = h * b.constructionProgress;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(wx - w + 2, wy - progressH, (w - 2) * 2, progressH);

    const barW = 32;
    const barH = 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(wx - barW * 0.5, wy - h - 10, barW, barH);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(wx - barW * 0.5, wy - h - 10, barW * b.constructionProgress, barH);
  }

  private drawRoyalCompound(wx: number, wy: number, isRival: boolean) {
    const ctx = this.ctx;
    const baseColor = isRival ? '#7f1d1d' : '#92400e';
    const topColor = isRival ? '#b91c1c' : '#b45309';

    // Tier 1 Base
    ctx.fillStyle = baseColor;
    ctx.fillRect(wx - 28, wy - 30, 56, 32);

    // Toron wooden beams
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    for (let i = -24; i <= 24; i += 8) {
      ctx.beginPath();
      ctx.moveTo(wx + i, wy - 22);
      ctx.lineTo(wx + i + 4, wy - 20);
      ctx.stroke();
    }

    // Tier 2 Court
    ctx.fillStyle = topColor;
    ctx.fillRect(wx - 20, wy - 48, 40, 20);

    // Conical Sudano-Sahelian Adobe Pinnacles
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(wx - 18, wy - 48);
    ctx.lineTo(wx - 15, wy - 62);
    ctx.lineTo(wx - 12, wy - 48);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(wx + 12, wy - 48);
    ctx.lineTo(wx + 15, wy - 62);
    ctx.lineTo(wx + 18, wy - 48);
    ctx.fill();

    // Central Minaret
    ctx.beginPath();
    ctx.moveTo(wx - 5, wy - 48);
    ctx.lineTo(wx, wy - 68);
    ctx.lineTo(wx + 5, wy - 48);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(wx, wy - 55, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();

    // Portal
    ctx.fillStyle = '#291205';
    ctx.beginPath();
    ctx.arc(wx, wy - 10, 7, Math.PI, 0, false);
    ctx.lineTo(wx + 7, wy + 2);
    ctx.lineTo(wx - 7, wy + 2);
    ctx.closePath();
    ctx.fill();

    // Banner
    const wave = Math.sin(this.animTick * 2) * 3;
    ctx.fillStyle = isRival ? '#ef4444' : '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(wx + 15, wy - 62);
    ctx.lineTo(wx + 26 + wave, wy - 60);
    ctx.lineTo(wx + 22 + wave, wy - 53);
    ctx.lineTo(wx + 15, wy - 55);
    ctx.closePath();
    ctx.fill();
  }

  private drawRoundhouse(wx: number, wy: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(wx, wy - 8, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5c2d0c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(wx - 16, wy - 8);
    ctx.lineTo(wx, wy - 28);
    ctx.lineTo(wx + 16, wy - 8);
    ctx.closePath();
    ctx.fillStyle = '#ca8a04';
    ctx.fill();
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#291205';
    ctx.fillRect(wx - 3, wy - 4, 6, 7);
  }

  private drawFarm(wx: number, wy: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#5c2d0c';
    ctx.fillRect(wx - 18, wy - 12, 36, 18);

    const sway = Math.sin(this.animTick + wx) * 1.5;
    ctx.fillStyle = '#65a30d';
    for (let r = -12; r <= 12; r += 6) {
      for (let c = -8; c <= 4; c += 5) {
        ctx.fillRect(wx + r + sway, wy + c - 6, 2, 6);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(wx + r + sway - 1, wy + c - 9, 4, 3);
        ctx.fillStyle = '#65a30d';
      }
    }
  }

  private drawGranary(wx: number, wy: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#57534e';
    ctx.fillRect(wx - 10, wy - 6, 3, 10);
    ctx.fillRect(wx + 7, wy - 6, 3, 10);

    ctx.fillStyle = '#a16207';
    ctx.fillRect(wx - 12, wy - 22, 24, 18);

    ctx.beginPath();
    ctx.moveTo(wx - 14, wy - 22);
    ctx.lineTo(wx, wy - 36);
    ctx.lineTo(wx + 14, wy - 22);
    ctx.closePath();
    ctx.fillStyle = '#d97706';
    ctx.fill();
  }

  private drawLumberCamp(wx: number, wy: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(wx - 14, wy - 8, 14, 5);
    ctx.fillRect(wx - 12, wy - 13, 10, 5);

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wx + 4, wy + 2);
    ctx.lineTo(wx + 4, wy - 18);
    ctx.lineTo(wx + 18, wy - 18);
    ctx.lineTo(wx + 18, wy + 2);
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.fillRect(wx + 2, wy - 22, 18, 5);
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(wx - 2, wy - 2, 6, 6);
  }

  private drawQuarry(wx: number, wy: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#44403c';
    ctx.fillRect(wx - 16, wy - 10, 32, 16);
    ctx.fillStyle = '#78716c';
    ctx.fillRect(wx - 12, wy - 6, 24, 10);

    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(wx - 10, wy - 14, 7, 6);
    ctx.fillRect(wx + 2, wy - 12, 8, 6);
  }

  private drawGoldMine(wx: number, wy: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(wx - 8, wy - 6, 16, 12);

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(wx - 14, wy + 4);
    ctx.lineTo(wx, wy - 28);
    ctx.lineTo(wx + 14, wy + 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(wx, wy - 24, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ca8a04';
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.fillRect(wx + 8, wy - 2, 6, 4);
  }

  private drawMarket(wx: number, wy: number) {
    const ctx = this.ctx;
    const canopies = [
      { x: wx - 14, col: '#dc2626' },
      { x: wx - 2, col: '#f59e0b' },
      { x: wx + 10, col: '#16a34a' },
    ];

    canopies.forEach((c) => {
      ctx.fillStyle = c.col;
      ctx.beginPath();
      ctx.ellipse(c.x, wy - 16, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x, wy - 16);
      ctx.lineTo(c.x, wy + 2);
      ctx.stroke();
    });

    ctx.fillStyle = '#a16207';
    ctx.fillRect(wx - 14, wy - 2, 28, 6);
  }

  private drawWall(wx: number, wy: number, color: string) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(wx - 12, wy - 16, 24, 18);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(wx - 12, wy - 21, 6, 5);
    ctx.fillRect(wx + 6, wy - 21, 6, 5);

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.strokeRect(wx - 12, wy - 16, 24, 18);
  }

  private drawGate(wx: number, wy: number, color: string) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(wx - 18, wy - 22, 10, 24);
    ctx.fillRect(wx + 8, wy - 22, 10, 24);
    ctx.fillRect(wx - 18, wy - 26, 36, 6);

    ctx.fillStyle = '#3f1d0b';
    ctx.fillRect(wx - 8, wy - 16, 16, 18);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(wx - 5, wy - 10, 2, 2);
    ctx.fillRect(wx + 3, wy - 10, 2, 2);
  }

  private drawTower(wx: number, wy: number, mainColor: string, trimColor: string) {
    const ctx = this.ctx;
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(wx - 12, wy + 2);
    ctx.lineTo(wx - 9, wy - 42);
    ctx.lineTo(wx + 9, wy - 42);
    ctx.lineTo(wx + 12, wy + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = trimColor;
    ctx.fillRect(wx - 12, wy - 48, 24, 6);

    ctx.beginPath();
    ctx.moveTo(wx - 8, wy - 48);
    ctx.lineTo(wx, wy - 58);
    ctx.lineTo(wx + 8, wy - 48);
    ctx.fill();

    ctx.fillStyle = '#1c140e';
    ctx.fillRect(wx - 1.5, wy - 28, 3, 10);
  }

  private drawBarracks(wx: number, wy: number, mainColor: string, trimColor: string) {
    const ctx = this.ctx;
    ctx.fillStyle = mainColor;
    ctx.fillRect(wx - 24, wy - 24, 48, 26);

    ctx.fillStyle = trimColor;
    ctx.beginPath();
    ctx.moveTo(wx - 26, wy - 24);
    ctx.lineTo(wx, wy - 40);
    ctx.lineTo(wx + 26, wy - 24);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(wx, wy - 15, 6, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawUnit(u: GameUnit, isSelected: boolean) {
    const ctx = this.ctx;
    const { x: wx, y: wy } = tileToWorld(u.x, u.y);

    if (isSelected) {
      ctx.beginPath();
      ctx.ellipse(wx, wy + 2, 11, 6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(wx, wy + 2, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();
    }

    const isRival = u.owner === 'rival';
    const tunicColor = isRival ? '#dc2626' : u.type === 'cavalry' ? '#f59e0b' : '#38bdf8';

    const isMoving = u.state === 'moving';
    const bob = isMoving ? Math.sin(this.animTick * 6 + u.x * 2) * 2 : 0;

    if (u.type === 'cavalry') {
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
