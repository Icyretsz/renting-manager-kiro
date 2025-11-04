import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();

// Validation schemas
const settingKeyValidation = [
  param('key')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Setting key must be between 1 and 100 characters')
];

const updateSettingValidation = [
  body('value')
    .isNumeric()
    .custom((value) => {
      if (Number(value) < 0) {
        throw new Error('Value must be a positive number');
      }
      return true;
    })
    .withMessage('Valid positive number value is required')
];

const createSettingValidation = [
  body('key')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Setting key must be between 1 and 100 characters'),
  body('value')
    .isNumeric()
    .custom((value) => {
      if (Number(value) < 0) {
        throw new Error('Value must be a positive number');
      }
      return true;
    })
    .withMessage('Valid positive number value is required'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', settingsController.getAllSettings);

router.get('/:key', 
  settingKeyValidation,
  validateRequest,
  settingsController.getSettingByKey
);

router.put('/:key', 
  settingKeyValidation,
  updateSettingValidation,
  validateRequest,
  settingsController.updateSetting
);

router.post('/', 
  createSettingValidation,
  validateRequest,
  settingsController.upsertSetting
);

router.delete('/:key', 
  settingKeyValidation,
  validateRequest,
  settingsController.deleteSetting
);

router.post('/initialize', 
  settingsController.initializeSettings
);

export default router;