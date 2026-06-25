import { io } from 'socket.io-client';

// Même hôte que l'API REST (cf. lib/api.js).
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let socket = null;

// Ouvre (ou réutilise) la connexion temps réel, authentifiée par le JWT.
export function connectSocket(token) {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(baseURL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
