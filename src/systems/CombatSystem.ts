import { PlayerStats } from '../types';

export class CombatSystem {
  /**
   * Calculate damage based on attacker stats, defender stats, and base damage
   */
  calculateDamage(
    attackerStats: PlayerStats,
    defenderStats: PlayerStats,
    baseDamage: number
  ): number {
    // Base damage calculation
    let damage = baseDamage + attackerStats.strength * 0.5;

    // Defense reduction
    const defenseReduction = defenderStats.defense * 0.1;
    damage = Math.max(1, damage - defenseReduction);

    // Critical hit chance (5% base)
    const critChance = 0.05;
    if (Math.random() < critChance) {
      damage *= 1.5; // 50% critical multiplier
    }

    // Variance (±10%)
    const variance = 1 + (Math.random() - 0.5) * 0.2;
    damage *= variance;

    return Math.floor(damage);
  }

  /**
   * Calculate experience gain from defeating an enemy
   */
  calculateExperience(enemyLevel: number, playerLevel: number): number {
    const baseExp = 50;
    const levelDifference = enemyLevel - playerLevel;
    let multiplier = 1;

    if (levelDifference > 0) {
      multiplier = 1 + levelDifference * 0.1;
    } else if (levelDifference < -5) {
      multiplier = 0.5;
    }

    return Math.floor(baseExp * multiplier);
  }

  /**
   * Calculate healing amount
   */
  calculateHealing(healerStats: PlayerStats, baseHealing: number): number {
    return Math.floor(baseHealing + healerStats.intelligence * 0.3);
  }

  /**
   * Calculate ability cooldown reduction from stats
   */
  calculateCooldownReduction(stats: PlayerStats): number {
    // Every 10 intelligence = 1% cooldown reduction
    return Math.min(0.5, stats.intelligence * 0.01);
  }

  /**
   * Check if an ability hits (accuracy calculation)
   */
  checkHit(attackerStats: PlayerStats, defenderStats: PlayerStats): boolean {
    const baseAccuracy = 0.85;
    const accuracyBonus = attackerStats.speed * 0.001;
    const dodgeBonus = defenderStats.speed * 0.001;

    const hitChance = baseAccuracy + accuracyBonus - dodgeBonus;
    return Math.random() < hitChance;
  }

  /**
   * Calculate damage over time (DoT) effect
   */
  calculateDotDamage(
    attackerStats: PlayerStats,
    defenderStats: PlayerStats,
    duration: number,
    tickInterval: number
  ): { totalDamage: number; damagePerTick: number; ticks: number } {
    const baseDamage = attackerStats.intelligence * 0.3;
    const damagePerTick = this.calculateDamage(attackerStats, defenderStats, baseDamage);
    const ticks = Math.floor(duration / tickInterval);
    const totalDamage = damagePerTick * ticks;

    return {
      totalDamage,
      damagePerTick,
      ticks,
    };
  }

  /**
   * Calculate threat/aggro for enemy AI
   */
  calculateThreat(
    damage: number,
    healingDone: number,
    distanceFromEnemy: number
  ): number {
    let threat = 0;

    // Damage generates threat
    threat += damage * 1;

    // Healing generates threat
    threat += healingDone * 0.5;

    // Distance modifier (closer = more threat)
    const distanceModifier = Math.max(0.5, 1 - distanceFromEnemy / 500);
    threat *= distanceModifier;

    return threat;
  }

  /**
   * Calculate loot drop chance
   */
  calculateLootChance(enemyLevel: number, playerLevel: number): number {
    const baseChance = 0.3;
    const levelDifference = enemyLevel - playerLevel;

    if (levelDifference >= 0) {
      return baseChance + levelDifference * 0.05;
    } else {
      return Math.max(0.1, baseChance - Math.abs(levelDifference) * 0.05);
    }
  }
}
