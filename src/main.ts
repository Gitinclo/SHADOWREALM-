import { game } from './game';

// Initialize the game
console.log('ShadowRealm MMORPG Starting...');
console.log('Game instance:', game);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Game paused - window hidden');
    game.scene.pause();
  } else {
    console.log('Game resumed - window visible');
    game.scene.resume();
  }
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

export { game };
