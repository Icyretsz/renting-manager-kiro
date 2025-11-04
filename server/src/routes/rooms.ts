import { Router } from 'express';
import * as roomController from '../controllers/roomController';
import { authenticateToken } from '../middleware/auth';
import { requireTenantLink } from '../middleware/tenantLink';
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

// Apply authentication and tenant link check to all routes
router.use(authenticateToken);
router.use(requireTenantLink);

// Routes
router.get('/', roomController.getAllRooms);

router.get('/stats/occupancy', roomController.getOccupancyStats);

router.get('/floor/:floor', 
  floorValidation,
  validateRequest,
  roomController.getRoomsByFloor
);

router.get('/:id', 
  roomIdValidation,
  validateRequest,
  roomController.getRoomById
);

router.get('/:id/tenants', 
  roomIdValidation,
  validateRequest,
  roomController.getRoomTenants
);

router.post('/', 
  createRoomValidation,
  validateRequest,
  roomController.createRoom
);

router.post('/initialize', roomController.initializeRooms);

router.put('/:id', 
  roomIdValidation,
  updateRoomValidation,
  validateRequest,
  roomController.updateRoom
);

router.delete('/:id', 
  roomIdValidation,
  validateRequest,
  roomController.deleteRoom
);

export default router;