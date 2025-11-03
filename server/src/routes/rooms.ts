import { Router } from 'express';
import { roomController } from '../controllers/roomController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();

// Validation schemas
const createRoomValidation = [
  body('roomNumber')
    .isInt({ min: 1, max: 18 })
    .withMessage('Room number must be between 1 and 18'),
  body('floor')
    .isInt({ min: 1, max: 2 })
    .withMessage('Floor must be 1 or 2'),
  body('baseRent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base rent must be a positive number'),
  body('maxTenants')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max tenants must be between 1 and 10')
];

const updateRoomValidation = [
  body('baseRent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base rent must be a positive number'),
  body('maxTenants')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max tenants must be between 1 and 10')
];

const roomIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Room ID must be a positive integer')
];

const floorValidation = [
  param('floor')
    .isInt({ min: 1, max: 2 })
    .withMessage('Floor must be 1 or 2')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', roomController.getAllRooms.bind(roomController));

router.get('/stats/occupancy', roomController.getOccupancyStats.bind(roomController));

router.get('/floor/:floor', 
  floorValidation,
  validateRequest,
  roomController.getRoomsByFloor.bind(roomController)
);

router.get('/:id', 
  roomIdValidation,
  validateRequest,
  roomController.getRoomById.bind(roomController)
);

router.get('/:id/tenants', 
  roomIdValidation,
  validateRequest,
  roomController.getRoomTenants.bind(roomController)
);

router.post('/', 
  createRoomValidation,
  validateRequest,
  roomController.createRoom.bind(roomController)
);

router.post('/initialize', roomController.initializeRooms.bind(roomController));

router.put('/:id', 
  roomIdValidation,
  updateRoomValidation,
  validateRequest,
  roomController.updateRoom.bind(roomController)
);

router.delete('/:id', 
  roomIdValidation,
  validateRequest,
  roomController.deleteRoom.bind(roomController)
);

export default router;