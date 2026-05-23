import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { getSocket } from '../socket/socket';

const ChatPage = () => {
  const { user } = useSelector(state => state.auth);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
    api.get('/users?limit=50').then(r => setUsers(r.data.data)).catch(() => {});

    const socket = getSocket();
    if (socket) {
      socket.emit('users:getOnline');
      socket.on('users:online', (ids) => setOnlineUsers(ids));
      socket.on('user:online', ({ userId }) => setOnlineUsers(prev => [...new Set([...prev, userId])]));
      socket.on('user:offline', ({ userId }) => setOnlineUsers(prev => prev.filter(id => id !== userId)));
      socket.on('chat:message', (msg) => {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
      return () => { socket.off('users:online'); socket.off('user:online'); socket.off('user:offline'); socket.off('chat:message'); };
    }
  }, []);

  const fetchChats = async () => {
    try { const { data } = await api.get('/chats'); setChats(data.data); }
    catch (err) { /* ignore */ }
  };

  const openChat = async (chat) => {
    setActiveChat(chat);
    setLoading(true);
    try {
      const { data } = await api.get(`/chats/${chat._id}/messages`);
      setMessages(data.data);
      const socket = getSocket();
      if (socket) socket.emit('chat:join', chat._id);
      await api.put(`/chats/${chat._id}/read`);
    } catch (err) { toast.error('Failed to load messages'); }
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const startChat = async (userId) => {
    try {
      const { data } = await api.post('/chats', { userId });
      await fetchChats();
      openChat(data.data);
    } catch (err) { toast.error('Failed to start chat'); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    try {
      await api.post(`/chats/${activeChat._id}/messages`, { content: newMessage });
      setNewMessage('');
      fetchChats();
    } catch (err) { toast.error('Failed to send'); }
  };

  const getOtherUser = (chat) => chat?.participants?.find(p => p._id !== user?._id);
  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', gap: 2 }}>
      {/* Chat List */}
      <Card sx={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Messages</Typography>
          <TextField size="small" fullWidth placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {search ? (
            users.filter(u => u._id !== user?._id && u.name.toLowerCase().includes(search.toLowerCase())).map(u => (
              <ListItemButton key={u._id} onClick={() => startChat(u._id)}>
                <ListItemAvatar>
                  <Badge overlap="circular" variant="dot" color={isOnline(u._id) ? 'success' : 'default'} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Avatar sx={{ bgcolor: '#1565C0' }}>{u.name.charAt(0)}</Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText primary={u.name} secondary={u.role?.name} />
              </ListItemButton>
            ))
          ) : (
            chats.map(chat => {
              const other = getOtherUser(chat);
              return (
                <ListItemButton key={chat._id} selected={activeChat?._id === chat._id} onClick={() => openChat(chat)}>
                  <ListItemAvatar>
                    <Badge overlap="circular" variant="dot" color={isOnline(other?._id) ? 'success' : 'default'} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                      <Avatar sx={{ bgcolor: '#1565C0' }}>{other?.name?.charAt(0)}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText primary={other?.name} secondary={chat.lastMessage || 'No messages'} secondaryTypographyProps={{ noWrap: true }} />
                </ListItemButton>
              );
            })
          )}
        </List>
      </Card>

      {/* Chat Area */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!activeChat ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Select a conversation to start chatting</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Badge overlap="circular" variant="dot" color={isOnline(getOtherUser(activeChat)?._id) ? 'success' : 'default'}>
                <Avatar sx={{ bgcolor: '#1565C0' }}>{getOtherUser(activeChat)?.name?.charAt(0)}</Avatar>
              </Badge>
              <Box>
                <Typography fontWeight={600}>{getOtherUser(activeChat)?.name}</Typography>
                <Typography variant="caption" sx={{ color: isOnline(getOtherUser(activeChat)?._id) ? 'success.main' : 'text.secondary' }}>
                  {isOnline(getOtherUser(activeChat)?._id) ? 'Online' : 'Offline'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {loading ? <CircularProgress sx={{ mx: 'auto', my: 4 }} /> : (
                messages.map((msg, i) => {
                  const isMine = msg.sender?._id === user?._id;
                  return (
                    <Box key={i} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <Paper sx={{
                        px: 2, py: 1, maxWidth: '70%', borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                        bgcolor: isMine ? 'primary.main' : 'background.default', color: isMine ? '#fff' : 'text.primary'
                      }}>
                        <Typography variant="body2">{msg.content}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                      </Paper>
                    </Box>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </Box>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
              <IconButton color="primary" onClick={sendMessage} disabled={!newMessage.trim()}>
                <SendIcon />
              </IconButton>
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
};
export default ChatPage;
