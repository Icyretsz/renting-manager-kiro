# Rental Management System

A comprehensive full-stack web application for managing rental properties with 18 rooms across 2 floors. The system provides role-based access control, automated meter reading management with photo verification, approval workflows, real-time notifications, and complete financial tracking with payment integration.

## Features

### Core Functionality
- **Room & Tenant Management** - Manage 18 rooms across 2 floors with tenant lifecycle tracking
- **Meter Reading System** - Water and electricity readings with photo verification and approval workflow
- **Automated Billing** - Calculate bills based on meter readings with configurable rates
- **Payment Integration** - PayOS payment gateway for online payments
- **Approval Workflows** - Admin approval system for readings, curfew requests, and maintenance requests
- **Real-time Notifications** - WebSocket and Firebase push notifications
- **Curfew Management** - Track and approve temporary/permanent curfew modifications
- **Financial Dashboard** - Comprehensive financial tracking and reporting for admins
- **User Management** - Role-based access control with user-tenant linking
- **Internationalization** - Multi-language support (English/Vietnamese)

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** + **Ant Design** - Modern UI framework
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching
- **Socket.io Client** - Real-time communication
- **i18next** - Internationalization
- **Auth0 React SDK** - Authentication

### Backend
- **Node.js** + **Express.js** with TypeScript
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Primary database
- **Redis** - Caching and session management
- **Socket.io** - Real-time WebSocket server
- **Auth0** + **JWT** - Authentication and authorization
- **Firebase Admin SDK** - Push notifications
- **AWS S3** - File storage for meter reading photos
- **PayOS** - Payment gateway integration
- **Multer** - File upload handling
- **Node-cron** - Scheduled jobs

### Infrastructure
- **Docker Compose** - Local development environment
- **pgAdmin** - Database management interface

## Project Structure

```
rental-management-app/
├── client/                     # React TypeScript frontend
│   ├── src/
│   │   ├── components/         # Feature-based components
│   │   │   ├── Approvals/      # Approval workflow UI
│   │   │   ├── Billing/        # Billing and payment UI
│   │   │   ├── MeterReadings/  # Meter reading forms
│   │   │   ├── UserManagement/ # User admin UI
│   │   │   └── ...
│   │   ├── pages/              # Route page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand state stores
│   │   ├── services/           # API client services
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Helper functions
│   │   └── i18n/               # Internationalization
│   └── package.json
├── server/                     # Node.js Express backend
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic layer
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Express middleware
│   │   ├── config/             # Configuration
│   │   ├── jobs/               # Cron jobs
│   │   ├── types/              # TypeScript definitions
│   │   └── utils/              # Utilities and errors
│   ├── prisma/                 # Database schema
│   │   ├── schema.prisma       # Prisma schema
│   │   └── migrations/         # Database migrations
│   └── package.json
└── docker-compose.yml          # Development services
```

## Prerequisites

- **Node.js** v18 or higher
- **Docker** and **Docker Compose**
- **Git**
- **Auth0 Account** (for authentication)
- **Firebase Project** (for push notifications)
- **AWS Account** (for S3 file storage)
- **PayOS Account** (for payment processing)

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd rental-management-app
```

### 2. Start Infrastructure Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- pgAdmin (port 8080)

### 3. Configure Backend
```bash
cd server
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Initialize database
npm run db:generate
npm run db:push

# Optional: Seed initial data
npm run seed

# Start development server
npm run dev
```

Server runs at `http://localhost:5000`

### 4. Configure Frontend
```bash
cd client
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

Client runs at `http://localhost:3000`

## Environment Configuration

### Server (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://rental_user:rental_password@localhost:5432/rental_management"

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# AWS S3
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# PayOS
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key

# Client URLs
CLIENT_URL_DEV=http://localhost:3000
CLIENT_URL_PROD=https://your-production-url.com
```

### Client (.env)
```env
# API
VITE_API_BASE_URL=http://localhost:5000/api

# Auth0
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier

# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

## Available Scripts

### Server
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio GUI
npm run seed         # Seed database with initial data
```

### Client
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Rooms
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/:id` - Get room details
- `PUT /api/rooms/:id` - Update room (Admin)

### Tenants
- `GET /api/tenants` - List tenants
- `POST /api/tenants` - Create tenant (Admin)
- `PUT /api/tenants/:id` - Update tenant (Admin)
- `DELETE /api/tenants/:id` - Delete tenant (Admin)

### Meter Readings
- `GET /api/readings` - List readings
- `POST /api/readings` - Submit reading
- `PUT /api/readings/:id/approve` - Approve reading (Admin)
- `PUT /api/readings/:id/reject` - Reject reading (Admin)

### Billing
- `GET /api/billing` - List billing records
- `GET /api/billing/:id` - Get billing details
- `POST /api/billing/generate` - Generate bills (Admin)

### Payments
- `POST /api/payments/create` - Create payment link
- `POST /api/payments/webhook` - PayOS webhook
- `GET /api/payments/:id/status` - Check payment status

### Approvals
- `GET /api/approvals/pending` - Get pending approvals (Admin)
- `GET /api/approvals/statistics` - Get approval statistics (Admin)

### Curfew
- `POST /api/curfew/request` - Request curfew modification
- `PUT /api/curfew/:id/approve` - Approve curfew (Admin)
- `PUT /api/curfew/:id/reject` - Reject curfew (Admin)

### Requests
- `GET /api/requests` - List requests
- `POST /api/requests` - Create request
- `PUT /api/requests/:id` - Update request status (Admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/fcm-token` - Register FCM token

### User Management
- `GET /api/user-management/users` - List users (Admin)
- `PUT /api/user-management/users/:id` - Update user (Admin)
- `POST /api/user-management/link-tenant` - Link user to tenant (Admin)

## Database Schema

Key models:
- **User** - System users with Auth0 integration
- **Room** - Rental rooms with base rent
- **Tenant** - Tenant information and room assignments
- **MeterReading** - Water/electricity readings with photos
- **BillingRecord** - Generated bills from readings
- **Payment** - Payment transactions via PayOS
- **Request** - Maintenance and repair requests
- **CurfewModification** - Curfew change requests
- **Notification** - User notifications
- **ReadingModification** - Audit trail for reading changes

## Database Access

### pgAdmin Web Interface
- URL: http://localhost:8080
- Email: admin@rental.com
- Password: admin123

### Direct PostgreSQL Connection
- Host: localhost
- Port: 5432
- Database: rental_management
- Username: rental_user
- Password: rental_password

## Development Workflow

1. Ensure Docker services are running: `docker-compose up -d`
2. Start backend: `cd server && npm run dev`
3. Start frontend: `cd client && npm run dev`
4. Access application at http://localhost:3000
5. Both servers support hot-reload for rapid development

## User Roles

### Admin
- Approve/reject meter readings
- Manage tenants and rooms
- Generate billing records
- View financial dashboard
- Approve curfew requests
- Manage user accounts
- View all system data

### User (Tenant)
- View assigned rooms
- Submit meter readings with photos
- View billing history
- Make payments
- Request curfew modifications
- Submit maintenance requests
- Receive notifications

## Real-time Features

The application uses WebSocket (Socket.io) for real-time updates:
- New meter reading submissions
- Approval/rejection notifications
- Payment status updates
- Curfew request updates
- System announcements

Firebase Cloud Messaging provides push notifications when users are offline.

## Scheduled Jobs

- **Curfew Reset Job** - Runs daily to reset temporary curfew modifications
- **Billing Generation** - Can be triggered to generate monthly bills
- **Notification Cleanup** - Removes old read notifications

## Security

- Auth0 JWT authentication on all protected routes
- Role-based authorization middleware
- Helmet.js for security headers
- CORS configured for specific origins
- Input validation with express-validator
- Secure file upload with type/size restrictions
- Environment-based configuration

## Internationalization

The application supports multiple languages:
- English (en)
- Vietnamese (vi)

Language files located in `client/src/i18n/locales/`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Format code: `npm run format`
5. Test your changes
6. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on the repository.