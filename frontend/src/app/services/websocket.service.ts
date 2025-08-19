import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '@environments/environment';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export interface WebSocketEvent {
  event: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private connectionStatusSubject = new BehaviorSubject<string>('disconnected');
  private messageSubject = new Subject<WebSocketMessage>();
  private eventSubject = new Subject<WebSocketEvent>();

  public readonly isConnected$ = this.isConnectedSubject.asObservable();
  public readonly connectionStatus$ = this.connectionStatusSubject.asObservable();
  public readonly messages$ = this.messageSubject.asObservable();
  public readonly events$ = this.eventSubject.asObservable();

  constructor() {}

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): void {
    if (this.socket && this.socket.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.connectionStatusSubject.next('connecting');

    // Create socket connection
    this.socket = io(environment.wsUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.setupSocketListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnectedSubject.next(false);
      this.connectionStatusSubject.next('disconnected');
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnectedSubject.next(true);
      this.connectionStatusSubject.next('connected');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnectedSubject.next(false);
      this.connectionStatusSubject.next('disconnected');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      this.connectionStatusSubject.next('error');
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.connectionStatusSubject.next('connected');
    });

    this.socket.on('reconnect_error', (error: any) => {
      console.error('WebSocket reconnection error:', error);
      this.connectionStatusSubject.next('error');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.connectionStatusSubject.next('failed');
    });

    // Custom events
    this.socket.on('new-comment', (data: any) => {
      this.handleEvent('new-comment', data);
    });

    this.socket.on('comment-updated', (data: any) => {
      this.handleEvent('comment-updated', data);
    });

    this.socket.on('comment-deleted', (data: any) => {
      this.handleEvent('comment-deleted', data);
    });

    this.socket.on('post-liked', (data: any) => {
      this.handleEvent('post-liked', data);
    });

    this.socket.on('comment-liked', (data: any) => {
      this.handleEvent('comment-liked', data);
    });

    this.socket.on('user-typing', (data: any) => {
      this.handleEvent('user-typing', data);
    });

    this.socket.on('user-online', (data: any) => {
      this.handleEvent('user-online', data);
    });

    this.socket.on('user-offline', (data: any) => {
      this.handleEvent('user-offline', data);
    });

    this.socket.on('notification', (data: any) => {
      this.handleEvent('notification', data);
    });

    // Generic message handler
    this.socket.onAny((eventName: string, ...args: any[]) => {
      this.handleGenericEvent(eventName, args);
    });
  }

  /**
   * Handle specific events
   */
  private handleEvent(event: string, data: any): void {
    const eventData: WebSocketEvent = {
      event,
      data
    };
    
    this.eventSubject.next(eventData);
    
    // Emit as message for backward compatibility
    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: new Date()
    };
    
    this.messageSubject.next(message);
  }

  /**
   * Handle generic events
   */
  private handleGenericEvent(eventName: string, args: any[]): void {
    // Filter out internal socket events
    if (eventName.startsWith('connect') || 
        eventName.startsWith('disconnect') || 
        eventName.startsWith('reconnect') ||
        eventName === 'error') {
      return;
    }

    const data = args.length === 1 ? args[0] : args;
    this.handleEvent(eventName, data);
  }

  /**
   * Join a post room for real-time updates
   */
  joinPost(postId: string): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('join-post', postId);
    }
  }

  /**
   * Leave a post room
   */
  leavePost(postId: string): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('leave-post', postId);
    }
  }

  /**
   * Send a new comment
   */
  sendComment(postId: string, content: string, parentComment?: string): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('new-comment', {
        postId,
        content,
        parentComment
      });
    }
  }

  /**
   * Update a comment
   */
  updateComment(commentId: string, content: string, postId: string): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('update-comment', {
        commentId,
        content,
        postId
      });
    }
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string, postId: string): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('delete-comment', {
        commentId,
        postId
      });
    }
  }

  /**
   * Like/unlike a post
   */
  togglePostLike(postId: string, action: 'like' | 'unlike'): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('post-like', {
        postId,
        action
      });
    }
  }

  /**
   * Like/unlike a comment
   */
  toggleCommentLike(commentId: string, postId: string, action: 'like' | 'unlike'): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('comment-like', {
        commentId,
        postId,
        action
      });
    }
  }

  /**
   * Start typing indicator
   */
  startTyping(postId: string, type: 'comment' | 'reply'): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('typing-start', {
        postId,
        type
      });
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(postId: string): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('typing-stop', {
        postId
      });
    }
  }

  /**
   * Send user online status
   */
  sendUserOnline(): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('user-online');
    }
  }

  /**
   * Send private message
   */
  sendPrivateMessage(toUserId: string, message: string): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit('private-message', {
        toUserId,
        message
      });
    }
  }

  /**
   * Emit custom event
   */
  emit(event: string, data: any): void {
    if (this.socket && this.isConnectedSubject.value) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Listen to custom event
   */
  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    return this.connectionStatusSubject.value;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.isConnectedSubject.value;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Reconnect manually
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.disconnect();
  }
}
