import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface FilesystemChangeEvent {
  type: 'add' | 'unlink' | 'addDir' | 'unlinkDir' | 'change';
  path: string;
  workspaceId: string;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private currentWorkspaceId: string | null = null;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentWorkspaceId = null;
    }
  }

  watchWorkspace(workspaceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Stop watching current workspace if any
      if (this.currentWorkspaceId) {
        this.socket.emit('stop-watch');
      }

      this.currentWorkspaceId = workspaceId;

      const onWatchStarted = (data: { workspaceId: string }) => {
        if (data.workspaceId === workspaceId) {
          this.socket?.off('watch-started', onWatchStarted);
          this.socket?.off('error', onError);
          resolve();
        }
      };

      const onError = (error: { message: string }) => {
        this.socket?.off('watch-started', onWatchStarted);
        this.socket?.off('error', onError);
        reject(new Error(error.message));
      };

      this.socket.on('watch-started', onWatchStarted);
      this.socket.on('error', onError);

      this.socket.emit('watch-workspace', { workspaceId });
    });
  }

  stopWatching(): void {
    if (this.socket?.connected && this.currentWorkspaceId) {
      this.socket.emit('stop-watch');
      this.currentWorkspaceId = null;
    }
  }

  onFilesystemChange(callback: (event: FilesystemChangeEvent) => void): () => void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    this.socket.on('filesystem:change', callback);

    // Return cleanup function
    return () => {
      this.socket?.off('filesystem:change', callback);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentWorkspaceId(): string | null {
    return this.currentWorkspaceId;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();