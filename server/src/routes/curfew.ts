import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import {
  requestCurfewOverride,
  approveCurfewOverride,
  rejectCurfewOverride,
  getRoomTenants,
  resetCurfewOverrides,
  getPendingCurfewRequests,
  getCurfewModifications,
  manualChangeCurfewStatus
} from '../controllers/curfewController';

const router = Router();

// User routes (authenticated)
router.get('/room-tenants', authenticate, getRoomTenants);
router.post('/request', authenticate, requestCurfewOverride);

// Admin routes
router.get('/pending', authenticate, requireAdmin, getPendingCurfewRequests);
router.get('/modifications/:tenantId', authenticate, getCurfewModifications);
router.post('/approve', authenticate, requireAdmin, approveCurfewOverride);
router.post('/reject', authenticate, requireAdmin, rejectCurfewOverride);
router.post('/manual-change', authenticate, requireAdmin, manualChangeCurfewStatus);

// Cron job route (should be protected by API key or internal only)
router.post('/reset', resetCurfewOverrides);

export default router;
