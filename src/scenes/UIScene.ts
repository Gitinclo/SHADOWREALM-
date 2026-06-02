import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Graphics;
  private manaBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private expText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private abilityButtons: Phaser.GameObjects.Rectangle[] = [];
  private cooldownTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Create health bar
    this.healthBar = this.make.graphics({ x: 20, y: 20, add: true });
    this.drawHealthBar(100, 100);

    // Create mana bar
    this.manaBar = this.make.graphics({ x: 20, y: 50, add: true });
    this.drawManaBar(50, 50);

    // Create text displays
    this.levelText = this.add.text(20, 80, 'Level: 1', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
    });

    this.expText = this.add.text(20, 100, 'EXP: 0/100', {
      fontSize: '14px',
      color: '#ffff00',
      fontFamily: 'Arial',
    });

    this.goldText = this.add.text(20, 120, 'Gold: 0', {
      fontSize: '14px',
      color: '#ffd700',
      fontFamily: 'Arial',
    });

    // Create ability buttons
    this.createAbilityButtons();

    // Set camera to fixed position
    this.cameras.main.setScroll(0, 0);
  }

  private drawHealthBar(current: number, max: number) {
    this.healthBar.clear();
    this.healthBar.fillStyle(0x333333, 1);
    this.healthBar.fillRect(0, 0, 200, 20);
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(0, 0, (current / max) * 200, 20);
    this.healthBar.strokeStyle(0xffffff, 2);
    this.healthBar.strokeRect(0, 0, 200, 20);
  }

  private drawManaBar(current: number, max: number) {
    this.manaBar.clear();
    this.manaBar.fillStyle(0x333333, 1);
    this.manaBar.fillRect(0, 0, 200, 20);
    this.manaBar.fillStyle(0x0000ff, 1);
    this.manaBar.fillRect(0, 0, (current / max) * 200, 20);
    this.manaBar.strokeStyle(0xffffff, 2);
    this.manaBar.strokeRect(0, 0, 200, 20);
  }

  private createAbilityButtons() {
    const abilities = ['Q', 'W', 'E', 'R'];
    const startX = 1280 - 250;
    const startY = 720 - 80;

    abilities.forEach((key, index) => {
      const x = startX + index * 60;
      const y = startY;

      // Button background
      const button = this.add.rectangle(x, y, 50, 50, 0x6b4c9a, 0.8);
      button.setStrokeStyle(2, 0xb366ff);
      button.setInteractive();
      this.abilityButtons.push(button);

      // Button label
      this.add.text(x, y - 5, key, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial',
      }).setOrigin(0.5);

      // Cooldown text
      const cooldownText = this.add.text(x, y + 5, '', {
        fontSize: '12px',
        color: '#ff0000',
        fontStyle: 'bold',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.cooldownTexts.push(cooldownText);
    });
  }

  update() {
    // Update UI elements from game state
    // This would be connected to the GameScene data
  }
}
