import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5050';

let socket = null;

export const connectSocket = (token) => {
  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
