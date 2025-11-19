import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as requestController from '../controllers/requestController';

const router = express.Router();

// User routes
router.post('/', authenticate, requestController.createRequest);
router.get('/my-requests', authenticate, requestController.getUserRequests);

// Admin routes
router.get('/pending', authenticate, requireAdmin, requestController.getPendingRequests);
router.get('/all', authenticate, requireAdmin, requestController.getAllRequests);
router.post('/:requestId/approve', authenticate, requireAdmin, requestController.approveRequest);
router.post('/:requestId/reject', authenticate, requireAdmin, requestController.rejectRequest);

export default router;
