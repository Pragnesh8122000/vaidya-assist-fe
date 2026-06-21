import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { sendMessage } from '../features/agentChatSlice';

const AgentChatPage = () => {
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector((state) => state.agentChat);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    dispatch(sendMessage({ message: input.trim() }));
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', maxWidth: 800, display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Vaidya Assist" subheader="AI assistant for your clinic" />

        <CardContent
          sx={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              Ask me about low stock medicines, today&apos;s appointments, or upcoming appointments.
            </Typography>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    maxWidth: '75%',
                    borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
                    bgcolor: isUser ? 'primary.main' : 'background.default',
                    color: isUser ? '#fff' : 'text.primary',
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>
                  {msg.toolCalled && (
                    <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                      via {msg.toolName || 'tool'}
                    </Typography>
                  )}
                </Paper>
              </Box>
            );
          })}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Assistant is thinking...
              </Typography>
            </Box>
          )}

          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </CardContent>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask the assistant..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            multiline
            maxRows={4}
          />
          <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || loading}>
            <SendIcon />
          </IconButton>
        </Box>
      </Card>
    </Box>
  );
};

export default AgentChatPage;
