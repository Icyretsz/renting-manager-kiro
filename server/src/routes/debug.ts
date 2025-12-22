import { Router } from 'express';
import { Request, Response } from 'express';
import { getSocketIO } from '../config/socket';
import { authenticateToken } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// Apply authentication middleware to all debug routes
router.use(authenticateToken);

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    auth0Id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
  };
}

/**
 * Debug endpoint to test WebSocket notifications
 */
router.post('/test-notification', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const io = getSocketIO();
    const userRoom = `user:${req.user.auth0Id}`;
    
    // Check if user is connected
    const socketsInRoom = io.sockets.adapter.rooms.get(userRoom);
    const isConnected = socketsInRoom && socketsInRoom.size > 0;
    
    // Get all active rooms
    const allRooms = Array.from(io.sockets.adapter.rooms.keys());
    
    // Send test notification if connected
    if (isConnected) {
      const testNotification = {
        id: 'test-' + Date.now(),
        type: 'reading_approved',
        data: {
          roomNumber: '999',
          month: '12',
          year: '2024',
          action: 'test'
        },
        userId: req.user.id,
        readStatus: false,
        createdAt: new Date()
      };
      
      io.to(userRoom).emit('notification:new', testNotification);
    }
    
    res.json({
      success: true,
      debug: {
        userId: req.user.id,
        auth0Id: req.user.auth0Id,
        userRoom,
        isConnected,
        socketsInRoom: socketsInRoom ? socketsInRoom.size : 0,
        allActiveRooms: allRooms,
        testNotificationSent: isConnected
      }
    });
  } catch (error) {
    console.error('Debug test notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Debug endpoint to check user's auth0Id in database
 */
router.get('/check-auth0id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        auth0Id: true,
        email: true,
        name: true,
        role: true
      }
    });

    res.json({
      success: true,
      data: {
        tokenAuth0Id: req.user.auth0Id,
        databaseAuth0Id: user?.auth0Id,
        match: req.user.auth0Id === user?.auth0Id,
        user
      }
    });
  } catch (error) {
    console.error('Debug check auth0Id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;