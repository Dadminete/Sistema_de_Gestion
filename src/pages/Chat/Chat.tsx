import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './Chat.css';
import { IoSearch, IoCallOutline, IoVideocamOutline, IoChatbubblesOutline, IoSend, IoTrashOutline } from 'react-icons/io5';
import { BsThreeDotsVertical, BsEmojiSmile } from 'react-icons/bs';
import { ImAttachment } from 'react-icons/im';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { getAllUsers, getUserChats, getChatMessages, sendMessage, findOrCreateChat, deleteChat, uploadFile } from '../../services/chatService';
import { useAuth } from '../../context/AuthProvider';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import ChatNotification from '../../components/ChatNotification/ChatNotification';

// Type definitions for Chat data
interface ChatUser {
  id: string;
  username: string;
  avatar?: string;
  nombre?: string;
  apellido?: string;
}

interface Message {
  id: string;
  mensaje: string;
  createdAt: string;
  usuarioId: string;
  usuario: ChatUser;
}

interface Participant {
  usuario: ChatUser;
}

interface Chat {
  id: string;
  titulo?: string;
  ultimoMensaje: string;
  participantes: Participant[];
  mensajes: Message[];
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [notification, setNotification] = useState<{ message: string; senderName: string; senderId: string } | null>(null);

  // Handle new message events for notifications
  const handleNewMessage = useCallback((event: any) => {
    console.log('🔔 New message event received:', event);
    console.log('📍 Current chat ID:', currentChat?.id);
    console.log('👤 Current user ID:', user?.id);
    console.log('📨 Event chat ID:', event.chatId);
    console.log('👤 Event sender ID:', event.senderId);

    // Only show notification if the message is not from the current chat
    if (currentChat?.id !== event.chatId && user?.id !== event.senderId) {
      console.log('✅ Showing notification!');
      setNotification({
        message: event.message,
        senderName: event.senderName,
        senderId: event.senderId
      });
    } else {
      console.log('❌ Not showing notification - same chat or same user');
    }
  }, [currentChat, user]);

  // Handle notification click - navigate to chat with sender
  const handleNotificationClick = useCallback(() => {
    if (notification && notification.senderId) {
      // Navigate to chat with the sender
      window.location.href = `/chat?userId=${notification.senderId}`;
    }
  }, [notification]);

  const { connectedUsers } = useRealTimeUpdates(
    undefined, // onEntityChange
    undefined, // onUserConnected
    undefined, // onUserDisconnected
    undefined, // onConnected
    handleNewMessage // onNewMessage
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchChats();
      fetchAllUsers();
    }
  }, [user]);

  // Handle URL query params for direct chat
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetUserId = params.get('userId');

    if (targetUserId && user && allUsers.length > 0) {
      const targetUser = allUsers.find(u => u.id === targetUserId);
      if (targetUser) {
        handleUserSelect(targetUser);
      }
    }
  }, [location.search, user, allUsers]);

  const fetchAllUsers = async () => {
    if (user) {
      try {
        const users = await getAllUsers();
        setAllUsers(users.filter((u: ChatUser) => u.id !== user.id));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
  };

  const fetchChats = async () => {
    if (user) {
      try {
        const userChats = await getUserChats(user.id);
        setChats(userChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    }
  };

  const selectChat = async (chat: Chat) => {
    setCurrentChat(chat);
    setShowOptions(false);
    try {
      const chatMessages = await getChatMessages(chat.id);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleUserSelect = async (selectedUser: ChatUser) => {
    if (user && user.id !== selectedUser.id) {
      try {
        // Check if chat already exists in list
        const existingChat = chats.find(c =>
          c.participantes.some(p => p.usuario.id === selectedUser.id) && c.participantes.length === 2
        );

        if (existingChat) {
          selectChat(existingChat);
        } else {
          const chat = await findOrCreateChat(user.id, selectedUser.id);
          // Only add to list if it doesn't exist
          setChats(prevChats => {
            const exists = prevChats.find(c => c.id === chat.id);
            if (exists) {
              return prevChats;
            }
            return [chat, ...prevChats];
          });
          selectChat(chat);
        }
      } catch (error) {
        console.error('Error finding or creating chat:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && currentChat && user) {
      try {
        const sentMessage = await sendMessage(currentChat.id, user.id, newMessage);
        setMessages([...messages, sentMessage]);
        setNewMessage('');
        setShowEmojiPicker(false);

        // Update the chat list to show the new message
        const updatedChats = chats.map(chat =>
          chat.id === currentChat.id
            ? { ...chat, mensajes: [sentMessage], ultimoMensaje: sentMessage.createdAt }
            : chat
        );
        // Move updated chat to top
        const chatToMove = updatedChats.find(c => c.id === currentChat.id);
        const otherChats = updatedChats.filter(c => c.id !== currentChat.id);

        if (chatToMove) {
          setChats([chatToMove, ...otherChats]);
        } else {
          setChats(updatedChats);
        }

      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentChat && user) {
      try {
        // Upload file
        const uploadResult = await uploadFile(file);
        const fileUrl = `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${uploadResult.filePath}`;

        // Send message with file link
        const messageText = `📎 Archivo adjunto: ${file.name}\n${fileUrl}`;
        const sentMessage = await sendMessage(currentChat.id, user.id, messageText);

        setMessages([...messages, sentMessage]);

        // Update chat list
        const updatedChats = chats.map(chat =>
          chat.id === currentChat.id
            ? { ...chat, mensajes: [sentMessage], ultimoMensaje: sentMessage.createdAt }
            : chat
        );
        setChats(updatedChats);

      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error al subir el archivo');
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteChat = async () => {
    if (currentChat && window.confirm('¿Estás seguro de que deseas eliminar este chat?')) {
      try {
        await deleteChat(currentChat.id);
        setChats(chats.filter(c => c.id !== currentChat.id));
        setCurrentChat(null);
        setMessages([]);
      } catch (error) {
        console.error('Error deleting chat:', error);
        alert('Error al eliminar el chat');
      }
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.titulo) return chat.titulo;
    const otherParticipants = chat.participantes.filter(p => p.usuario.id !== user?.id);
    return otherParticipants.map(p => p.usuario.username).join(', ');
  };

  const getChatAvatar = (chat: Chat) => {
    const otherParticipants = chat.participantes.filter(p => p.usuario.id !== user?.id);
    if (otherParticipants.length > 0) {
      return otherParticipants[0].usuario.avatar;
    }
    return undefined;
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const isUserOnline = (userId: string) => {
    return connectedUsers.some(u => u.id === userId);
  };

  const isChatOnline = (chat: Chat) => {
    const otherParticipants = chat.participantes.filter(p => p.usuario.id !== user?.id);
    return otherParticipants.some(p => isUserOnline(p.usuario.id));
  };

  const renderMessageContent = (msg: Message) => {
    // Check if message contains a file link
    if (msg.mensaje.includes('📎 Archivo adjunto:')) {
      const lines = msg.mensaje.split('\n');
      const fileName = lines[0].replace('📎 Archivo adjunto: ', '');
      const fileUrl = lines[1];

      const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png)$/i);

      return (
        <div className="file-attachment">
          {isImage ? (
            <div className="image-preview">
              <img src={fileUrl} alt={fileName} onClick={() => window.open(fileUrl, '_blank')} />
            </div>
          ) : (
            <div className="file-link">
              <ImAttachment />
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">{fileName}</a>
            </div>
          )}
        </div>
      );
    }
    return <p className="message-content">{msg.mensaje}</p>;
  };

  return (
    <div className="chat-container-premium">
      <div className="chat-sidebar-premium">
        <div className="chat-sidebar-header">
          <h2>Mensajes</h2>
          <div className="search-bar-premium">
            <IoSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-sidebar-content">
          <div className="section-title">CONTACTOS</div>
          <div className="chat-list">
            {allUsers
              .filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((u) => (
                <div key={u.id} className='chat-list-item-premium' onClick={() => handleUserSelect(u)}>
                  <div className="avatar-container">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.username} className="avatar-img" />
                    ) : (
                      <div className="avatar-placeholder contact">{getInitials(u.username)}</div>
                    )}
                    {isUserOnline(u.id) && <span className="status-dot"></span>}
                  </div>
                  <div className="chat-info">
                    <span className="chat-name">{u.username}</span>
                    <p className="chat-preview">Click para chatear</p>
                  </div>
                </div>
              ))}
          </div>

          <div className="section-title">CHATS RECIENTES</div>
          <div className="chat-list">
            {chats
              .filter(chat => getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase()))
              .map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-list-item-premium ${currentChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => selectChat(chat)}
                >
                  <div className="avatar-container">
                    {getChatAvatar(chat) ? (
                      <img src={getChatAvatar(chat)} alt="avatar" className="avatar-img" />
                    ) : (
                      <div className="avatar-placeholder">{getInitials(getChatName(chat))}</div>
                    )}
                    {isChatOnline(chat) && <span className="status-dot"></span>}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name-row">
                      <span className="chat-name">{getChatName(chat)}</span>
                      <span className="chat-time">
                        {new Date(chat.ultimoMensaje).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="chat-preview">
                      {chat.mensajes[0]?.mensaje.includes('📎') ? '📎 Archivo adjunto' : (chat.mensajes[0]?.mensaje || 'No hay mensajes')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="chat-main-premium">
        {currentChat ? (
          <>
            <div className="chat-header-premium">
              <div className="chat-header-info">
                <div className="avatar-container small">
                  {getChatAvatar(currentChat) ? (
                    <img src={getChatAvatar(currentChat)} alt="avatar" className="avatar-img" />
                  ) : (
                    <div className="avatar-placeholder">{getInitials(getChatName(currentChat))}</div>
                  )}
                </div>
                <div className="header-text">
                  <h3>{getChatName(currentChat)}</h3>
                  {isChatOnline(currentChat) ? (
                    <span className="status-text online">En línea</span>
                  ) : (
                    <span className="status-text offline">Desconectado</span>
                  )}
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="icon-btn"><IoCallOutline /></button>
                <button className="icon-btn"><IoVideocamOutline /></button>
                <div className="relative">
                  <button className="icon-btn" onClick={() => setShowOptions(!showOptions)}>
                    <BsThreeDotsVertical />
                  </button>
                  {showOptions && (
                    <div className="chat-options-menu">
                      <button className="option-item delete" onClick={handleDeleteChat}>
                        <IoTrashOutline /> Eliminar Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="chat-messages-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.usuarioId === user?.id ? 'me' : 'other'}`}>
                  {msg.usuarioId !== user?.id && (
                    <div className="message-avatar">
                      {getInitials(msg.usuario.username)}
                    </div>
                  )}
                  <div className="message-bubble">
                    {renderMessageContent(msg)}
                    <span className="message-timestamp">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>
                <ImAttachment />
              </button>

              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  className="emoji-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <BsEmojiSmile />
                </button>

                {showEmojiPicker && (
                  <div className="emoji-picker-container" ref={emojiPickerRef}>
                    <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
                  </div>
                )}
              </div>

              <button className="send-btn" onClick={handleSendMessage}>
                <IoSend />
              </button>
            </div>
          </>
        ) : (
          <div className="empty-chat-state">
            <div className="empty-icon">
              <IoChatbubblesOutline />
            </div>
            <h2>Bienvenido al Chat</h2>
            <p>Selecciona un contacto o chat para comenzar a conversar.</p>
          </div>
        )}
      </div>

      {
        notification && (
          <ChatNotification
            message={notification.message}
            senderName={notification.senderName}
            onClick={handleNotificationClick}
            onClose={() => setNotification(null)}
          />
        )
      }
    </div >
  );
};

export default Chat;
