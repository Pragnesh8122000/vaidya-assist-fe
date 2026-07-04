import { io } from 'socket.io-client';

// SEC-3 fix: socket URL must come from the same env var as the main
// API so production deploys use the production socket endpoint. The
// previous hardcoded localhost:5050 silently broke real-time updates
// in any non-local environment, leading to stale appointment data in
// a clinical workflow.
/** @type {string} */
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ||
  'http://localhost:5050';

/**
 * @typedef {import('socket.io-client').Socket} SocketInstance
 */

/** @type {SocketInstance | null} */
let socket = null;

/**
 * Open a socket.io connection. Disconnects any previously-opened
 * socket first so a stale session cannot keep receiving events from
 * a different account.
 *
 * @param {string} token - bearer token to send in the socket auth
 *                         handshake; the server uses it to scope
 *                         incoming events to the user's clinic.
 * @returns {SocketInstance}
 */
export const connectSocket = (token) => {
  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
  });

  // SEC-5 fix: socket lifecycle logs no longer use console.log so the
  // production bundle doesn't ship them. The events still flow; we just
  // don't emit them to the browser console (which can be captured by
  // any installed extension or browser sync).
  socket.on('connect', () => {});
  socket.on('disconnect', () => {});

  return socket;
};

/**
 * @returns {SocketInstance | null} the live socket, or null if not connected
 */
export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
