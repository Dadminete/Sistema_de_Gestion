import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaService } from '@/services/prismaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const user = await PrismaService.getUsuarioById(id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
        break;

      case 'PUT':
        const updatedUser = await PrismaService.updateUsuario(id, req.body);
        res.status(200).json(updatedUser);
        break;

      case 'DELETE':
        await PrismaService.deleteUsuario(id);
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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
