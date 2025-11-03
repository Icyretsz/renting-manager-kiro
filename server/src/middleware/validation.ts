import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

/**
 * Express-validator middleware to handle validation results
 */
export const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw new ValidationError(errorMessages);
  }
  next();
};

/**
 * Validate request body against a schema
 */
export const validateBody = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
    next();
  };
};

/**
 * Validate request params against a schema
 */
export const validateParams = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
    next();
  };
};

/**
 * Validate request query against a schema
 */
export const validateQuery = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
    next();
  };
};

/**
 * Basic validation helpers
 */
export const validateRequired = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const missing = fields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }
    next();
  };
};

/**
 * Validate decimal precision for meter readings
 */
export const validateMeterReading = (req: Request, _res: Response, next: NextFunction) => {
  const { waterReading, electricityReading, month, year, baseRent } = req.body;
  
  if (waterReading !== undefined) {
    const water = parseFloat(waterReading);
    if (isNaN(water) || water < 0) {
      throw new ValidationError('Water reading must be a positive number');
    }
    // Check decimal precision (max 1 decimal place)
    if (!/^\d+(\.\d{1})?$/.test(waterReading.toString())) {
      throw new ValidationError('Water reading must have at most 1 decimal place');
    }
  }

  if (electricityReading !== undefined) {
    const electricity = parseFloat(electricityReading);
    if (isNaN(electricity) || electricity < 0) {
      throw new ValidationError('Electricity reading must be a positive number');
    }
    // Check decimal precision (max 1 decimal place)
    if (!/^\d+(\.\d{1})?$/.test(electricityReading.toString())) {
      throw new ValidationError('Electricity reading must have at most 1 decimal place');
    }
  }

  if (month !== undefined) {
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new ValidationError('Month must be between 1 and 12');
    }
  }

  if (year !== undefined) {
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > currentYear + 1) {
      throw new ValidationError(`Year must be between 2020 and ${currentYear + 1}`);
    }
  }

  if (baseRent !== undefined) {
    const rent = parseFloat(baseRent);
    if (isNaN(rent) || rent < 0) {
      throw new ValidationError('Base rent must be a positive number');
    }
  }

  next();
};

/**
 * Validate room ID parameter
 */
export const validateRoomId = (req: Request, _res: Response, next: NextFunction) => {
  const { roomId } = req.params;
  
  if (!roomId) {
    throw new ValidationError('Room ID is required');
  }
  
  const roomIdNum = parseInt(roomId);
  
  if (isNaN(roomIdNum) || roomIdNum < 1) {
    throw new ValidationError('Invalid room ID');
  }
  
  next();
};

/**
 * Validate meter reading ID parameter
 */
export const validateReadingId = (req: Request, _res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new ValidationError('Invalid reading ID');
  }
  
  next();
};