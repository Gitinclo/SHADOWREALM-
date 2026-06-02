import Phaser from 'phaser';

export class WorldGenerator {
  private scene: Phaser.Scene;
  private width: number;
  private height: number;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;
  }

  /**
   * Generate a procedural world using Perlin noise-like algorithm
   */
  generateWorld() {
    const tileSize = 32;
    const tilesX = Math.floor(this.width / tileSize);
    const tilesY = Math.floor(this.height / tileSize);

    const terrain = this.generateTerrain(tilesX, tilesY);
    const dungeons = this.generateDungeons(tilesX, tilesY, terrain);
    const npcs = this.generateNPCLocations(tilesX, tilesY, terrain);

    return {
      terrain,
      dungeons,
      npcs,
      width: this.width,
      height: this.height,
      tileSize,
    };
  }

  /**
   * Generate terrain using simple noise algorithm
   */
  private generateTerrain(width: number, height: number): number[][] {
    const terrain: number[][] = [];

    for (let y = 0; y < height; y++) {
      terrain[y] = [];
      for (let x = 0; x < width; x++) {
        // Simple noise-like generation
        const value = this.perlinNoise(x, y, 0.1);
        
        if (value < 0.3) {
          terrain[y][x] = 0; // Water
        } else if (value < 0.5) {
          terrain[y][x] = 1; // Grass
        } else if (value < 0.7) {
          terrain[y][x] = 2; // Forest
        } else {
          terrain[y][x] = 3; // Mountain
        }
      }
    }

    return terrain;
  }

  /**
   * Generate dungeon locations
   */
  private generateDungeons(width: number, height: number, terrain: number[][]): any[] {
    const dungeons = [];
    const dungeonCount = Phaser.Math.Between(5, 10);

    for (let i = 0; i < dungeonCount; i++) {
      let x, y, valid = false;

      // Find valid dungeon location (in mountains)
      while (!valid) {
        x = Phaser.Math.Between(0, width - 1);
        y = Phaser.Math.Between(0, height - 1);
        valid = terrain[y] && terrain[y][x] === 3; // Mountain
      }

      dungeons.push({
        id: `dungeon_${i}`,
        name: this.generateDungeonName(),
        x: x * 32,
        y: y * 32,
        level: Phaser.Math.Between(1, 5),
        difficulty: ['easy', 'normal', 'hard', 'nightmare'][Phaser.Math.Between(0, 3)],
        bosses: Phaser.Math.Between(1, 3),
      });
    }

    return dungeons;
  }

  /**
   * Generate NPC locations
   */
  private generateNPCLocations(width: number, height: number, terrain: number[][]): any[] {
    const npcs = [];
    const npcCount = Phaser.Math.Between(10, 20);

    const npcTypes = [
      { name: 'Merchant', role: 'trader' },
      { name: 'Guard', role: 'warrior' },
      { name: 'Mage', role: 'spellcaster' },
      { name: 'Healer', role: 'support' },
      { name: 'Quest Giver', role: 'quest' },
    ];

    for (let i = 0; i < npcCount; i++) {
      let x, y, valid = false;

      // Find valid NPC location (not in water or mountains)
      while (!valid) {
        x = Phaser.Math.Between(0, width - 1);
        y = Phaser.Math.Between(0, height - 1);
        valid = terrain[y] && terrain[y][x] > 0 && terrain[y][x] < 3;
      }

      const npcType = Phaser.Utils.Array.GetRandom(npcTypes);

      npcs.push({
        id: `npc_${i}`,
        name: `${npcType.name} ${i}`,
        type: npcType.role,
        x: x * 32,
        y: y * 32,
        dialogue: this.generateDialogue(npcType.role),
        quests: this.generateQuests(npcType.role),
      });
    }

    return npcs;
  }

  /**
   * Simple Perlin-like noise function
   */
  private perlinNoise(x: number, y: number, scale: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Generate random dungeon name
   */
  private generateDungeonName(): string {
    const prefixes = ['Shadow', 'Dark', 'Void', 'Cursed', 'Ancient', 'Forgotten'];
    const suffixes = ['Crypt', 'Cavern', 'Tomb', 'Lair', 'Fortress', 'Temple'];

    const prefix = Phaser.Utils.Array.GetRandom(prefixes);
    const suffix = Phaser.Utils.Array.GetRandom(suffixes);

    return `${prefix} ${suffix}`;
  }

  /**
   * Generate NPC dialogue
   */
  private generateDialogue(role: string): string {
    const dialogues: { [key: string]: string[] } = {
      trader: [
        'Welcome to my shop! I have the finest equipment in the realm.',
        'Looking for supplies? I have everything you need.',
        'Interested in trading? I offer fair prices.',
      ],
      warrior: [
        'The realm is dangerous. Stay alert!',
        'Have you seen any monsters around here?',
        'I am always ready for battle.',
      ],
      spellcaster: [
        'Magic flows through this land.',
        'Would you like to learn a spell?',
        'The arcane arts are powerful, use them wisely.',
      ],
      support: [
        'Are you injured? I can help.',
        'Let me heal your wounds.',
        'Health is wealth, friend.',
      ],
      quest: [
        'I have a task that needs completing.',
        'Will you help me with this quest?',
        'There is danger ahead, but great rewards await.',
      ],
    };

    return Phaser.Utils.Array.GetRandom(dialogues[role] || dialogues.trader);
  }

  /**
   * Generate quests for NPCs
   */
  private generateQuests(role: string): any[] {
    const quests = [];
    const questCount = Phaser.Math.Between(1, 3);

    for (let i = 0; i < questCount; i++) {
      quests.push({
        id: `quest_${i}`,
        name: this.generateQuestName(),
        description: 'Complete this objective to earn rewards.',
        reward: {
          experience: Phaser.Math.Between(100, 500),
          gold: Phaser.Math.Between(50, 200),
          items: [],
        },
        difficulty: ['easy', 'normal', 'hard'][Phaser.Math.Between(0, 2)],
      });
    }

    return quests;
  }

  /**
   * Generate random quest name
   */
  private generateQuestName(): string {
    const actions = ['Defeat', 'Collect', 'Rescue', 'Protect', 'Investigate', 'Retrieve'];
    const targets = ['Goblins', 'Bandits', 'Artifacts', 'Prisoners', 'Treasures', 'Secrets'];

    const action = Phaser.Utils.Array.GetRandom(actions);
    const target = Phaser.Utils.Array.GetRandom(targets);

    return `${action} the ${target}`;
  }
}
