import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaService } from '@/services/prismaService';
// Simple UUID generator for server-side
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        const users = await PrismaService.getUsuarios();
        res.status(200).json(users);
        break;

      case 'POST':
        const userData = {
          ...req.body,
          id: generateUUID(), // Generate UUID on server side
        };
        const newUser = await PrismaService.createUsuario(userData);
        res.status(201).json(newUser);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
