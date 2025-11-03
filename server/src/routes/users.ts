import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();

// Validation schemas
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format')
];

const updateRoleValidation = [
  body('role')
    .isIn(['ADMIN', 'USER'])
    .withMessage('Role must be either ADMIN or USER')
];

const userIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format')
];

const roomIdValidation = [
  param('roomId')
    .isInt({ min: 1 })
    .withMessage('Room ID must be a positive integer')
];

const roleValidation = [
  param('role')
    .isIn(['ADMIN', 'USER'])
    .withMessage('Role must be either ADMIN or USER')
];

const assignRoomsValidation = [
  body('roomIds')
    .isArray({ min: 1 })
    .withMessage('Room IDs must be a non-empty array'),
  body('roomIds.*')
    .isInt({ min: 1 })
    .withMessage('Each room ID must be a positive integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/profile', userController.getCurrentUser.bind(userController));

router.put('/profile', 
  updateProfileValidation,
  validateRequest,
  userController.updateProfile.bind(userController)
);

router.get('/stats', userController.getUserStats.bind(userController));

router.get('/role/:role', 
  roleValidation,
  validateRequest,
  userController.getUsersByRole.bind(userController)
);

router.get('/access/room/:roomId', 
  roomIdValidation,
  validateRequest,
  userController.checkRoomAccess.bind(userController)
);

router.get('/', userController.getAllUsers.bind(userController));

router.get('/:id', 
  userIdValidation,
  validateRequest,
  userController.getUserById.bind(userController)
);

router.put('/:id/role', 
  userIdValidation,
  updateRoleValidation,
  validateRequest,
  userController.updateUserRole.bind(userController)
);

router.get('/:id/rooms', 
  userIdValidation,
  validateRequest,
  userController.getUserRoomAssignments.bind(userController)
);

router.post('/:id/rooms', 
  userIdValidation,
  assignRoomsValidation,
  validateRequest,
  userController.assignUserToRooms.bind(userController)
);

router.post('/:id/rooms/:roomId', 
  userIdValidation,
  roomIdValidation,
  validateRequest,
  userController.addRoomAssignment.bind(userController)
);

router.delete('/:id/rooms/:roomId', 
  userIdValidation,
  roomIdValidation,
  validateRequest,
  userController.removeRoomAssignment.bind(userController)
);

export default router;