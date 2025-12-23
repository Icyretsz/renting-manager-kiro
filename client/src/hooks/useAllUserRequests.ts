import { useQuery } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import api from '@/services/api';
import { Request as UserRequest, ApiResponse } from '@/types';

/**
 * Combined hook to fetch all user requests including:
 * - Curfew requests (from curfew modifications)
 * - Repair requests (from requests table)
 * - Other requests (from requests table)
 */
export const useAllUserRequestsQuery = () => {
  const { isAuthenticated, user } = useAuth0();

  return useQuery({
    queryKey: ['allUserRequests'],
    queryFn: async (): Promise<UserRequest[]> => {
      // Fetch general requests (repair/other)
      const generalRequestsResponse = await api.get<ApiResponse<UserRequest[]>>(
        '/requests/my-requests'
      );
      const generalRequests = generalRequestsResponse.data.data || [];

      // Fetch curfew modifications to construct curfew request history
      const curfewModsResponse = await api.get<ApiResponse<any[]>>(
        '/curfew/my-modifications'
      );
      const curfewMods = curfewModsResponse.data.data || [];

      // Group curfew modifications by request date to create request objects
      const curfewRequestsMap = new Map<string, any>();

      curfewMods.forEach((mod: any) => {
        if (mod.modificationType === 'REQUEST') {
          const dateKey = new Date(mod.modifiedAt).toISOString().split('T')[0];
          const requestKey = `${dateKey}-${mod.tenant.roomId}`;

          if (!curfewRequestsMap.has(requestKey)) {
            curfewRequestsMap.set(requestKey, {
              id: `curfew-${requestKey}`,
              requestType: 'CURFEW',
              status: 'PENDING',
              createdAt: mod.modifiedAt,
              updatedAt: mod.modifiedAt,
              description: mod.reason,
              photoUrls: [],
              curfewRequest: {
                tenantIds: [mod.tenantId],
                tenantNames: [mod.tenant.name], // Store tenant names
                reason: mod.reason,
              },
              room: {
                roomNumber: mod.tenant.room?.roomNumber || 0,
              },
            });
          } else {
            // Add tenant to existing request
            const existing = curfewRequestsMap.get(requestKey);
            existing.curfewRequest.tenantIds.push(mod.tenantId);
            existing.curfewRequest.tenantNames.push(mod.tenant.name);
          }
        }
      });

      // Update status based on subsequent modifications
      curfewMods.forEach((mod: any) => {
        if (
          mod.modificationType === 'APPROVE' ||
          mod.modificationType === 'REJECT'
        ) {
          const dateKey = new Date(mod.modifiedAt).toISOString().split('T')[0];
          const requestKey = `${dateKey}-${mod.tenant.roomId}`;
          const request = curfewRequestsMap.get(requestKey);

          if (request) {
            request.status =
              mod.modificationType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
            request.approvedAt = mod.modifiedAt;
            if (mod.modificationType === 'REJECT' && mod.reason) {
              request.rejectionReason = mod.reason;
            }
          }
        }
      });

      const curfewRequests = Array.from(curfewRequestsMap.values());

      // Combine and sort by creation date (newest first)
      const allRequests = [...generalRequests, ...curfewRequests].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return allRequests;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 30000,
  });
};
