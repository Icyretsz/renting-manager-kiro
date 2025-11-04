import { Request, Response, NextFunction } from 'express';
import * as settingsService from '../services/settingsService';
import { AppError } from '../utils/errors';
import { getStringParam } from '../utils/paramHelpers';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    auth0Id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
  };
}

/**
 * Get all settings
 * GET /api/settings
 */
export const getAllSettings = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await settingsService.getAllSettings();

    res.json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get setting by key
 * GET /api/settings/:key
 */
export const getSettingByKey = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = getStringParam(req.params, 'key', 'Setting key is required');
    const setting = await settingsService.getSettingByKey(key);

    if (!setting) {
      throw new AppError('Setting not found', 404);
    }

    res.json({
      success: true,
      data: setting,
      message: 'Setting retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update setting by key (admin only)
 * PUT /api/settings/:key
 */
export const updateSetting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const key = getStringParam(req.params, 'key', 'Setting key is required');
    const { value } = req.body;

    if (typeof value !== 'number' || value < 0) {
      throw new AppError('Valid positive number value is required', 400);
    }

    const setting = await settingsService.updateSetting(key, {
      value,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      data: setting,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update setting (admin only)
 * POST /api/settings
 */
export const upsertSetting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const { key, value } = req.body;

    if (!key || typeof key !== 'string') {
      throw new AppError('Valid setting key is required', 400);
    }

    if (typeof value !== 'number' || value < 0) {
      throw new AppError('Valid positive number value is required', 400);
    }

    const setting = await settingsService.upsertSetting(key, {
      value,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      data: setting,
      message: 'Setting saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete setting by key (admin only)
 * DELETE /api/settings/:key
 */
export const deleteSetting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const key = getStringParam(req.params, 'key', 'Setting key is required');
    
    // Prevent deletion of critical settings
    const protectedKeys = ['trash_fee', 'electricity_rate', 'water_rate'];
    if (protectedKeys.includes(key)) {
      throw new AppError('Cannot delete protected system settings', 400);
    }

    await settingsService.deleteSetting(key);

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initialize default settings (admin only)
 * POST /api/settings/initialize
 */
export const initializeSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    await settingsService.initializeDefaultSettings();

    res.json({
      success: true,
      message: 'Default settings initialized successfully'
    });
  } catch (error) {
    next(error);
  }
};