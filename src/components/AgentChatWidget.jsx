import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import {
  sendAgentChatMessage,
  toggleChat,
  clearChat,
} from '../features/agentChatSlice';

const AgentChatWidget = () => {
  const dispatch = useDispatch();
  const { messages, loading, error, isOpen, conversationState } = useSelector(
    (state) => state.agentChat,
  );
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim()) return;
    dispatch(sendAgentChatMessage({ message: input.trim() }));
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const missingSlotHints = conversationState?.missingSlots || [];

  return (
    <>
      {/* Persistent floating entry point */}
      <Fab
        color="primary"
        aria-label="Open clinic assistant"
        aria-haspopup="dialog"
        onClick={() => dispatch(toggleChat())}
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 1300,
          '&.Mui-focusVisible': {
            outline: '3px solid #C8862A',
            outlineOffset: '3px',
            boxShadow: 6,
          },
        }}
      >
        <MedicalServicesIcon />
      </Fab>

      {/* Right-side slide-in panel */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => dispatch(toggleChat())}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420, md: 460 }, maxWidth: '100%' } }}
        slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.35)' } } }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalHospitalIcon sx={{ fontSize: 22 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  Clinic Assistant
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, lineHeight: 1.2 }}>
                  AI help for your clinic
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => dispatch(clearChat())}
                title="Clear conversation"
                sx={{ color: 'primary.contrastText' }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => dispatch(toggleChat())}
                aria-label="Close assistant"
                sx={{ color: 'primary.contrastText' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Disclaimer — informational, not a warning */}
          <Box
            sx={{
              px: 2,
              py: 0.75,
              bgcolor: 'action.hover',
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0.75,
              flexShrink: 0,
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.4 }}>
              AI suggestions based on your clinic data. Verify before acting on stock, schedule, or patient recommendations. For emergencies, call your local emergency number.
            </Typography>
          </Box>

          {/* Messages area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              p: 2,
              minHeight: 0,
            }}
          >
            {messages.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <MedicalServicesIcon sx={{ fontSize: 36, color: 'primary.light', mb: 1 }} />
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Hello! I&apos;m your clinic assistant.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Ask me about low stock, today&apos;s appointments, upcoming appointments, or doctors.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pick a quick action below, or type a message.
                </Typography>
              </Box>
            )}

            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isEmergency = msg.isEmergency;

              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    elevation={isEmergency ? 3 : 0}
                    sx={{
                      px: 1.5,
                      py: 1,
                      maxWidth: '85%',
                      borderRadius: isUser
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      bgcolor: isEmergency
                        ? 'error.main'
                        : isUser
                          ? '#FBEFD6'
                          : 'action.hover',
                      color: isEmergency
                        ? 'error.contrastText'
                        : isUser
                          ? '#211C16'
                          : 'text.primary',
                      ...(isUser && !isEmergency
                        ? { border: '1px solid #E9D9B6' }
                        : {}),
                    }}
                  >
                    {isEmergency && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <WarningAmberIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
                          EMERGENCY
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {msg.content}
                    </Typography>
                  </Paper>
                </Box>
              );
            })}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="body2" color="text.secondary">
                  Thinking…
                </Typography>
              </Box>
            )}

            {error && (
              <Paper
                sx={{
                  px: 1.5,
                  py: 1,
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2">{error}</Typography>
              </Paper>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Slot-fill hint */}
          {missingSlotHints.length > 0 && !loading && (
            <Box
              sx={{
                px: 2,
                py: 0.75,
                bgcolor: '#FBEFD6',
                borderTop: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                flexWrap: 'wrap',
                flexShrink: 0,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#A66B20' }}>
                Needed:
              </Typography>
              {missingSlotHints.map((hint) => (
                <Chip
                  key={hint}
                  label={hint}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  sx={{ fontSize: '0.7rem', height: 22 }}
                />
              ))}
            </Box>
          )}

          {/* Quick actions */}
          <Box
            sx={{
              px: 1.5,
              pt: 1,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              gap: 0.75,
              flexWrap: 'wrap',
              overflowX: 'auto',
              scrollbarWidth: 'thin',
              '::-webkit-scrollbar': { height: 4 },
              flexShrink: 0,
            }}
          >
            {[
              'List doctors',
              "Today's appointments",
              'Upcoming appointments',
              'Low stock medicines',
              'Pending appointments',
            ].map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                variant="outlined"
                color="primary"
                disabled={loading}
                tabIndex={0}
                onClick={() => dispatch(sendAgentChatMessage({ message: label }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    dispatch(sendAgentChatMessage({ message: label }));
                  }
                }}
                sx={{
                  fontSize: '0.8rem',
                  height: 32,
                  borderRadius: 1.5,
                  cursor: loading ? 'default' : 'pointer',
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '2px',
                  },
                }}
              />
            ))}
          </Box>

          {/* Input area */}
          <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, flexShrink: 0 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
            <IconButton
              color="primary"
              aria-label="Send message"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: '50%',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
                width: 44,
                height: 44,
                flexShrink: 0,
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default AgentChatWidget;
