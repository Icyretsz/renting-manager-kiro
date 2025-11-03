import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let err = error;

  // Log error for debugging
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: process.env['NODE_ENV'] === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    err = handlePrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    err = new AppError('Invalid data provided', 400);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token', 401);
  } else if (err.name === 'TokenExpiredError') {
    err = new AppError('Token expired', 401);
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    err = handleMulterError(err as any);
  }

  // If it's not an operational error, convert it
  if (!(err instanceof AppError)) {
    err = new AppError(
      process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong',
      500,
      false
    );
  }

  const appError = err as AppError;

  // Send error response
  res.status(appError.statusCode).json({
    success: false,
    error: {
      message: appError.message,
      ...(process.env['NODE_ENV'] === 'development' && {
        stack: appError.stack,
        name: appError.name,
      }),
    },
  });
};

/**
 * Handle Prisma database errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.['target'] as string[];
      return new AppError(
        `Duplicate value for ${field ? field.join(', ') : 'field'}`,
        409
      );
    case 'P2014':
      // Invalid ID
      return new AppError('Invalid ID provided', 400);
    case 'P2003':
      // Foreign key constraint violation
      return new AppError('Referenced record does not exist', 400);
    case 'P2025':
      // Record not found
      return new AppError('Record not found', 404);
    default:
      return new AppError('Database operation failed', 500);
  }
}

/**
 * Handle Multer file upload errors
 */
function handleMulterError(error: any): AppError {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new AppError('File too large', 400);
    case 'LIMIT_FILE_COUNT':
      return new AppError('Too many files', 400);
    case 'LIMIT_UNEXPECTED_FILE':
      return new AppError('Unexpected file field', 400);
    default:
      return new AppError('File upload failed', 400);
  }
}

/**
 * Catch async errors and pass to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};