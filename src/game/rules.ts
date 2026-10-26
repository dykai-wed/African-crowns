// AFRICAN CROWNS: EMPIRES OF THE SUN
// Pure Game Rules & Logic (Decoupled and Unit-Testable)

import {
  BuildingCost,
  CivilizationId,
  HappinessBreakdown,
  PlacedBuilding,
  Population,
  Resources,
  TaxLevel,
} from './types';

export function canAfford(resources: Resources, cost: BuildingCost): boolean {
  return (
    resources.timber >= cost.timber &&
    resources.stone >= cost.stone &&
    resources.gold >= cost.gold
  );
}

export function deductResources(resources: Resources, cost: BuildingCost): Resources {
  if (!canAfford(resources, cost)) {
    throw new Error('Insufficient resources to complete this action');
  }
  return {
    ...resources,
    timber: Math.max(0, resources.timber - cost.timber),
    stone: Math.max(0, resources.stone - cost.stone),
    gold: Math.max(0, resources.gold - cost.gold),
  };
}

export function calculateFoodConsumption(populationCount: number): number {
  // 0.2 food per resident per tick/second
  return Math.max(0, Number((populationCount * 0.2).toFixed(2)));
}

export function calculateTaxIncome(taxLevel: TaxLevel, populationCount: number): number {
  const baseRate = {
    low: 0.15,
    moderate: 0.35,
    high: 0.70,
    tribute: 1.10,
  }[taxLevel];

  return Math.max(1, Math.round(populationCount * baseRate));
}

export function calculateHappiness(
  resources: Resources,
  population: Population,
  taxLevel: TaxLevel,
  hasFortifications: boolean,
  civilization: CivilizationId
): HappinessBreakdown {
  let score = 75; // baseline neutral satisfaction

  // Food satisfaction
  const foodPerCapita = population.total > 0 ? resources.food / population.total : 10;
  let foodFactor = 0;
  if (resources.food <= 0) {
    foodFactor = -35; // famine penalty
  } else if (foodPerCapita < 2) {
    foodFactor = -15; // low food warning
  } else if (foodPerCapita >= 5) {
    foodFactor = +15; // food abundance
  }

  // Tax effect
  const taxFactor = {
    low: +15,
    moderate: 0,
    high: -18,
    tribute: -35,
  }[taxLevel];

  // Housing factor
  let housingFactor = 0;
  if (population.total > population.maxCapacity) {
    housingFactor = -25; // severe overcrowding
  } else if (population.total === population.maxCapacity) {
    housingFactor = -5; // at capacity
  } else {
    housingFactor = +10; // spacious housing
  }

  // Security factor
  const securityFactor = hasFortifications ? +12 : 0;

  // Civilization nuances
  let civFactor = 0;
  if (civilization === 'benin' && hasFortifications) {
    civFactor = +5; // Benin reverence for defensive Iya earthworks
  }

  score = Math.max(5, Math.min(100, score + foodFactor + taxFactor + housingFactor + securityFactor + civFactor));

  let summary = 'The kingdom flourishes under your benevolent rule.';
  if (score < 30) {
    summary = 'Discontent brews! Starvation or oppressive taxation threatens the dynasty.';
  } else if (score < 50) {
    summary = 'The populace is restless. Lower taxes or harvest more grain to restore faith.';
  } else if (score >= 80) {
    summary = 'Prosperity and joy fill the courtyards! New settlers seek your crown.';
  }

  return {
    score,
    foodFactor,
    taxFactor,
    housingFactor,
    securityFactor,
    summary,
  };
}

export function checkPlacementCollision(
  newX: number,
  newY: number,
  newW: number,
  newH: number,
  existingBuildings: PlacedBuilding[],
  mapWidth: number,
  mapHeight: number,
  blockedTiles?: Set<string>
): boolean {
  // Check bounds
  if (newX < 1 || newY < 1 || newX + newW > mapWidth - 1 || newY + newH > mapHeight - 1) {
    return false;
  }

  // Check tile by tile overlap with existing buildings
  for (let bx = newX; bx < newX + newW; bx++) {
    for (let by = newY; by < newY + newH; by++) {
      const tileKey = `${bx},${by}`;
      if (blockedTiles && blockedTiles.has(tileKey)) {
        return false;
      }

      for (const b of existingBuildings) {
        if (
          bx >= b.x &&
          bx < b.x + b.width &&
          by >= b.y &&
          by < b.y + b.height
        ) {
          return false;
        }
      }
    }
  }

  return true;
}

export function calculateCombatDamage(
  attackerDamage: number,
  defenderDefense: number,
  isCavalryVsSpear: boolean = false
): number {
  let effectiveDamage = Math.max(3, attackerDamage - defenderDefense);
  if (isCavalryVsSpear) {
    effectiveDamage = Math.round(effectiveDamage * 0.6); // spearmen resist cavalry
  }
  return effectiveDamage;
}

export function checkVictory(rivalStrongholdHp: number): boolean {
  return rivalStrongholdHp <= 0;
}

export function checkDefeat(playerCompoundHp: number): boolean {
  return playerCompoundHp <= 0;
}
