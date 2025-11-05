import { Router } from 'express';
import * as userManagementController from '../controllers/userManagementController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply authentication and admin requirement to all user management routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route GET /api/user-management/users
 * @desc Get all users with pagination and filtering
 * @access Admin only
 */
router.get('/users', userManagementController.getUsers);

/**
 * @route GET /api/user-management/users/:id
 * @desc Get user by ID
 * @access Admin only
 */
router.get('/users/:id', userManagementController.getUserById);

/**
 * @route POST /api/user-management/users
 * @desc Create new user
 * @access Admin only
 */
router.post('/users', userManagementController.createUser);

/**
 * @route PUT /api/user-management/users/:id
 * @desc Update user
 * @access Admin only
 */
router.put('/users/:id', userManagementController.updateUser);

/**
 * @route DELETE /api/user-management/users/:id
 * @desc Delete user
 * @access Admin only
 */
router.delete('/users/:id', userManagementController.deleteUser);

/**
 * @route POST /api/user-management/link
 * @desc Link user to tenant
 * @access Admin only
 */
router.post('/link', userManagementController.linkUserToTenant);

/**
 * @route POST /api/user-management/unlink
 * @desc Unlink user from tenant
 * @access Admin only
 */
router.post('/unlink', userManagementController.unlinkUserFromTenant);

/**
 * @route GET /api/user-management/suggestions
 * @desc Get user-tenant linking suggestions
 * @access Admin only
 */
router.get('/suggestions', userManagementController.getUserTenantSuggestions);

export default router;