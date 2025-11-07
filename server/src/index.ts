import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';

// Import middleware and utilities
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './utils/errors';
import prisma from './config/database';
import { initializeFirebase } from './config/firebase';
import { initializeSocket } from './config/socket';

// Load environment variables
dotenv.config();

// Initialize Firebase for push notifications
initializeFirebase();

const app = express();
const PORT = process.env['PORT'] || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production'
    ? process.env['CLIENT_URL_PROD']
    : process.env['CLIENT_URL_DEV'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Logging middleware
app.use(morgan(process.env['NODE_ENV'] === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ⭐ CREATE SERVER AND INITIALIZE SOCKET.IO EARLY
const server = createServer(app);
initializeSocket(server);

// Static file serving for uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'OK',
      message: 'Rental Management Server is running',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      environment: process.env['NODE_ENV'] || 'development',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: process.env['NODE_ENV'] === 'development' ? error : undefined,
    });
  }
});

// API routes placeholder
app.get('/api', (_req, res) => {
  res.json({
    message: 'Rental Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// Import routes
import uploadRoutes from './routes/upload';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import tenantRoutes from './routes/tenants';
import userRoutes from './routes/users';
import meterReadingRoutes from './routes/meterReadings';
import notificationRoutes from './routes/notifications';
import billingRoutes from './routes/billing';
import settingsRoutes from './routes/settings';
import paymentRoutes from './routes/payments';
import userManagementRoutes from './routes/userManagement';

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/readings', meterReadingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/user-management', userManagementRoutes);

// 404 handler for API routes only
app.use('/api/*', (req, _res, next) => {
  next(new NotFoundError(`API route ${req.originalUrl} not found`));
});

// ⭐ IMPORTANT: Don't catch Socket.IO routes
// Only catch non-socket.io routes
app.use((req, _res, next) => {
  // Ignore Socket.IO polling requests
  if (req.path.startsWith('/socket.io/')) {
    return next();
  }
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`📁 Upload directory: ${process.env['UPLOAD_DIR'] || 'uploads'}`);

  // Initialize default settings
  try {
    const { initializeDefaultSettings } = await import('./services/settingsService');
    await initializeDefaultSettings();
    console.log('⚙️ Default settings initialized');
  } catch (error) {
    console.error('Failed to initialize default settings:', error);
  }
});

export default app;