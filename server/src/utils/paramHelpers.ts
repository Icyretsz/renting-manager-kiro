import { AppError } from './errors';

/**
 * Safely parse integer parameter from request params
 */
export function parseIntParam(params: any, paramName: string, errorMessage?: string): number {
  const paramValue = params[paramName];
  if (!paramValue) {
    throw new AppError(errorMessage || `${paramName} is required`, 400);
  }
  
  const parsed = parseInt(paramValue);
  if (isNaN(parsed)) {
    throw new AppError(errorMessage || `Invalid ${paramName}`, 400);
  }
  
  return parsed;
}

/**
 * Safely get string parameter from request params
 */
export function getStringParam(params: any, paramName: string, errorMessage?: string): string {
  const paramValue = params[paramName];
  if (!paramValue) {
    throw new AppError(errorMessage || `${paramName} is required`, 400);
  }
  
  return paramValue;
}

/**
 * Safely parse optional integer parameter from request params
 */
export function parseOptionalIntParam(params: any, paramName: string): number | undefined {
  const paramValue = params[paramName];
  if (!paramValue) {
    return undefined;
  }
  
  const parsed = parseInt(paramValue);
  if (isNaN(parsed)) {
    throw new AppError(`Invalid ${paramName}`, 400);
  }
  
  return parsed;
}