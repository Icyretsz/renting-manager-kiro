import { Router } from 'express';
import * as tenantController from '../controllers/tenantController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation schemas
const createTenantValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be less than 255 characters'),
  body('email')
    .optional({nullable: true})
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must be less than 50 characters'),
  body('fingerprintId')
    .optional()
    .isInt()
    .withMessage('Fingerprint ID must be an integer'),
  body('permanentAddress')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Permanent address must be less than 500 characters'),
  body('roomId')
    .isInt({ min: 1 })
    .withMessage('Valid room ID is required'),
  body('moveInDate')
    .optional()
    .isISO8601()
    .withMessage('Move-in date must be a valid date')
];

const updateTenantValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be less than 255 characters'),
  body('email')
    .optional({nullable: true})
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must be less than 50 characters'),
  body('fingerprintId')
    .optional()
    .isInt()
    .withMessage('Fingerprint ID must be an integer'),
  body('permanentAddress')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Permanent address must be less than 500 characters'),
  body('roomId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Room ID must be a positive integer'),
  body('moveInDate')
    .optional()
    .isISO8601()
    .withMessage('Move-in date must be a valid date'),
  body('moveOutDate')
    .optional({nullable: true})
    .isISO8601()
    .withMessage('Move-out date must be a valid date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// const tenantIdValidation = [
//   param('id')
//     .isUUID()
//     .withMessage('Invalid tenant ID format')
// ];

const roomIdValidation = [
  param('roomId')
    .isInt({ min: 1 })
    .withMessage('Room ID must be a positive integer')
];

const moveOutValidation = [
  body('moveOutDate')
    .optional()
    .isISO8601()
    .withMessage('Move-out date must be a valid date')
];

const moveInValidation = [
  body('moveInDate')
    .optional()
    .isISO8601()
    .withMessage('Move-in date must be a valid date')
];

const searchValidation = [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const queryFiltersValidation = [
  query('roomId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Room ID must be a positive integer'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('floor')
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage('Floor must be 1 or 2'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must not be empty')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/search', 
  searchValidation,
  validateRequest,
  tenantController.searchTenants
);

router.get('/stats', tenantController.getTenantStats);

router.get('/room/:roomId', 
  roomIdValidation,
  validateRequest,
  tenantController.getTenantsByRoom
);

router.get('/', 
  queryFiltersValidation,
  validateRequest,
  tenantController.getAllTenants
);

router.get('/:id', 
  //tenantIdValidation,
  validateRequest,
  tenantController.getTenantById
);

router.post('/', 
  createTenantValidation,
  validateRequest,
  tenantController.createTenant
);

router.put('/:id', 
  //tenantIdValidation,
  updateTenantValidation,
  validateRequest,
  tenantController.updateTenant
);

router.post('/:id/move-out', 
  //tenantIdValidation,
  moveOutValidation,
  validateRequest,
  tenantController.moveTenantOut
);

router.post('/:id/move-in', 
  //tenantIdValidation,
  moveInValidation,
  validateRequest,
  tenantController.moveTenantIn
);

router.delete('/:id', 
  //tenantIdValidation,
  validateRequest,
  tenantController.deleteTenant
);

export default router;