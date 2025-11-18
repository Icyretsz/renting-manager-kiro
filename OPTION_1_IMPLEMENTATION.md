# Option 1 Implementation: Separate Systems

## Overview
Implemented Option 1 where curfew and general requests use completely separate systems:
- **Curfew requests**: Use existing `/api/curfew` routes (no changes to existing logic)
- **General requests**: Use new `/api/requests` routes (REPAIR and OTHER types only)

## Changes Made

### Backend

#### 1. Request Controller (`server/src/controllers/requestController.ts`)
**Removed curfew logic entirely:**
- `createRequest`: Now only accepts REPAIR and OTHER types
  - Returns error if CURFEW type is submitted
  - Validates description is required
  - Creates Request record
  - Sends notification to admins

- `approveRequest`: Only handles REPAIR and OTHER
  - Returns error if CURFEW type
  - Updates request status to APPROVED
  - Sends notification to user

- `rejectRequest`: Only handles REPAIR and OTHER
  - Returns error if CURFEW type
  - Updates request status to REJECTED
  - Sends notification to user with reason

**Key validation:**
```typescript
if (!['REPAIR', 'OTHER'].includes(requestType)) {
  throw new ValidationError('Invalid request type. Use /api/curfew/request for curfew requests.');
}
```

#### 2. Prisma Schema (`server/prisma/schema.prisma`)
**Kept for backward compatibility:**
- `CurfewRequest` model remains (has existing data)
- `CURFEW` enum value remains (for existing records)
- Request model keeps `curfewRequest` relation (optional)

**Note:** No migration needed - schema unchanged from database perspective

### Frontend

#### 1. UserRequestPage (`client/src/pages/UserRequestPage.tsx`)
**Updated to use both systems:**
- Imports `useRequestCurfewOverrideMutation` from `useCurfew` hook
- Curfew requests → Old curfew route (`/api/curfew/request`)
- Repair requests → New request route (`/api/requests`)
- Other requests → New request route (`/api/requests`)

**Request routing logic:**
```typescript
if (values.requestType === 'curfew') {
  // Use old curfew route
  await curfewRequestMutation.mutateAsync({
    tenantIds: values.tenantIds,
    reason: values.curfewReason,
  });
} else if (values.requestType === 'repair') {
  // Use new request route
  await createRequestMutation.mutateAsync({
    requestType: 'REPAIR',
    description: values.requestDescription,
    photoUrls: photoUrls,
  });
}
```

## System Architecture

### Curfew System (Unchanged)
```
User → /api/curfew/request
  ↓
curfewController.requestCurfewOverride()
  ↓
- Update tenant.curfewStatus → PENDING
- Create CurfewModification record
- Send notification to admins
  ↓
Admin → /api/curfew/approve or /api/curfew/reject
  ↓
- Update tenant.curfewStatus
- Create CurfewModification record
- Send notification to user
```

### General Request System (New)
```
User → /api/requests (REPAIR/OTHER only)
  ↓
requestController.createRequest()
  ↓
- Create Request record
- Send notification to admins
  ↓
Admin → /api/requests/:id/approve or /api/requests/:id/reject
  ↓
- Update Request.status
- Send notification to user
```

## API Endpoints

### Curfew (Existing - No Changes)
- `POST /api/curfew/request` - Request curfew override
- `POST /api/curfew/approve` - Approve curfew (Admin)
- `POST /api/curfew/reject` - Reject curfew (Admin)
- `GET /api/curfew/room-tenants` - Get room tenants
- `GET /api/curfew/pending` - Get pending curfew requests (Admin)

### General Requests (New - REPAIR/OTHER Only)
- `POST /api/requests` - Create repair/other request
- `GET /api/requests/my-requests` - Get user's requests
- `GET /api/requests/pending` - Get pending requests (Admin)
- `GET /api/requests/all` - Get all requests with filters (Admin)
- `POST /api/requests/:id/approve` - Approve request (Admin)
- `POST /api/requests/:id/reject` - Reject request (Admin)

## Benefits of This Approach

1. **No Breaking Changes**: Existing curfew system works exactly as before
2. **Clean Separation**: Each system has its own responsibility
3. **No Data Migration**: Existing curfew data remains untouched
4. **Simple Logic**: No complex conditional logic mixing two systems
5. **Easy to Maintain**: Each system can be modified independently

## Database Tables

### Curfew System Uses:
- `tenants` table (curfewStatus, curfewRequestedAt, etc.)
- `curfew_modifications` table (audit trail)

### General Request System Uses:
- `requests` table (REPAIR and OTHER types only)
- `curfew_requests` table (legacy, not used for new requests)

## Frontend Components

### Curfew Requests:
- `CurfewOverrideModal.tsx` - Standalone modal (unchanged)
- `CurfewQuickAccessCard.tsx` - Dashboard widget (unchanged)
- Uses `useCurfew.ts` hooks

### General Requests:
- `RequestForm.tsx` - Unified form for all request types
- `UserRequestPage.tsx` - Main request page
- Uses `useRequests.ts` hooks for REPAIR/OTHER
- Uses `useCurfew.ts` hooks for CURFEW

## Testing Checklist

### Curfew (Should work as before)
- [ ] Create curfew request from CurfewOverrideModal
- [ ] Create curfew request from UserRequestPage
- [ ] Admin approve curfew (temporary)
- [ ] Admin approve curfew (permanent)
- [ ] Admin reject curfew
- [ ] Tenant status updates correctly
- [ ] Notifications sent properly

### General Requests (New functionality)
- [ ] Create repair request with photos
- [ ] Create repair request without photos
- [ ] Create other request
- [ ] View my requests
- [ ] Admin view pending requests
- [ ] Admin approve repair request
- [ ] Admin reject repair request with reason
- [ ] Notifications sent properly

### Error Handling
- [ ] Try to create CURFEW via /api/requests → Should fail
- [ ] Try to approve CURFEW via /api/requests/:id/approve → Should fail
- [ ] Try to reject CURFEW via /api/requests/:id/reject → Should fail

## Notes

- The `CurfewRequest` model and `CURFEW` enum value are kept in the schema for backward compatibility with existing data
- New curfew requests should NOT create records in the `requests` table
- The request system is now exclusively for REPAIR and OTHER types
- Both systems can coexist and operate independently
