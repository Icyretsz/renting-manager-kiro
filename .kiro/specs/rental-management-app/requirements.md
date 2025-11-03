# Requirements Document

## Introduction

A rental management application for managing a single building with multiple rental rooms. The system enables tracking of tenants, individual room billing with utilities (water, electricity), base rent, and trash fees. The system will provide separate client and server applications with secure authentication and a modern user interface.

## Glossary

- **Rental_Management_System**: The complete application consisting of client and server components
- **Client_Application**: React-based frontend application using TypeScript, Tailwind CSS, and Ant Design
- **Server_Application**: Node.js Express-based backend API server
- **Admin_User**: Building owner with full system access and administrative privileges
- **Regular_User**: System user who can view room information, tenants, and billing data for their assigned rooms
- **Tenant**: Individual who rents space in a room (up to 4 tenants per room)
- **Rental_Room**: Individual room within the building, numbered 1-18, available for rent
- **Floor_One**: Building floor containing rooms 1-9
- **Floor_Two**: Building floor containing rooms 10-18
- **Water_Meter**: Device measuring water consumption for a specific room
- **Electricity_Meter**: Device measuring electricity consumption for a specific room
- **Base_Rent**: Fixed monthly rental amount per room (editable by Admin_User only)
- **Trash_Fee**: Fixed monthly fee of 52,000 for waste management services per room
- **Electricity_Rate**: Fixed rate of 3,500 per unit of electricity consumption
- **Water_Rate**: Fixed rate of 22,000 per unit of water consumption
- **Meter_Reading_Precision**: Decimal readings with one digit after the decimal point (e.g., 123.4)
- **Monthly_Bill**: Combined billing statement including base rent and utility charges per room
- **Meter_Reading_Entry**: User interface for inputting current month utility readings with photo upload capability
- **Meter_Photo**: Digital image of water or electricity meter uploaded by user for verification purposes
- **Reading_Submission**: Monthly meter reading entry with photos submitted by a tenant for a specific room
- **Reading_Approval_Status**: Status indicating whether submitted readings are pending, approved, or rejected by Admin_User
- **Reading_Modification_Log**: Audit trail recording who made changes to readings and when the changes occurred
- **Approved_Reading**: Reading entry that has been approved by Admin_User and is locked from tenant modifications
- **Firebase_Cloud_Messaging**: Push notification service for notifying admin of new submissions and users of approvals
- **Billing_History**: Historical record of monthly bills and payments for rooms
- **Room_Occupancy**: Current number of tenants in a room (maximum 4 per room)
- **Auth0_Service**: Third-party authentication service providing JWT tokens
- **JWT_Token**: JSON Web Token used for API authentication

## Requirements

### Requirement 1

**User Story:** As a system user, I want to securely access the rental management system with role-based permissions, so that I can access appropriate features based on my user role.

#### Acceptance Criteria

1. WHEN a user attempts to access the Client_Application, THE Rental_Management_System SHALL redirect to Auth0_Service for authentication
2. WHEN Auth0_Service successfully authenticates a user, THE Rental_Management_System SHALL receive a valid JWT_Token with user role information
3. WHEN the Client_Application makes API calls to the Server_Application, THE Rental_Management_System SHALL include the JWT_Token in request headers
4. WHEN the Server_Application receives an API request, THE Rental_Management_System SHALL validate the JWT_Token and user permissions before processing the request
5. THE Rental_Management_System SHALL distinguish between Admin_User and Regular_User roles and provide appropriate access levels

### Requirement 2

**User Story:** As an admin user, I want to manage the 18 rental rooms in my building, so that I can keep track of room occupancy and availability across both floors.

#### Acceptance Criteria

1. THE Rental_Management_System SHALL initialize with 18 predefined rental rooms numbered 1 through 18
2. THE Rental_Management_System SHALL assign rooms 1-9 to Floor_One and rooms 10-18 to Floor_Two
3. WHEN an Admin_User views rental rooms, THE Rental_Management_System SHALL display rooms organized by floor with current occupancy count
4. THE Rental_Management_System SHALL track the number of tenants in each room with a maximum capacity of 4 tenants per room
5. WHEN an Admin_User updates room information, THE Rental_Management_System SHALL save the changes and reflect them immediately

### Requirement 3

**User Story:** As an admin user, I want to manage tenant information and room assignments, so that I can maintain accurate records of who is renting space in each room.

#### Acceptance Criteria

1. WHEN an Admin_User adds a new tenant, THE Rental_Management_System SHALL store tenant contact information and assign them to a specific rental room
2. WHEN an Admin_User assigns a tenant to a room, THE Rental_Management_System SHALL increment the room occupancy count
3. THE Rental_Management_System SHALL prevent assigning more than 4 tenants to any single room
4. WHEN an Admin_User views tenant information, THE Rental_Management_System SHALL display tenant details, their assigned room, and floor location
5. WHEN a tenant moves out, THE Rental_Management_System SHALL decrement the room occupancy count and update availability status

### Requirement 4

**User Story:** As a regular user, I want to view information about my assigned rooms and tenants, so that I can stay informed about the properties I manage.

#### Acceptance Criteria

1. WHEN a Regular_User logs in, THE Rental_Management_System SHALL display only the rooms they are authorized to view
2. WHEN a Regular_User views room information, THE Rental_Management_System SHALL show tenant details, occupancy status, and room location
3. THE Rental_Management_System SHALL prevent Regular_User from modifying tenant information or room assignments
4. WHEN a Regular_User views tenant information, THE Rental_Management_System SHALL display current tenant details for their authorized rooms
5. THE Rental_Management_System SHALL restrict Regular_User access to only their assigned rooms and associated data

### Requirement 5

**User Story:** As a tenant, I want to input and modify utility meter readings with proper access control and audit tracking, so that I can make changes before approval while maintaining accountability.

#### Acceptance Criteria

1. WHEN a tenant accesses the Meter_Reading_Entry page, THE Rental_Management_System SHALL check the Reading_Approval_Status for the current month and room
2. IF readings have pending approval status, THEN THE Rental_Management_System SHALL allow modifications and record all changes in the Reading_Modification_Log with user identity and timestamp
3. IF readings have approved status, THEN THE Rental_Management_System SHALL display the readings in read-only mode for tenants
4. WHEN a tenant modifies existing pending readings, THE Rental_Management_System SHALL update the Reading_Submission and log the modification details
5. WHEN a tenant submits new or modified readings, THE Rental_Management_System SHALL send a push notification to Admin_User via Firebase_Cloud_Messaging

### Requirement 6

**User Story:** As an admin user, I want to review, approve, and manage meter readings with full edit control after approval, so that I can maintain data accuracy and have final authority over billing data.

#### Acceptance Criteria

1. WHEN an Admin_User views the approval page, THE Rental_Management_System SHALL display previous month readings, current submitted readings, calculated total amount, uploaded meter photos, and Reading_Modification_Log
2. WHEN an Admin_User approves readings, THE Rental_Management_System SHALL update the Reading_Approval_Status to approved, lock tenant editing access, and send a push notification to relevant tenants
3. WHEN an Admin_User needs to modify Approved_Reading entries, THE Rental_Management_System SHALL allow Admin_User to edit readings and record the changes in Reading_Modification_Log
4. WHEN an Admin_User rejects readings, THE Rental_Management_System SHALL update the Reading_Approval_Status to rejected and allow new tenant submissions for that room and month
5. THE Rental_Management_System SHALL only generate final bills for rooms with approved Reading_Submission entries

### Requirement 7

**User Story:** As a system user, I want to generate monthly bills per room using specific calculation formulas, so that billing is consistent and accurate based on actual utility consumption for each room.

#### Acceptance Criteria

1. WHEN calculating electricity charges, THE Rental_Management_System SHALL multiply the difference between current and previous electricity readings by 3,500 per room
2. WHEN calculating water charges, THE Rental_Management_System SHALL multiply the difference between current and previous water readings by 22,000 per room
3. WHEN generating a monthly bill, THE Rental_Management_System SHALL use the formula per room: (3,500 × electricity_difference) + (22,000 × water_difference) + base_rent + 52,000
4. THE Rental_Management_System SHALL accept meter readings as decimal numbers with one digit after the decimal point
5. WHEN approved readings exist, THE Rental_Management_System SHALL calculate and display the final amount due per room using the specified formula

### Requirement 8

**User Story:** As a system user, I want to view billing history and financial information appropriate to my role, so that I can track payments and income data.

#### Acceptance Criteria

1. WHEN a Regular_User views billing history, THE Rental_Management_System SHALL display billing records only for their authorized rooms
2. WHEN an Admin_User views financial reports, THE Rental_Management_System SHALL display comprehensive income summaries with graphical representations
3. WHEN any user tracks payments, THE Rental_Management_System SHALL show payment history for relevant rooms
4. WHEN a payment is overdue, THE Rental_Management_System SHALL highlight the overdue status
5. WHEN an Admin_User accesses financial reports, THE Rental_Management_System SHALL calculate total monthly income across all occupied rooms

### Requirement 9

**User Story:** As an admin user, I want to view comprehensive financial analytics and income tracking, so that I can monitor the building's financial performance.

#### Acceptance Criteria

1. WHEN an Admin_User views the financial dashboard, THE Rental_Management_System SHALL display income tracking with graphical charts
2. WHEN an Admin_User analyzes billing history, THE Rental_Management_System SHALL provide filtering and sorting capabilities by room, tenant, or date
3. THE Rental_Management_System SHALL generate monthly and yearly financial summaries accessible only to Admin_User
4. WHEN an Admin_User views income reports, THE Rental_Management_System SHALL display revenue breakdowns by room and floor
5. THE Rental_Management_System SHALL provide export functionality for financial data for Admin_User

### Requirement 10

**User Story:** As a system user, I want to interact with a modern and intuitive interface, so that I can efficiently perform rental management tasks without confusion.

#### Acceptance Criteria

1. THE Client_Application SHALL use Ant Design components for consistent user interface elements
2. THE Client_Application SHALL implement responsive design using Tailwind CSS for optimal viewing on different devices
3. WHEN a user performs an action, THE Client_Application SHALL provide immediate visual feedback
4. THE Client_Application SHALL display loading states during API requests to the Server_Application
5. THE Client_Application SHALL handle and display error messages in a user-friendly manner

### Requirement 11

**User Story:** As a system administrator, I want the application to be properly structured and maintainable, so that future development and deployment can be managed effectively.

#### Acceptance Criteria

1. THE Rental_Management_System SHALL organize the Client_Application in a separate folder structure
2. THE Rental_Management_System SHALL organize the Server_Application in a separate folder structure
3. THE Server_Application SHALL implement RESTful API endpoints for all client operations with role-based access control
4. THE Server_Application SHALL use Express.js framework for handling HTTP requests and responses
5. THE Client_Application SHALL be built with React and TypeScript for type safety and maintainability