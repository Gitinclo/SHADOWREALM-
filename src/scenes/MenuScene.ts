import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor('#0a0e27');

    // Title
    this.add.text(640, 100, 'ShadowRealm', {
      fontSize: '64px',
      color: '#b366ff',
      fontStyle: 'bold',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(640, 160, 'Open World MMORPG', {
      fontSize: '24px',
      color: '#00ffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Play button
    const playButton = this.add.rectangle(640, 300, 200, 50, 0x6b4c9a, 0.8);
    playButton.setStrokeStyle(2, 0xb366ff);
    playButton.setInteractive();
    playButton.on('pointerover', () => playButton.setFillStyle(0x8b5cba));
    playButton.on('pointerout', () => playButton.setFillStyle(0x6b4c9a));
    playButton.on('pointerdown', () => this.scene.start('GameScene'));

    this.add.text(640, 300, 'Play Game', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Class selection
    this.add.text(640, 400, 'Select Your Class', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const classes = [
      { name: 'Warrior', x: 400 },
      { name: 'Mage', x: 640 },
      { name: 'Revenant', x: 880 },
    ];

    classes.forEach(cls => {
      const classButton = this.add.rectangle(cls.x, 480, 150, 60, 0x4a3a6a, 0.8);
      classButton.setStrokeStyle(2, 0x8b5cba);
      classButton.setInteractive();
      classButton.on('pointerover', () => classButton.setFillStyle(0x6a5a8a));
      classButton.on('pointerout', () => classButton.setFillStyle(0x4a3a6a));

      this.add.text(cls.x, 480, cls.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
    });

    // Settings button
    const settingsButton = this.add.rectangle(1240, 40, 50, 50, 0x333333, 0.8);
    settingsButton.setStrokeStyle(2, 0x666666);
    settingsButton.setInteractive();
    settingsButton.on('pointerdown', () => this.toggleSettings());

    this.add.text(1240, 40, '⚙', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
  }

  private toggleSettings() {
    console.log('Settings clicked');
  }
}
