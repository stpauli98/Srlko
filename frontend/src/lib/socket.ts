import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket | null {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('token');
  if (!token) return null;

  // In production, VITE_API_URL points to the Railway backend.
  // In development it is unset → socket.io-client uses the current origin,
  // which Vite proxies to localhost:3000.
  const apiUrl = import.meta.env.VITE_API_URL || undefined;

  socket = io(apiUrl, {
    auth: (cb) => { cb({ token: localStorage.getItem('token') }); },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    if (import.meta.env.DEV || import.meta.env.VITE_E2E) {
      (window as any).__socket = socket;
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
