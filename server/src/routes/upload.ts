import express, { Request, Response } from 'express';
import { uploadMeterPhotos, uploadSinglePhoto } from '../config/multer';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError, AppError } from '../utils/errors';
import { authenticateToken } from '../middleware/auth';
import * as fileStorageService from '../services/fileStorageService';
import prisma from '../config/database';
import { MeterType, Operation } from '@/types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    auth0Id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
    roomId?: number;
  };
}

/**
 * Upload meter photos (water and electricity)
 * POST /api/upload/meter-photos
 */
router.post('/meter-photos', uploadMeterPhotos, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  console.log('files', files)
  const { roomId } = req.body;

  if (!files || Object.keys(files).length === 0) {
    throw new ValidationError('No files uploaded');
  }

  if (!roomId) {
    throw new ValidationError('Room ID is required');
  }

  // Check if user has access to this room (for regular users)
  if (req.user.role === 'USER') {
    if (req.user.roomId !== parseInt(roomId)) {
      throw new AppError('Access denied to this room', 403);
    }
  }

  const uploadedFiles: { [key: string]: string } = {};

  // Process uploaded files using the file storage service
  if (files['water_photo'] && files['water_photo'][0]) {
    const fileInfo = await fileStorageService.saveMeterPhoto({
      roomId: parseInt(roomId),
      meterType: 'water',
      file: files['water_photo'][0],
      uploadedBy: req.user.id
    });
    uploadedFiles['waterPhotoUrl'] = fileInfo.url;
  }

  if (files['electricity_photo'] && files['electricity_photo'][0]) {
    const fileInfo = await fileStorageService.saveMeterPhoto({
      roomId: parseInt(roomId),
      meterType: 'electricity',
      file: files['electricity_photo'][0],
      uploadedBy: req.user.id
    });
    uploadedFiles['electricityPhotoUrl'] = fileInfo.url;
  }

  res.status(200).json({
    success: true,
    message: 'Files uploaded successfully',
    data: uploadedFiles,
  });
}));

/**
 * Upload single photo
 * POST /api/upload/photo
 */
router.post('/photo', uploadSinglePhoto, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const { roomId, meterType } = req.body;

  if (!roomId || !meterType) {
    throw new ValidationError('Room ID and meter type are required');
  }

  if (!['water', 'electricity'].includes(meterType)) {
    throw new ValidationError('Meter type must be either "water" or "electricity"');
  }

  // Check if user has access to this room (for regular users)
  if (req.user.role === 'USER') {
    if (req.user.roomId !== parseInt(roomId)) {
      throw new AppError('Access denied to this room', 403);
    }
  }

  const fileInfo = await fileStorageService.saveMeterPhoto({
    roomId: parseInt(roomId),
    meterType: meterType as 'water' | 'electricity',
    file: req.file,
    uploadedBy: req.user.id
  });

  console.log('File uploaded successfully:', {
    filename: fileInfo.filename,
    url: fileInfo.url
  });

  res.status(200).json({
    success: true,
    message: 'Photo uploaded successfully',
    data: {
      photoUrl: fileInfo.url,
      filename: fileInfo.filename,
      size: fileInfo.size,
      mimetype: fileInfo.mimetype,
    },
  });
}));

/**
 * Get uploaded file with access control
 * GET /api/upload/file/:filename
 */
router.get('/file/:filename', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { filename } = req.params;

  if (!filename) {
    throw new ValidationError('Filename is required');
  }

  // Basic security check - prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new ValidationError('Invalid filename');
  }

  // Check if file exists
  if (!fileStorageService.fileExists(filename)) {
    throw new AppError('File not found', 404);
  }

  // For regular users, check if they have access to the room associated with this photo
  if (req.user.role === 'USER') {
    const fileUrl = `/uploads/meter-photos/${filename}`;

    // Find the meter reading that uses this photo
    const reading = await prisma.meterReading.findFirst({
      where: {
        OR: [
          { waterPhotoUrl: fileUrl },
          { electricityPhotoUrl: fileUrl }
        ]
      },
      include: {
        room: true
      }
    });

    if (reading) {
      // Check if user has access to this room
      if (req.user.roomId !== reading.roomId) {
        throw new AppError('Access denied to this file', 403);
      }
    }
  }

  // File will be served by the static middleware in index.ts
  // This endpoint provides access control before redirecting
  res.redirect(`/uploads/meter-photos/${filename}`);
}));

/**
 * Get file info
 * GET /api/upload/info/:filename
 */
router.get('/info/:filename', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { filename } = req.params;

  if (!filename) {
    throw new ValidationError('Filename is required');
  }

  const fileInfo = fileStorageService.getFileInfo(filename);

  if (!fileInfo) {
    throw new AppError('File not found', 404);
  }

  // For regular users, check access permissions
  if (req.user.role === 'USER') {
    const fileUrl = `/uploads/meter-photos/${filename}`;

    const reading = await prisma.meterReading.findFirst({
      where: {
        OR: [
          { waterPhotoUrl: fileUrl },
          { electricityPhotoUrl: fileUrl }
        ]
      }
    });

    if (reading) {
      // Check if user has access to this room
      if (req.user.roomId !== reading.roomId) {
        throw new AppError('Access denied to this file', 403);
      }
    }
  }

  res.json({
    success: true,
    data: fileInfo
  });
}));

/**
 * Delete uploaded file (admin only)
 * DELETE /api/upload/file/:filename
 */
router.delete('/file/:filename', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }

  const { filename } = req.params;

  if (!filename) {
    throw new ValidationError('Filename is required');
  }

  await fileStorageService.deleteFile(filename);

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
}));

/**
 * Get storage statistics (admin only)
 * GET /api/upload/stats
 */
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }

  const stats = await fileStorageService.getStorageStats();

  res.json({
    success: true,
    data: stats
  });
}));

export default router;

/**
 * get AWS S3 presigned URL
 * GET /api/upload/get-presigned
 */
router.get('/get-presigned',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { operation, roomNumber, contentType, meterType, fileName } = req.query

    if (Number.isInteger(roomNumber)) {
      throw new AppError('Room number is not an integer', 400);
    }

    if (!operation || !roomNumber) {
      throw new AppError('Missing parameters', 400);
    }

    const url = await fileStorageService.createPresignedUrlWithClient(operation as Operation, roomNumber as string, contentType as string, meterType as MeterType, fileName as string)

    if (url) {
      res.json({
        success: true,
        data: url
      });
    } else {
      throw new AppError('Error getting presigned URL', 500)
    }
  })
)