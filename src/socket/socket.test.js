import { describe, it, expect, vi, beforeEach } from 'vitest';
import { connectSocket, disconnectSocket, getSocket } from './socket';

// Mock socket.io-client so the test doesn't try to open a real
// websocket. The factory returns a minimal shape that mirrors the
// pieces of the real io.Socket we exercise.
const makeFakeSocket = () => {
  const handlers = {};
  return {
    on: (event, fn) => { handlers[event] = fn; },
    off: vi.fn(),
    disconnect: vi.fn(),
    __handlers: handlers,
  };
};

vi.mock('socket.io-client', () => {
  let lastSocket = null;
  return {
    io: vi.fn(() => {
      lastSocket = makeFakeSocket();
      return lastSocket;
    }),
    __lastSocket: () => lastSocket,
  };
});

const ioMock = await import('socket.io-client');

describe('socket lifecycle', () => {
  beforeEach(() => { disconnectSocket(); vi.clearAllMocks(); });

  it('connectSocket creates a new socket with the bearer token', () => {
    connectSocket('bearer-abc');
    expect(ioMock.io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: 'bearer-abc' } }),
    );
    expect(getSocket()).not.toBeNull();
  });

  it('connectSocket disconnects the previous socket before reconnecting', () => {
    connectSocket('first');
    const first = getSocket();
    connectSocket('second');
    expect(first.disconnect).toHaveBeenCalled();
    expect(getSocket()).not.toBe(first);
  });

  it('disconnectSocket tears down the live socket and clears the reference', () => {
    connectSocket('t');
    const sock = getSocket();
    disconnectSocket();
    expect(sock.disconnect).toHaveBeenCalled();
    expect(getSocket()).toBeNull();
  });

  it('disconnectSocket is a no-op when no socket is active', () => {
    expect(() => disconnectSocket()).not.toThrow();
    expect(getSocket()).toBeNull();
  });

  it('emits a "connect" handler that does not log to console (SEC-5 fix)', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    connectSocket('t');
    const sock = ioMock.__lastSocket();
    expect(typeof sock.__handlers.connect).toBe('function');
    sock.__handlers.connect();
    sock.__handlers.disconnect();
    expect(logSpy).not.toHaveBeenCalled();
    expect(errSpy).not.toHaveBeenCalled();
  });
});
