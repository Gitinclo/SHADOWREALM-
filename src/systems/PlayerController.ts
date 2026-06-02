import Phaser from 'phaser';
import { Player } from '../types';

export class PlayerController {
  private scene: Phaser.Scene;
  private speed: number = 200;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  handleInput(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    sprite: Phaser.Physics.Arcade.Sprite,
    player: Player
  ): Phaser.Math.Vector2 {
    const velocity = new Phaser.Math.Vector2(0, 0);

    if (cursors.left.isDown || this.scene.input.keyboard?.isDown(Phaser.Input.Keyboard.KeyCodes.A)) {
      velocity.x = -this.speed;
    } else if (cursors.right.isDown || this.scene.input.keyboard?.isDown(Phaser.Input.Keyboard.KeyCodes.D)) {
      velocity.x = this.speed;
    }

    if (cursors.up.isDown || this.scene.input.keyboard?.isDown(Phaser.Input.Keyboard.KeyCodes.W)) {
      velocity.y = -this.speed;
    } else if (cursors.down.isDown || this.scene.input.keyboard?.isDown(Phaser.Input.Keyboard.KeyCodes.S)) {
      velocity.y = this.speed;
    }

    sprite.setVelocity(velocity.x, velocity.y);

    // Update rotation based on velocity
    if (velocity.length() > 0) {
      sprite.setRotation(velocity.angle());
      player.isMoving = true;
    } else {
      player.isMoving = false;
    }

    return velocity;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }
}
