import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sendAgentMessage } from '../api/agent';

/**
 * Send a message to the staff agent, including conversation state for
 * multi-turn slot-filling (mirrors the patient-portal slice shape so the
 * widget UI is identical across portals).
 */
export const sendAgentChatMessage = createAsyncThunk(
  'agentChat/sendMessage',
  async ({ message }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const history = state.agentChat.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const conversationState = state.agentChat.conversationState || null;

      const reply = await sendAgentMessage(message, history, conversationState);
      return { message, reply };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reach the assistant. Please try again.',
      );
    }
  },
);

const agentChatSlice = createSlice({
  name: 'agentChat',
  initialState: {
    messages: [],
    loading: false,
    error: null,
    isOpen: false,
    conversationState: null, // { intent, slots, missingSlots } when present
  },
  reducers: {
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
    },
    openChat: (state) => {
      state.isOpen = true;
    },
    closeChat: (state) => {
      state.isOpen = false;
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
      state.conversationState = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendAgentChatMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendAgentChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        const { message, reply } = action.payload;
        state.messages.push({ role: 'user', content: message });
        state.messages.push({
          role: 'assistant',
          content: reply.content,
          toolCalled: reply.toolCalled,
          toolName: reply.toolName,
          isEmergency: reply.isEmergency || false,
        });
        // Round-trip conversation state for multi-turn flows; reset when the
        // server signals the current flow is complete (null / empty).
        state.conversationState = reply.conversationState || null;
      })
      .addCase(sendAgentChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { toggleChat, openChat, closeChat, clearChat, clearError } = agentChatSlice.actions;
// Legacy alias for AgentChatPage (full-page /agent) which predates the
// Drawer widget. Same shape, same call signature — keeping both names avoids
// a churn in pages/AgentChat.jsx.
export const sendMessage = sendAgentChatMessage;
export default agentChatSlice.reducer;
