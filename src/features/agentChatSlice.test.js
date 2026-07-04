import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import agentChatReducer, {
  sendAgentChatMessage,
  openChat,
  closeChat,
  toggleChat,
  clearChat,
  clearError,
} from './agentChatSlice';

vi.mock('../api/agent', () => ({
  sendAgentMessage: vi.fn(),
}));

const makeStore = (preloaded) => configureStore({
  reducer: { agentChat: agentChatReducer },
  preloadedState: preloaded,
});

describe('agentChatSlice', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('starts with an empty transcript and the chat closed', () => {
    const store = makeStore();
    expect(store.getState().agentChat.messages).toEqual([]);
    expect(store.getState().agentChat.isOpen).toBe(false);
    expect(store.getState().agentChat.loading).toBe(false);
    expect(store.getState().agentChat.error).toBeNull();
  });

  it('openChat / closeChat / toggleChat manage the drawer state', () => {
    const store = makeStore();
    store.dispatch(openChat());
    expect(store.getState().agentChat.isOpen).toBe(true);
    store.dispatch(closeChat());
    expect(store.getState().agentChat.isOpen).toBe(false);
    store.dispatch(toggleChat());
    expect(store.getState().agentChat.isOpen).toBe(true);
  });

  it('clearChat wipes the transcript AND the conversation state', () => {
    const store = makeStore({
      agentChat: {
        messages: [{ role: 'user', content: 'hi' }],
        loading: false,
        error: null,
        isOpen: true,
        conversationState: { intent: 'book_appointment', slots: { patientId: 'p1' } },
      },
    });
    store.dispatch(clearChat());
    expect(store.getState().agentChat.messages).toEqual([]);
    expect(store.getState().agentChat.conversationState).toBeNull();
  });

  it('clearError removes the error without touching the rest of state', () => {
    const store = makeStore({
      agentChat: {
        messages: [{ role: 'user', content: 'hi' }],
        loading: false,
        error: 'something broke',
        isOpen: false,
        conversationState: null,
      },
    });
    store.dispatch(clearError());
    expect(store.getState().agentChat.error).toBeNull();
    expect(store.getState().agentChat.messages).toHaveLength(1);
  });

  it('fulfilled push appends user + assistant turns and updates conversationState', async () => {
    const { sendAgentMessage } = await import('../api/agent');
    sendAgentMessage.mockResolvedValueOnce({
      content: 'Which patient?',
      toolCalled: false,
      conversationState: { intent: 'book_appointment', slots: {}, missingSlots: ['patientId'] },
    });
    const store = makeStore();
    await store.dispatch(sendAgentChatMessage({ message: 'book' }));
    const msgs = store.getState().agentChat.messages;
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].content).toBe('book');
    expect(msgs[1].role).toBe('assistant');
    expect(msgs[1].content).toBe('Which patient?');
    expect(store.getState().agentChat.conversationState.intent).toBe('book_appointment');
    expect(store.getState().agentChat.error).toBeNull();
  });

  it('fulfilled with no conversationState clears the previous conversation state', async () => {
    const { sendAgentMessage } = await import('../api/agent');
    sendAgentMessage.mockResolvedValueOnce({
      content: 'Done.',
      toolCalled: false,
      conversationState: null,
    });
    const store = makeStore({
      agentChat: {
        messages: [], loading: false, error: null, isOpen: false,
        conversationState: { intent: 'x', slots: {} },
      },
    });
    await store.dispatch(sendAgentChatMessage({ message: 'ok' }));
    expect(store.getState().agentChat.conversationState).toBeNull();
  });

  it('rejected surfaces the error message and leaves messages untouched', async () => {
    const { sendAgentMessage } = await import('../api/agent');
    sendAgentMessage.mockRejectedValueOnce({ response: { data: { message: 'server down' } } });
    const store = makeStore();
    await store.dispatch(sendAgentChatMessage({ message: 'hi' }));
    expect(store.getState().agentChat.error).toBe('server down');
    expect(store.getState().agentChat.messages).toEqual([]);
    expect(store.getState().agentChat.loading).toBe(false);
  });
});
