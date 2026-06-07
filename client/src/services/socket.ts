import { io, Socket } from 'socket.io-client';
import { Danmaku, Battle } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): Socket {
    if (!this.socket) {
      this.socket = io({
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Socket连接成功');
        this.emit('connected', {});
      });

      this.socket.on('disconnect', () => {
        console.log('Socket断开连接');
        this.emit('disconnected', {});
      });

      this.socket.on('danmaku', (data: Danmaku) => {
        this.emit('danmaku', data);
      });

      this.socket.on('program_update', (data: any) => {
        this.emit('program_update', data);
      });

      this.socket.on('battle_start', (data: Battle) => {
        this.emit('battle_start', data);
      });

      this.socket.on('battle_update', (data: Battle[]) => {
        this.emit('battle_update', data);
      });

      this.socket.on('trade_new', (data: any) => {
        this.emit('trade_new', data);
      });

      this.socket.on('trade_complete', (data: any) => {
        this.emit('trade_complete', data);
      });
    }
    return this.socket;
  }

  joinStation(stationId: string): void {
    if (this.socket) {
      this.socket.emit('join_station', stationId);
    }
  }

  leaveStation(stationId: string): void {
    if (this.socket) {
      this.socket.emit('leave_station', stationId);
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

export const socketService = new SocketService();
