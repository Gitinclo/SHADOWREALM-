import { NetworkMessage } from '../types';

// Simple browser-compatible EventEmitter
class EventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(...args));
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
}

export class NetworkManager extends EventEmitter {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private messageQueue: NetworkMessage[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  /**
   * Connect to the WebSocket server
   */
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          console.log('Connected to game server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.flushMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message: NetworkMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('Disconnected from game server');
          this.isConnected = false;
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Send a message to the server
   */
  sendMessage(message: NetworkMessage): void {
    if (!this.isConnected || !this.socket) {
      this.messageQueue.push(message);
      return;
    }

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Handle incoming messages from server
   */
  private handleMessage(message: NetworkMessage): void {
    switch (message.type) {
      case 'player_move':
        this.emit('player_move', message.data);
        break;
      case 'player_attack':
        this.emit('player_attack', message.data);
        break;
      case 'player_chat':
        this.emit('player_chat', message.data);
        break;
      case 'player_spawn':
        this.emit('player_spawn', message.data);
        break;
      case 'enemy_spawn':
        this.emit('enemy_spawn', message.data);
        break;
      case 'combat_event':
        this.emit('combat_event', message.data);
        break;
      case 'player_death':
        this.emit('player_death', message.data);
        break;
      case 'loot_drop':
        this.emit('loot_drop', message.data);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  /**
   * Attempt to reconnect to server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      // Attempt to reconnect (would need the URL stored)
      this.emit('reconnecting');
    }, this.reconnectDelay);
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if connected
   */
  isOnline(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  getStatus(): string {
    if (this.isConnected) {
      return 'connected';
    } else if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      return 'connecting';
    } else {
      return 'disconnected';
    }
  }
}
