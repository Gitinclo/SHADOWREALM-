import Phaser from 'phaser';
import { Player, Enemy, PlayerClass, PlayerStats, Ability } from '../types';
import { PlayerController } from '../systems/PlayerController';
import { CombatSystem } from '../systems/CombatSystem';
import { WorldGenerator } from '../systems/WorldGenerator';
import { NetworkManager } from '../systems/NetworkManager';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerData!: Player;
  private enemies: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private enemyData: Map<string, Enemy> = new Map();
  private playerController!: PlayerController;
  private combatSystem!: CombatSystem;
  private worldGenerator!: WorldGenerator;
  private networkManager!: NetworkManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private worldLayer!: Phaser.Tilemaps.TilemapLayer;
  private collisionsLayer!: Phaser.Tilemaps.TilemapLayer;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private damageTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load assets
    this.load.image('player', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjNjY2NmZmIi8+PC9zdmc+');
    this.load.image('enemy', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjZmY2NjY2Ii8+PC9zdmc+');
    this.load.image('projectile', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxjaXJjbGUgY3g9IjQiIGN5PSI0IiByPSI0IiBmaWxsPSIjZmZmZjAwIi8+PC9zdmc+');
  }

  create() {
    // Initialize systems
    this.worldGenerator = new WorldGenerator(this, 2560, 1440);
    this.combatSystem = new CombatSystem();
    this.networkManager = new NetworkManager();
    this.playerController = new PlayerController(this);

    // Create world
    const worldData = this.worldGenerator.generateWorld();
    this.createWorldTiles(worldData);

    // Create player
    this.playerData = this.createPlayerData();
    this.player = this.physics.add.sprite(640, 360, 'player');
    this.player.setScale(2);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);

    // Create projectiles group
    this.projectiles = this.physics.add.group();

    // Setup camera
    this.camera = this.cameras.main;
    this.camera.startFollow(this.player);
    this.camera.setBounds(0, 0, 2560, 1440);

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-SPACE', () => this.castAbility(0));
    this.input.keyboard!.on('keydown-Q', () => this.castAbility(1));
    this.input.keyboard!.on('keydown-W', () => this.castAbility(2));
    this.input.keyboard!.on('keydown-E', () => this.castAbility(3));

    // Spawn initial enemies
    this.spawnEnemies(5);

    // Setup physics collisions
    this.physics.add.collider(this.player, this.collisionsLayer);
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      // Enemy collision handling
    });

    // Network connection
    this.networkManager.connect('ws://localhost:8080');
    this.networkManager.on('enemy_spawn', (data: any) => this.handleEnemySpawn(data));
    this.networkManager.on('combat_event', (data: any) => this.handleCombatEvent(data));
  }

  update() {
    if (!this.playerData) return;

    // Update player movement
    const velocity = this.playerController.handleInput(this.cursors, this.player, this.playerData);
    this.playerData.position = { x: this.player.x, y: this.player.y };

    // Update enemy AI
    this.updateEnemyAI();

    // Update ability cooldowns
    this.updateAbilityCooldowns();

    // Send player position to network
    this.networkManager.sendMessage({
      type: 'player_move',
      playerId: this.playerData.id,
      data: {
        position: this.playerData.position,
        rotation: this.player.rotation,
      },
      timestamp: Date.now(),
    });

    // Update damage text positions
    this.damageTexts = this.damageTexts.filter(text => {
      text.y -= 2;
      if (text.y < text.getData('startY') - 50) {
        text.destroy();
        return false;
      }
      return true;
    });
  }

  private createPlayerData(): Player {
    const stats: PlayerStats = {
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      strength: 95,
      defense: 80,
      speed: 60,
      intelligence: 40,
      endurance: 85,
      level: 1,
      experience: 0,
      experienceToLevel: 100,
    };

    const abilities: Ability[] = [
      {
        id: 'shadow_slash',
        name: 'Shadow Slash',
        description: 'Basic attack infused with shadow energy',
        level: 1,
        cooldown: 0.5,
        currentCooldown: 0,
        manaCost: 0,
        damage: 20,
        range: 50,
        icon: 'shadow_slash',
      },
      {
        id: 'dark_cleave',
        name: 'Dark Cleave',
        description: 'Powerful spinning attack hitting all enemies',
        level: 10,
        cooldown: 6,
        currentCooldown: 0,
        manaCost: 20,
        damage: 50,
        range: 100,
        icon: 'dark_cleave',
      },
      {
        id: 'void_shield',
        name: 'Void Shield',
        description: 'Create a protective barrier absorbing damage',
        level: 20,
        cooldown: 8,
        currentCooldown: 0,
        manaCost: 30,
        damage: 0,
        range: 0,
        icon: 'void_shield',
      },
      {
        id: 'chaos_bringer',
        name: 'Chaos Bringer',
        description: 'Ultimate ability - massive area damage',
        level: 50,
        cooldown: 30,
        currentCooldown: 0,
        manaCost: 100,
        damage: 150,
        range: 200,
        icon: 'chaos_bringer',
      },
    ];

    return {
      id: 'player_' + Phaser.Math.RND.uuid(),
      username: 'Player',
      class: PlayerClass.WARRIOR,
      stats,
      abilities,
      inventory: {
        items: [],
        maxSlots: 20,
        gold: 0,
      },
      position: { x: 640, y: 360 },
      rotation: 0,
      isMoving: false,
      isDead: false,
    };
  }

  private createWorldTiles(worldData: any) {
    // Create a simple tilemap
    const map = this.make.tilemap({ width: 80, height: 45, tileWidth: 32, tileHeight: 32 });
    const tileset = map.addTilesetImage('tiles', undefined, 32, 32);

    // Create layers
    this.worldLayer = map.createBlankDynamicLayer('world', tileset);
    this.collisionsLayer = map.createBlankDynamicLayer('collisions', tileset);

    // Fill with random tiles
    for (let y = 0; y < 45; y++) {
      for (let x = 0; x < 80; x++) {
        const tile = Phaser.Math.Between(1, 4);
        this.worldLayer.putTileAt(tile, x, y);

        // Add some collision tiles
        if (Phaser.Math.Between(0, 100) < 20) {
          this.collisionsLayer.putTileAt(5, x, y);
        }
      }
    }

    this.collisionsLayer.setCollisionByExclusion([-1]);
  }

  private spawnEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(100, 2460);
      const y = Phaser.Math.Between(100, 1340);

      const enemySprite = this.physics.add.sprite(x, y, 'enemy');
      enemySprite.setScale(2);
      enemySprite.setCollideWorldBounds(true);
      enemySprite.setBounce(0.2);

      const enemy: Enemy = {
        id: 'enemy_' + i,
        name: 'Shadow Goblin',
        level: 1,
        stats: {
          health: 30,
          maxHealth: 30,
          mana: 10,
          maxMana: 10,
          strength: 20,
          defense: 10,
          speed: 40,
          intelligence: 10,
          endurance: 20,
          level: 1,
          experience: 50,
          experienceToLevel: 100,
        },
        position: { x, y },
        rotation: 0,
        targetId: null,
        isDead: false,
        lootTable: [],
      };

      this.enemies.set(enemy.id, enemySprite);
      this.enemyData.set(enemy.id, enemy);
    }
  }

  private updateEnemyAI() {
    this.enemyData.forEach((enemy, id) => {
      if (enemy.isDead) return;

      const sprite = this.enemies.get(id);
      if (!sprite) return;

      // Simple AI: move towards player if in range
      const distance = Phaser.Math.Distance.Between(
        enemy.position.x,
        enemy.position.y,
        this.playerData.position.x,
        this.playerData.position.y
      );

      if (distance < 300) {
        const angle = Phaser.Math.Angle.Between(
          enemy.position.x,
          enemy.position.y,
          this.playerData.position.x,
          this.playerData.position.y
        );

        const speed = 60;
        sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        enemy.targetId = this.playerData.id;

        // Attack if in range
        if (distance < 50 && Phaser.Math.Between(0, 100) < 5) {
          this.enemyAttack(enemy);
        }
      } else {
        sprite.setVelocity(0, 0);
        enemy.targetId = null;
      }

      enemy.position = { x: sprite.x, y: sprite.y };
    });
  }

  private castAbility(abilityIndex: number) {
    const ability = this.playerData.abilities[abilityIndex];
    if (!ability || ability.currentCooldown > 0) return;
    if (this.playerData.stats.mana < ability.manaCost) return;

    // Reduce mana
    this.playerData.stats.mana -= ability.manaCost;

    // Reset cooldown
    ability.currentCooldown = ability.cooldown;

    // Find enemies in range
    this.enemyData.forEach((enemy, id) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        this.playerData.position.x,
        this.playerData.position.y,
        enemy.position.x,
        enemy.position.y
      );

      if (distance < ability.range) {
        const damage = this.combatSystem.calculateDamage(
          this.playerData.stats,
          enemy.stats,
          ability.damage
        );

        enemy.stats.health -= damage;

        // Show damage text
        const damageText = this.add.text(enemy.position.x, enemy.position.y, damage.toString(), {
          fontSize: '24px',
          color: '#ff0000',
          fontStyle: 'bold',
        });
        damageText.setData('startY', enemy.position.y);
        this.damageTexts.push(damageText);

        // Network broadcast
        this.networkManager.sendMessage({
          type: 'combat_event',
          playerId: this.playerData.id,
          data: {
            attacker: this.playerData.id,
            defender: enemy.id,
            damage,
            ability: ability.id,
            isCritical: damage > ability.damage * 1.5,
          },
          timestamp: Date.now(),
        });

        if (enemy.stats.health <= 0) {
          this.enemyDeath(enemy);
        }
      }
    });
  }

  private enemyAttack(enemy: Enemy) {
    const damage = this.combatSystem.calculateDamage(
      enemy.stats,
      this.playerData.stats,
      15
    );

    this.playerData.stats.health -= damage;

    // Show damage text
    const damageText = this.add.text(this.playerData.position.x, this.playerData.position.y, damage.toString(), {
      fontSize: '24px',
      color: '#ff6666',
      fontStyle: 'bold',
    });
    damageText.setData('startY', this.playerData.position.y);
    this.damageTexts.push(damageText);

    if (this.playerData.stats.health <= 0) {
      this.playerDeath();
    }
  }

  private updateAbilityCooldowns() {
    const delta = 1 / 60; // Assuming 60 FPS
    this.playerData.abilities.forEach(ability => {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown -= delta;
      }
    });
  }

  private enemyDeath(enemy: Enemy) {
    enemy.isDead = true;
    const sprite = this.enemies.get(enemy.id);
    if (sprite) {
      sprite.destroy();
      this.enemies.delete(enemy.id);
    }

    // Award experience
    this.playerData.stats.experience += enemy.stats.experience;
    if (this.playerData.stats.experience >= this.playerData.stats.experienceToLevel) {
      this.levelUp();
    }

    // Respawn enemy
    setTimeout(() => this.spawnEnemies(1), 5000);
  }

  private playerDeath() {
    this.playerData.isDead = true;
    this.player.setActive(false);
    this.scene.restart();
  }

  private levelUp() {
    this.playerData.stats.level++;
    this.playerData.stats.experience = 0;
    this.playerData.stats.experienceToLevel = Math.floor(this.playerData.stats.experienceToLevel * 1.1);
    this.playerData.stats.maxHealth += 10;
    this.playerData.stats.health = this.playerData.stats.maxHealth;
  }

  private handleEnemySpawn(data: any) {
    // Handle network enemy spawn
  }

  private handleCombatEvent(data: any) {
    // Handle network combat events
  }
}
