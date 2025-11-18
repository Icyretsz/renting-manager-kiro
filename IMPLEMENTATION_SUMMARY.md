# Request System Implementation Summary

## Overview
Successfully implemented a unified Request system that separates curfew-specific data while maintaining backward compatibility with the existing tenant-level curfew status fields (Option A - Hybrid Approach).

## Database Changes

### New Models Added

1. **Request Model** (`requests` table)
   - `id`: Unique identifier
   - `userId`: User who created the request
   - `roomId`: Room associated with the request
   - `requestType`: CURFEW, REPAIR, or OTHER
   - `status`: PENDING, APPROVED, or REJECTED
   - `description`: Text description (for repair/other requests)
   - `photoUrls`: Array of photo URLs (for repair requests, max 3)
   - `createdAt`, `updatedAt`: Timestamps
   - `approvedBy`, `approvedAt`: Approval tracking
   - `rejectionReason`: Reason for rejection

2. **CurfewRequest Model** (`curfew_requests` table)
   - `id`: Unique identifier
   - `requestId`: Links to Request (one-to-one)
   - `tenantIds`: Array of tenant IDs
   - `reason`: Optional reason for curfew request

### Enums Added
- `RequestType`: CURFEW, REPAIR, OTHER
- `RequestStatus`: PENDING, APPROVED, REJECTED

### Relations Updated
- User has many Requests (as creator)
- User has many Requests (as approver)
- Room has many Requests
- Request has one CurfewRequest (optional)

## Backend Implementation

### Controllers
- **`requestController.ts`**: New controller with endpoints:
  - `createRequest`: Create curfew/repair/other requests
  - `getUserRequests`: Get user's own requests
  - `getPendingRequests`: Get all pending requests (Admin)
  - `getAllRequests`: Get all requests with filters (Admin)
  - `approveRequest`: Approve a request (Admin)
  - `rejectRequest`: Reject a request (Admin)

### Routes
- **`/api/requests`**:
  - `POST /`: Create request
  - `GET /my-requests`: Get user's requests
  - `GET /pending`: Get pending requests (Admin)
  - `GET /all`: Get all requests with filters (Admin)
  - `POST /:requestId/approve`: Approve request (Admin)
  - `POST /:requestId/reject`: Reject request (Admin)

### Notification Service Updates
- Added new notification types:
  - `request_submitted`: Notify admins of new repair/other requests
  - `request_approved`: Notify user of request approval
  - `request_rejected`: Notify user of request rejection
- Functions added:
  - `notifyGeneralRequest()`
  - `notifyRequestApproved()`
  - `notifyRequestRejected()`

## Frontend Implementation

### Hooks
- **`useRequests.ts`**: React Query hooks for request management
  - `useCreateRequestMutation`: Create new requests
  - `useMyRequestsQuery`: Fetch user's requests
  - `usePendingRequestsQuery`: Fetch pending requests (Admin)
  - `useAllRequestsQuery`: Fetch all requests with filters (Admin)
  - `useApproveRequestMutation`: Approve requests (Admin)
  - `useRejectRequestMutation`: Reject requests (Admin)

### Components Updated
- **`RequestForm.tsx`**: Enhanced with:
  - Photo upload for repair requests (max 3 images)
  - Validation for different request types
  - Loading states for uploads
  - Better UX with character counts

- **`UserRequestPage.tsx`**: Updated to:
  - Use new unified request system
  - Handle photo uploads for repair requests
  - Support all three request types (curfew, repair, other)
  - Reset form and photo states after submission

### Types
- Added `Request` and `CurfewRequest` interfaces
- Added `RequestType` and `RequestStatus` types
- Updated `NotificationType` to include request notifications

### Translations (Vietnamese)
Added keys for:
- Request form labels and placeholders
- Photo upload instructions
- Success/error messages
- Notification titles and messages

### Utilities Updated
- **`getNotificationMessage.ts`**: Added handlers for request notifications
- **`notificationNavigation.ts`**: Added navigation for request notifications

## Key Features

### 1. Unified Request System
- Single endpoint for all request types
- Extensible for future request types
- Clean separation of concerns

### 2. Photo Upload for Repairs
- S3 integration using existing presigned URL system
- Maximum 3 photos per repair request
- Preview and remove functionality
- Reuses meter reading upload infrastructure

### 3. Backward Compatibility
- Tenant-level curfew status fields maintained
- Existing curfew functionality preserved
- Dual tracking: Request table + Tenant status
- No data migration required

### 4. Notifications
- Consistent notification pattern across all request types
- WebSocket + Firebase push notifications
- Proper navigation to relevant pages
- Localized messages

### 5. Admin Workflow
- View all pending requests
- Filter by type, status, room
- Approve/reject with reasons
- Automatic tenant status updates for curfew

## Migration Applied
- Migration: `20251118181928_add_request_system`
- Status: Successfully applied
- Prisma client generated

## Testing Checklist

### User Flow
- [ ] Create curfew request
- [ ] Create repair request with photos
- [ ] Create other request
- [ ] View request history
- [ ] Receive approval notification
- [ ] Receive rejection notification

### Admin Flow
- [ ] View pending requests
- [ ] Filter requests by type/status
- [ ] Approve curfew request (temporary)
- [ ] Approve curfew request (permanent)
- [ ] Approve repair request
- [ ] Reject request with reason
- [ ] Verify tenant status updates

### Photo Upload
- [ ] Upload 1-3 photos for repair
- [ ] Remove uploaded photo
- [ ] Submit with photos
- [ ] View photos in request history

## Next Steps (Optional Enhancements)

1. **Request History Modal**: Create a modal to view request history
2. **Admin Request Management Page**: Dedicated page for managing all requests
3. **Request Details View**: Detailed view with photos and full history
4. **Request Comments**: Allow back-and-forth communication
5. **Request Priority**: Add priority levels for urgent repairs
6. **Request Assignment**: Assign requests to specific admins
7. **Request Statistics**: Dashboard with request metrics

## Files Modified/Created

### Backend
- ✅ `server/prisma/schema.prisma` - Added Request and CurfewRequest models
- ✅ `server/src/controllers/requestController.ts` - New controller
- ✅ `server/src/routes/requestRoutes.ts` - New routes
- ✅ `server/src/services/notificationService.ts` - Added request notifications
- ✅ `server/src/index.ts` - Registered request routes

### Frontend
- ✅ `client/src/hooks/useRequests.ts` - New hooks
- ✅ `client/src/components/Requests/RequestForm.tsx` - Enhanced form
- ✅ `client/src/pages/UserRequestPage.tsx` - Updated page
- ✅ `client/src/types/index.ts` - Added Request types
- ✅ `client/src/i18n/locales/vi.json` - Added translations
- ✅ `client/src/utils/getNotificationMessage.ts` - Added request notifications
- ✅ `client/src/utils/notificationNavigation.ts` - Added request navigation

## Notes

- The system maintains tenant-level curfew status for fast queries
- Photo uploads reuse the existing S3 infrastructure
- All notifications follow the existing pattern
- The implementation is minimal and focused on core functionality
- Ready for production use after testing
