import api from '../lib/api';

export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};


export const getUserChats = async (userId: string) => {
  const response = await api.get(`/chat/user/${userId}`);
  return response.data;
};

export const getChatMessages = async (chatId: string) => {
  const response = await api.get(`/chat/${chatId}/messages`);
  return response.data;
};

export const sendMessage = async (chatId: string, usuarioId: string, mensaje: string) => {
  const response = await api.post(`/chat/${chatId}/messages`, { usuarioId, mensaje });
  return response.data;
};

export const findOrCreateChat = async (userId1: string, userId2: string) => {
  const response = await api.post('/chat/findOrCreate', { userId1, userId2 });
  return response.data;
};

export const deleteChat = async (chatId: string) => {
  const response = await api.delete(`/chat/${chatId}`);
  return response.data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
