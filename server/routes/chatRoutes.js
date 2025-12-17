const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');

// Get all chats for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await chatService.getUserChats(userId);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user chats', message: error.message });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await chatService.getChatMessages(chatId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat messages', message: error.message });
  }
});

// Send a new message
router.post('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { usuarioId, mensaje } = req.body;
    const newMessage = await chatService.sendMessage(chatId, usuarioId, mensaje);

    // Emit SSE event for new message (non-blocking)
    try {
      if (global.eventSystem && newMessage) {
        console.log('📨 Attempting to send notification for message:', newMessage.id);
        const chat = await chatService.getChatById(chatId);
        console.log('💬 Chat retrieved:', chat ? `ID: ${chat.id}, Participants: ${chat.participantes?.length}` : 'null');

        if (chat && chat.participantes) {
          // Get all participants except the sender
          const recipients = chat.participantes
            .filter(p => p.usuarioId !== usuarioId)
            .map(p => p.usuarioId);

          console.log('👥 Recipients for notification:', recipients);
          console.log('📤 Sender:', usuarioId, 'Message preview:', mensaje.substring(0, 50));

          // Emit new-message event to recipients
          global.eventSystem.emitToUsers(recipients, 'new-message', {
            chatId: chatId,
            messageId: newMessage.id,
            senderId: usuarioId,
            senderName: newMessage.usuario?.username || 'Usuario',
            message: mensaje.substring(0, 100), // Preview only
            timestamp: newMessage.createdAt
          });

          console.log('✅ Notification emitted successfully');
        }
      }
    } catch (notificationError) {
      // Log but don't fail the request
      console.error('❌ Error sending notification:', notificationError.message);
      console.error(notificationError.stack);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', message: error.message });
  }
});

// Find or create a private chat
router.post('/findOrCreate', async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    const chat = await chatService.findOrCreateChat(userId1, userId2);
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to find or create chat', message: error.message });
  }
});

// Delete a chat
router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    await chatService.deleteChat(chatId);
    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat', message: error.message });
  }
});

module.exports = router;
