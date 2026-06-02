// Player class types
export enum PlayerClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  REVENANT = 'revenant',
}

// Player stats interface
export interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  strength: number;
  defense: number;
  speed: number;
  intelligence: number;
  endurance: number;
  level: number;
  experience: number;
  experienceToLevel: number;
}

// Ability interface
export interface Ability {
  id: string;
  name: string;
  description: string;
  level: number;
  cooldown: number;
  currentCooldown: number;
  manaCost: number;
  damage: number;
  range: number;
  icon: string;
}

// Item interface
export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: Partial<PlayerStats>;
  quantity: number;
  description: string;
}

// Inventory interface
export interface Inventory {
  items: Item[];
  maxSlots: number;
  gold: number;
}

// Player interface
export interface Player {
  id: string;
  username: string;
  class: PlayerClass;
  stats: PlayerStats;
  abilities: Ability[];
  inventory: Inventory;
  position: { x: number; y: number };
  rotation: number;
  isMoving: boolean;
  isDead: boolean;
}

// Enemy interface
export interface Enemy {
  id: string;
  name: string;
  level: number;
  stats: PlayerStats;
  position: { x: number; y: number };
  rotation: number;
  targetId: string | null;
  isDead: boolean;
  lootTable: Item[];
}

// Combat event interface
export interface CombatEvent {
  attacker: string;
  defender: string;
  damage: number;
  ability: string;
  timestamp: number;
  isCritical: boolean;
}

// Network message interface
export interface NetworkMessage {
  type: 'player_move' | 'player_attack' | 'player_chat' | 'player_spawn' | 'enemy_spawn' | 'combat_event' | 'player_death' | 'loot_drop';
  playerId: string;
  data: any;
  timestamp: number;
}

// Game world interface
export interface GameWorld {
  width: number;
  height: number;
  tileSize: number;
  layers: TileLayer[];
}

// Tile layer interface
export interface TileLayer {
  name: string;
  data: number[];
  width: number;
  height: number;
  tileSize: number;
}
