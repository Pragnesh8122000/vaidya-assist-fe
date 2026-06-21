import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { toast } from 'react-toastify';
import { sendMessage, toggleChat, clearChat } from '../features/agentChatSlice';

const WIDGET_SIZE = 56;
const CHAT_WIDTH = 380;
const CHAT_MAX_WIDTH = 380;
const CHAT_HEIGHT = 560;
const CHAT_MIN_GAP = 12;
const STORAGE_KEY = 'vaidya-agent-widget-position';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDefaultPosition() {
  return {
    x: window.innerWidth - WIDGET_SIZE - 24,
    y: window.innerHeight - WIDGET_SIZE - 24,
  };
}

function loadPosition() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return {
          x: clamp(parsed.x, 8, window.innerWidth - WIDGET_SIZE - 8),
          y: clamp(parsed.y, 8, window.innerHeight - WIDGET_SIZE - 8),
        };
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return getDefaultPosition();
}

function savePosition(position) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // ignore storage errors
  }
}

const AgentChatWidget = () => {
  const dispatch = useDispatch();
  const { messages, loading, error, isOpen } = useSelector((state) => state.agentChat);
  const [input, setInput] = useState('');
  const [position, setPosition] = useState(() => loadPosition());
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const fabRef = useRef(null);

  // Keep the widget inside the viewport on resize.
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: clamp(prev.x, 8, window.innerWidth - WIDGET_SIZE - 8),
        y: clamp(prev.y, 8, window.innerHeight - WIDGET_SIZE - 8),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist position changes.
  useEffect(() => {
    savePosition(position);
  }, [position]);

  const handlePointerDown = useCallback((e) => {
    // Only left mouse / touch / pen primary button.
    if (e.button !== undefined && e.button !== 0) return;

    e.preventDefault();
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };
    setIsDragging(true);

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }

      setPosition({
        x: clamp(positionStartRef.current.x + dx, 8, window.innerWidth - WIDGET_SIZE - 8),
        y: clamp(positionStartRef.current.y + dy, 8, window.innerHeight - WIDGET_SIZE - 8),
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
  }, [position]);

  const handleClick = useCallback((e) => {
    // If the user dragged, do not toggle the chat.
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    dispatch(toggleChat());
  }, [dispatch]);

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

  // Compute chat window position so it stays inside the viewport and follows the widget.
  const chatStyle = (() => {
    const maxWidth = Math.min(CHAT_MAX_WIDTH, window.innerWidth - 32);
    const width = Math.min(CHAT_WIDTH, maxWidth);
    const height = Math.min(CHAT_HEIGHT, window.innerHeight - 120);

    let left = position.x - width + WIDGET_SIZE;
    let top = position.y - height - CHAT_MIN_GAP;

    // If there is not enough space above, open below the widget.
    if (top < 8) {
      top = position.y + WIDGET_SIZE + CHAT_MIN_GAP;
    }

    // Keep inside horizontal bounds.
    left = clamp(left, 8, window.innerWidth - width - 8);
    top = clamp(top, 8, window.innerHeight - height - 8);

    return {
      position: 'fixed',
      top,
      left,
      width,
      height,
    };
  })();

  return (
    <>
      {/* Draggable floating toggle button */}
      <Fab
        ref={fabRef}
        color="primary"
        aria-label="Open agent chat"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        sx={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          zIndex: 1300,
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SmartToyIcon />
          <DragIndicatorIcon
            fontSize="small"
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              opacity: 0.6,
              fontSize: 14,
              transform: 'rotate(90deg)',
            }}
          />
        </Box>
      </Fab>

      {/* Chat window */}
      {isOpen && (
        <Card
          sx={{
            ...chatStyle,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300,
            boxShadow: 6,
          }}
        >
          <CardHeader
            title="Vaidya Assist"
            subheader="AI assistant for your clinic"
            action={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  size="small"
                  onClick={() => dispatch(clearChat())}
                  title="Clear conversation"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => dispatch(toggleChat())}>
                  <CloseIcon />
                </IconButton>
              </Box>
            }
            sx={{ pb: 0 }}
          />

          <CardContent
            sx={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              minHeight: 280,
            }}
          >
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
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
                      px: 2,
                      py: 1,
                      maxWidth: '80%',
                      borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      bgcolor: isUser ? 'primary.main' : 'background.default',
                      color: isUser ? '#fff' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
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
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Card>
      )}
    </>
  );
};

export default AgentChatWidget;
