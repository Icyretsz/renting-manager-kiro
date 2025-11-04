# Implementation Plan

- [x] 1. Set up project structure and development environment
  - Create separate client and server directories with proper folder structure
  - Initialize React TypeScript project with Vite for client
  - Initialize Node.js TypeScript project with Express for server
  - Configure development environment with Docker Compose for database
  - Set up ESLint, Prettier, and TypeScript configurations for both projects
  - _Requirements: 11.1, 11.2, 11.5_

- [x] 2. Configure database and core backend infrastructure
  - [x] 2.1 Set up PostgreSQL database with Prisma ORM
    - Install and configure Prisma with PostgreSQL
    - Create database schema based on design document
    - Generate Prisma client and set up database connection
    - Create database migration files for room initialization (18 rooms)
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Implement Express server foundation
    - Set up Express.js server with TypeScript
    - Configure middleware for CORS, body parsing, and error handling
    - Implement global error handling middleware with custom error classes
    - Set up file upload handling with Multer for meter photos
    - _Requirements: 11.4, 11.3_

  - [x] 2.3 Implement authentication middleware and JWT validation
    - Install and configure Auth0 SDK for backend
    - Create JWT validation middleware for protected routes
    - Implement role-based authorization middleware (admin vs user)
    - Create user profile sync functionality with Auth0
    - _Requirements: 1.3, 1.4, 1.5_

- [x] 3. Implement core data models and services
  - [x] 3.1 Create room management functionality
    - Implement Room model with Prisma schema
    - Create room service layer with CRUD operations
    - Build room controller with REST endpoints
    - Add room-tenant relationship management
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Implement tenant management system
    - Create Tenant model with room assignment logic
    - Implement tenant service with occupancy validation (max 4 per room)
    - Build tenant controller with admin-only access controls
    - Add tenant move-in/move-out functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.3 Build user role and permission system (**REFACTORED**)
    - ~~Create user-room assignment functionality for regular users~~ **REMOVED**
    - **NEW**: Users now access rooms through tenant relationship (User ↔ Tenant → Room)
    - Implement role-based data filtering in services
    - Add user profile management endpoints
    - Create permission validation utilities
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [-] 4. Implement meter reading and photo upload system
  - [x] 4.1 Create meter reading data models and validation
    - Implement MeterReading model with decimal precision validation
    - Create reading modification log model for audit trail
    - Add validation for reading progression (no decrease from previous month)
    - Implement month/year uniqueness constraints per room
    - _Requirements: 5.2, 5.4, 6.1_

  - [x] 4.2 Build photo upload and storage functionality
    - Implement secure file upload endpoints for meter photos
    - Add image validation (file type, size limits)
    - Create file storage service with proper naming conventions
    - Build photo retrieval endpoints with access control
    - _Requirements: 5.3_

  - [x] 4.3 Implement reading submission and modification system
    - Create reading submission service with status management
    - Build modification tracking system with user audit trail
    - Implement reading update functionality for pending submissions
    - Add reading history retrieval with photo thumbnails
    - _Requirements: 5.1, 5.5, 6.2, 6.4_

- [x] 5. Build approval workflow and notification system
  - [x] 5.1 Implement Firebase Cloud Messaging integration
    - Set up Firebase Admin SDK for push notifications
    - Create notification service for sending targeted messages
    - Implement notification templates for different events
    - Build notification history and status tracking
    - _Requirements: 5.4, 6.3_

  - [x] 5.2 Create admin approval interface backend
    - Build pending readings retrieval endpoint for admin
    - Implement reading approval/rejection functionality
    - Create approval workflow with status updates and notifications
    - Add modification log display for admin review
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.3 Implement access control for approved readings
    - Add read-only enforcement for approved readings (tenant side)
    - Implement admin-only editing for approved readings
    - Create audit trail for post-approval modifications
    - Build reading status validation throughout the system
    - _Requirements: 6.3, 6.4_

- [x] 6. Develop billing calculation and financial reporting
  - [x] 6.1 Implement billing calculation engine
    - Create billing service with formula implementation (3500 × electricity + 22000 × water + base_rent + 52000)
    - Build usage calculation from meter reading differences
    - Implement real-time bill calculation for user interface
    - Add billing record generation for approved readings
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.2 Build financial reporting system
    - Create financial reports service with room-based aggregation
    - Implement income tracking with monthly/yearly summaries
    - Build payment status tracking and overdue detection
    - Add export functionality for financial data
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7. Set up React frontend foundation
  - [x] 7.1 Initialize React project with core dependencies
    - Create React TypeScript project with Vite
    - Install and configure Tailwind CSS with Ant Design
    - Set up React Router for navigation
    - Configure Axios for API communication
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [x] 7.2 Implement state management with Zustand and React Query
    - Set up Zustand stores for auth, UI, and notification state
    - Configure React Query (TanStack Query) for server state management
    - Create custom hooks for API interactions
    - Implement persistent storage for auth state
    - _Requirements: 1.1, 1.2_

  - [x] 7.3 Build authentication integration with Auth0
    - Install and configure Auth0 React SDK
    - Create authentication provider with Zustand integration
    - Implement login/logout functionality with token management
    - Build role-based route protection components
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 8. Create user interface components and layouts
  - [x] 8.1 Build core layout and navigation components
    - Create responsive layout with sidebar navigation
    - Implement role-based navigation menu
    - Build header with user profile and logout functionality
    - Add loading states and error boundaries
    - _Requirements: 10.3, 10.4, 10.5_

  - [x] 8.2 Implement admin dashboard and management interfaces
    - Create admin dashboard with overview statistics
    - Build room management interface with floor-based organization
    - Implement tenant management with CRUD operations
    - Add user-room assignment interface for regular users
    - _Requirements: 2.3, 3.1, 3.4, 4.2_

  - [x] 8.3 Build meter reading input interface
    - Create meter reading form with decimal input validation
    - Implement photo upload components for water and electricity meters
    - Add previous reading display and usage calculation
    - Build real-time bill calculation display
    - _Requirements: 5.1, 5.2, 5.3, 7.5_

- [x] 9. Implement approval workflow and notification UI
  - [x] 9.1 Create admin approval interface
    - Build pending readings list with filtering capabilities
    - Implement reading review interface with photo display
    - Add approval/rejection functionality with confirmation dialogs
    - Create modification history display with audit trail
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 9.2 Implement notification system UI
    - Set up Firebase Cloud Messaging in React
    - Create notification display components
    - Build notification history and status management
    - Add push notification handling and user interactions
    - _Requirements: 5.4, 6.3_

  - [x] 9.3 Build access control for reading modifications
    - Implement conditional editing based on reading status
    - Add read-only displays for approved readings (tenant view)
    - Create admin override functionality for approved readings
    - Build modification tracking display for transparency
    - _Requirements: 5.1, 5.2, 6.3, 6.4_

- [ ] 10. Develop financial reporting and billing interfaces
  - [ ] 10.1 Create billing history and payment tracking
    - Build billing history display with filtering and search
    - Implement payment status indicators and overdue highlighting
    - Add room-based billing views for regular users
    - Create comprehensive billing views for admin users
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ] 10.2 Implement financial reporting dashboard
    - Create financial dashboard with charts and graphs using Chart.js or Recharts
    - Build income tracking visualizations by room and floor
    - Implement monthly/yearly financial summaries
    - Add export functionality for financial reports
    - _Requirements: 8.2, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 10.3 Build comprehensive user and tenant management interface
    - Create admin users management page with CRUD operations
    - Implement tenant management interface with room assignment
    - Build user profile management with role assignment
    - Add search and filtering capabilities for users and tenants
    - Create bulk operations for user/tenant management
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [ ] 11. **UPDATED**: Implement Admin Tenant-User Account Linking System
  - [ ] 11.1 Enhance backend services for user-tenant linking
    - Build service to link existing user accounts to tenant records
    - Implement service to unlink user accounts from tenants
    - Create suggestion system based on email matching between users and tenants
    - Add validation to prevent duplicate user-tenant links
    - _Requirements: Admin-controlled user-tenant relationship management_

  - [ ] 11.2 Build integrated linking interface within user/tenant management
    - Integrate linking functionality into the user and tenant management pages
    - Implement linking/unlinking actions with confirmation dialogs
    - Add visual indicators for linked vs unlinked users and tenants
    - Build suggestion display for automatic email-based matching
    - Create bulk linking operations for efficiency
    - _Requirements: Seamless integration with existing management interfaces_

- [ ]* 12. Testing and quality assurance
  - [ ]* 12.1 Write backend unit and integration tests
    - Create unit tests for service layer functions
    - Write integration tests for API endpoints
    - Add database testing with test data seeding
    - Test authentication and authorization middleware
    - _Requirements: All backend requirements_

  - [ ]* 12.2 Implement frontend component and integration tests
    - Write unit tests for React components using React Testing Library
    - Create integration tests for user workflows
    - Add tests for state management (Zustand stores and React Query)
    - Test authentication flows and role-based access
    - _Requirements: All frontend requirements_

  - [ ]* 12.3 End-to-end testing for critical workflows
    - Create E2E tests for meter reading submission and approval workflow
    - Test billing calculation and financial reporting
    - Add tests for notification system and user interactions
    - Test file upload and photo management functionality
    - _Requirements: 5.1-5.5, 6.1-6.4, 7.1-7.5_

- [ ] 13. Deployment and production setup
  - [ ] 13.1 Configure production environment
    - Set up Docker containers for client and server applications
    - Configure production database with proper indexing
    - Set up environment variables and secrets management
    - Configure file storage for production (local or cloud)
    - _Requirements: 11.1, 11.2_

  - [ ] 13.2 Implement monitoring and logging
    - Set up application logging for both client and server
    - Configure error tracking and monitoring
    - Add performance monitoring for API endpoints
    - Implement health checks and status endpoints
    - _Requirements: 11.3, 11.4_

  - [ ]* 13.3 Security hardening and optimization
    - Implement security headers and HTTPS configuration
    - Add rate limiting and DDoS protection
    - Optimize database queries and add proper indexing
    - Configure CDN for static assets and images
    - _Requirements: 1.3, 1.4, 1.5_