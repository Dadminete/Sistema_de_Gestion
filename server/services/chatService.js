const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

const getUserChats = async (userId) => {
  const chats = await prisma.chat.findMany({
    where: {
      participantes: {
        some: {
          usuarioId: userId,
        },
      },
    },
    include: {
      participantes: {
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
      mensajes: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });
  return chats;
};

const getChatMessages = async (chatId) => {
  const messages = await prisma.mensajeChat.findMany({
    where: {
      chatId: chatId,
    },
    include: {
      usuario: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  return messages;
};

const sendMessage = async (chatId, usuarioId, mensaje) => {
  const newMessage = await prisma.mensajeChat.create({
    data: {
      chatId: chatId,
      usuarioId: usuarioId,
      mensaje: mensaje,
    },
    include: {
      usuario: true
    }
  });

  // Update last message time on chat
  await prisma.chat.update({
    where: { id: chatId },
    data: { ultimoMensaje: new Date() },
  });

  return newMessage;
};

const findOrCreateChat = async (userId1, userId2) => {
  // Find a private chat with exactly these two participants
  const chat = await prisma.chat.findFirst({
    where: {
      tipo: 'privado',
      AND: [
        { participantes: { some: { usuarioId: userId1 } } },
        { participantes: { some: { usuarioId: userId2 } } },
      ],
      participantes: {
        every: {
          usuarioId: { in: [userId1, userId2] }
        }
      }
    },
    include: {
      participantes: { include: { usuario: true } },
      mensajes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (chat) {
    return chat;
  }

  // If no chat exists, create a new one
  const user1 = await prisma.usuario.findUnique({ where: { id: userId1 } });
  const user2 = await prisma.usuario.findUnique({ where: { id: userId2 } });

  const newChat = await prisma.chat.create({
    data: {
      tipo: 'privado',
      titulo: `Chat with ${user2.username}`,
      creadoPorId: userId1,
      participantes: {
        create: [
          { usuarioId: userId1 },
          { usuarioId: userId2 },
        ],
      },
    },
    include: {
      participantes: { include: { usuario: true } },
      mensajes: true,
    },
  });

  return newChat;
};

const deleteChat = async (chatId) => {
  // Delete all messages first (cascade delete might handle this, but safer to be explicit)
  await prisma.mensajeChat.deleteMany({
    where: { chatId: chatId },
  });

  // Delete participants
  await prisma.chatParticipante.deleteMany({
    where: { chatId: chatId },
  });

  // Delete the chat
  await prisma.chat.delete({
    where: { id: chatId },
  });

  return { success: true };
};

const getChatById = async (chatId) => {
  return await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participantes: {
        include: {
          usuario: true,
        },
      },
    },
  });
};

module.exports = {
  getUserChats,
  getChatMessages,
  sendMessage,
  findOrCreateChat,
  deleteChat,
  getChatById,
};
