import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

// Use dedicated socket URL or fall back to API URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const IS_PRODUCTION = import.meta.env.PROD;

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export interface AlertData {
  id: string;
  type: 'mention' | 'spike';
  message: string;
  mention?: {
    keyword: string;
    source: string;
    text: string;
    url: string;
    aiSentiment: string;
    aiTopics: string[];
  };
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AnalyticsUpdateData {
  type: 'analyticsUpdate';
  data: unknown;
  timestamp: string;
}

export interface NewMentionData {
  type: 'newMention';
  data: {
    id: string;
    keyword: string;
    source: string;
    text: string;
    url: string;
    timestamp: string;
    aiSentiment: string;
    aiTopics: string[];
  };
  timestamp: string;
}

export const connectSocket = (): Socket => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  if (socket?.connected) {
    return socket;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    withCredentials: true,
  });

  socket.on('connect', () => {
    reconnectAttempts = 0;
    if (!IS_PRODUCTION) {
      console.log('[Socket] Connected to server');
    }
  });

  socket.on('connected', (data) => {
    if (!IS_PRODUCTION) {
      console.log('[Socket] Server acknowledged connection:', data);
    }
  });

  socket.on('disconnect', (reason) => {
    if (!IS_PRODUCTION) {
      console.log('[Socket] Disconnected:', reason);
    }
    if (reason === 'io server disconnect') {
      // Server disconnected us, try to reconnect
      socket?.connect();
    }
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    if (!IS_PRODUCTION) {
      console.error('[Socket] Connection error:', error.message);
    }
    
    // Show toast only after multiple failures
    if (reconnectAttempts === 3) {
      toast.error('Real-time connection lost. Attempting to reconnect...');
    }
    
    // If auth error, redirect to login
    if (error.message.includes('Authentication') || error.message.includes('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      toast.error('Session expired. Please log in again.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    if (!IS_PRODUCTION) {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    }
    toast.success('Real-time connection restored');
  });

  socket.on('reconnect_failed', () => {
    toast.error('Unable to establish real-time connection. Please refresh the page.');
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const subscribeToKeywords = (keywords: string[]): void => {
  if (socket?.connected) {
    socket.emit('subscribe', { keywords });
  }
};

export const onNewAlert = (callback: (alert: AlertData) => void): void => {
  if (socket) {
    socket.on('newAlert', callback);
  }
};

export const onAnalyticsUpdate = (callback: (data: AnalyticsUpdateData) => void): void => {
  if (socket) {
    socket.on('analyticsUpdate', callback);
  }
};

export const onNewMention = (callback: (data: NewMentionData) => void): void => {
  if (socket) {
    socket.on('newMention', callback);
  }
};

export const removeAllListeners = (): void => {
  if (socket) {
    socket.removeAllListeners();
  }
};

export default {
  connect: connectSocket,
  disconnect: disconnectSocket,
  getSocket,
  subscribeToKeywords,
  onNewAlert,
  onAnalyticsUpdate,
  onNewMention,
  removeAllListeners,
};
