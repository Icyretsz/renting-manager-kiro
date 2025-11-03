import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FileUploadError } from '../utils/errors';

// Ensure upload directory exists
const uploadDir = process.env['UPLOAD_DIR'] || 'uploads';
const meterPhotosDir = path.join(uploadDir, 'meter-photos');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(meterPhotosDir)) {
  fs.mkdirSync(meterPhotosDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, meterPhotosDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: roomId_meterType_timestamp.ext
    const roomId = req.body.roomId || 'unknown';
    const meterType = file.fieldname; // 'water_photo' or 'electricity_photo'
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${roomId}_${meterType}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter for images only
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new FileUploadError('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env['MAX_FILE_SIZE'] || '5242880'), // 5MB default
    files: 2, // Maximum 2 files (water and electricity photos)
  },
  fileFilter: fileFilter,
});

// Specific configurations for different upload scenarios
export const uploadMeterPhotos = upload.fields([
  { name: 'water_photo', maxCount: 1 },
  { name: 'electricity_photo', maxCount: 1 },
]);

export const uploadSinglePhoto = upload.single('photo');

export default upload;