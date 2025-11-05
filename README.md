# Rental Management System

A full-stack web application for managing rental properties with 18 rooms across 2 floors. The system provides role-based access control, meter reading management with photo verification, approval workflows, and comprehensive financial tracking.

## Project Structure

```
rental-management-app/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── stores/         # Zustand state management
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── services/       # API service functions
│   └── package.json
├── server/                 # Node.js Express backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── config/         # Configuration files
│   ├── prisma/             # Database schema and migrations
│   └── package.json
└── docker-compose.yml      # Development environment setup
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Ant Design** for UI components
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for server state management
- **Axios** for API communication
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **Multer** for file uploads
- **Firebase Admin SDK** for push notifications

### Database & Services
- **PostgreSQL** for primary data storage
- **Auth0** for authentication
- **Firebase Cloud Messaging** for notifications

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Git

## Development Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd rental-management-app
```

### 2. Start the database services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis for caching on port 6379
- pgAdmin for database management on port 8080

### 3. Set up the server
```bash
cd server
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client and run migrations
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

The server will be available at `http://localhost:5000`

### 4. Set up the client
```bash
cd client
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

The client will be available at `http://localhost:3000`

## Environment Configuration

### Server (.env)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://rental_user:rental_password@localhost:5432/rental_management"

# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

### Client (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
# ... other Firebase config
```

## Available Scripts

### Server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Database Access

- **pgAdmin**: http://localhost:8080
  - Email: admin@rental.com
  - Password: admin123

- **Direct Connection**:
  - Host: localhost
  - Port: 5432
  - Database: rental_management
  - Username: rental_user
  - Password: rental_password

## Development Workflow

1. Make sure Docker services are running
2. Start the server in development mode
3. Start the client in development mode
4. Both applications will hot-reload on file changes

## Next Steps

After setting up the development environment, you can proceed with implementing the remaining tasks from the specification:

1. Configure database and core backend infrastructure
2. Implement core data models and services
3. Build the React frontend components
4. Integrate authentication and authorization
5. Implement the approval workflow and notifications

Refer to the tasks.md file in the .kiro/specs/rental-management-app/ directory for detailed implementation tasks.