import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sendAgentMessage } from '../api/agent';

export const sendMessage = createAsyncThunk(
  'agentChat/sendMessage',
  async ({ message }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const history = state.agentChat.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const reply = await sendAgentMessage(message, history);
      return { message, reply };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reach the assistant. Please try again.'
      );
    }
  }
);

const agentChatSlice = createSlice({
  name: 'agentChat',
  initialState: {
    messages: [],
    loading: false,
    error: null,
    isOpen: false,
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
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const { message, reply } = action.payload;
        state.messages.push({ role: 'user', content: message });
        state.messages.push({
          role: 'assistant',
          content: reply.content,
          toolCalled: reply.toolCalled,
          toolName: reply.toolName,
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { toggleChat, openChat, closeChat, clearChat, clearError } = agentChatSlice.actions;
export default agentChatSlice.reducer;
