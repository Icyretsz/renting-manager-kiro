import fs from 'fs';
import path from 'path';
import { AppError, ValidationError } from '../utils/errors';
import { prisma } from '../config/database';

export interface FileInfo {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
  url: string;
}

export interface MeterPhotoUpload {
  roomId: number;
  meterType: 'water' | 'electricity';
  file: Express.Multer.File;
  uploadedBy: string;
}

export class FileStorageService {
  private uploadDir: string;
  private meterPhotosDir: string;

  constructor() {
    this.uploadDir = process.env['UPLOAD_DIR'] || 'uploads';
    this.meterPhotosDir = path.join(this.uploadDir, 'meter-photos');
    this.ensureDirectoriesExist();
  }

  /**
   * Ensure upload directories exist
   */
  private ensureDirectoriesExist(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    if (!fs.existsSync(this.meterPhotosDir)) {
      fs.mkdirSync(this.meterPhotosDir, { recursive: true });
    }
  }

  /**
   * Generate secure filename for meter photos
   */
  generateMeterPhotoFilename(roomId: number, meterType: 'water' | 'electricity', originalName: string): string {
    const timestamp = Date.now();
    const ext = path.extname(originalName).toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `room${roomId}_${meterType}_${timestamp}_${randomSuffix}${ext}`;
  }

  /**
   * Validate image file
   */
  validateImageFile(file: Express.Multer.File): void {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('Only image files are allowed (jpeg, jpg, png, gif, webp)');
    }

    // Check file size (5MB max)
    const maxSize = parseInt(process.env['MAX_FILE_SIZE'] || '5242880'); // 5MB
    if (file.size > maxSize) {
      throw new ValidationError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new ValidationError('Invalid file extension');
    }
  }

  /**
   * Save meter photo with proper naming and validation
   */
  async saveMeterPhoto(upload: MeterPhotoUpload): Promise<FileInfo> {
    // Validate the file
    this.validateImageFile(upload.file);

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: upload.roomId }
    });

    if (!room) {
      throw new ValidationError('Room not found');
    }

    // Generate secure filename
    const filename = this.generateMeterPhotoFilename(
      upload.roomId,
      upload.meterType,
      upload.file.originalname
    );

    const filePath = path.join(this.meterPhotosDir, filename);
    const fileUrl = `/uploads/meter-photos/${filename}`;

    // Move file to final location
    try {
      fs.renameSync(upload.file.path, filePath);
    } catch (error) {
      throw new AppError('Failed to save file', 500);
    }

    return {
      filename,
      originalName: upload.file.originalname,
      size: upload.file.size,
      mimetype: upload.file.mimetype,
      path: filePath,
      url: fileUrl
    };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filename: string): Promise<void> {
    // Security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new ValidationError('Invalid filename');
    }

    const filePath = path.join(this.meterPhotosDir, filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new AppError('Failed to delete file', 500);
    }
  }

  /**
   * Check if file exists
   */
  fileExists(filename: string): boolean {
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }

    const filePath = path.join(this.meterPhotosDir, filename);
    return fs.existsSync(filePath);
  }

  /**
   * Get file info
   */
  getFileInfo(filename: string): FileInfo | null {
    if (!this.fileExists(filename)) {
      return null;
    }

    const filePath = path.join(this.meterPhotosDir, filename);
    const stats = fs.statSync(filePath);

    return {
      filename,
      originalName: filename,
      size: stats.size,
      mimetype: this.getMimetypeFromExtension(path.extname(filename)),
      path: filePath,
      url: `/uploads/meter-photos/${filename}`
    };
  }

  /**
   * Get mimetype from file extension
   */
  private getMimetypeFromExtension(ext: string): string {
    const mimetypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    return mimetypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Clean up old files (for maintenance)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    try {
      const files = fs.readdirSync(this.meterPhotosDir);

      for (const filename of files) {
        const filePath = path.join(this.meterPhotosDir, filename);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          // Check if file is still referenced in database
          const isReferenced = await this.isFileReferenced(filename);
          
          if (!isReferenced) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }

    return deletedCount;
  }

  /**
   * Check if file is still referenced in database
   */
  private async isFileReferenced(filename: string): Promise<boolean> {
    const fileUrl = `/uploads/meter-photos/${filename}`;

    const reading = await prisma.meterReading.findFirst({
      where: {
        OR: [
          { waterPhotoUrl: fileUrl },
          { electricityPhotoUrl: fileUrl }
        ]
      }
    });

    return !!reading;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    try {
      const files = fs.readdirSync(this.meterPhotosDir);
      let totalSize = 0;
      let oldestFile: Date | null = null;
      let newestFile: Date | null = null;

      for (const filename of files) {
        const filePath = path.join(this.meterPhotosDir, filename);
        const stats = fs.statSync(filePath);
        
        totalSize += stats.size;

        if (!oldestFile || stats.mtime < oldestFile) {
          oldestFile = stats.mtime;
        }

        if (!newestFile || stats.mtime > newestFile) {
          newestFile = stats.mtime;
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        averageFileSize: files.length > 0 ? Math.round(totalSize / files.length) : 0,
        oldestFile,
        newestFile
      };
    } catch (error) {
      return {
        totalFiles: 0,
        totalSize: 0,
        averageFileSize: 0,
        oldestFile: null,
        newestFile: null
      };
    }
  }
}

export const fileStorageService = new FileStorageService();