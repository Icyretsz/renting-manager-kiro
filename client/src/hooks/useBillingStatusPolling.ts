import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { ApiResponse } from '@/types';
import { billingKeys } from './useBilling';
import { useSocketStore } from '../stores/socketStore';

interface BillingStatus {
  id: string;
  paymentStatus: 'UNPAID' | 'PAID' | 'OVERDUE';
  paymentDate: Date | null;
  totalAmount: number;
  month: number;
  year: number;
  createdAt: Date;
}

interface UseBillingStatusPollingOptions {
  billingRecordId: string | null;
  enabled: boolean;
  onPaymentSuccess?: () => void;
  interval?: number; // milliseconds
  useWebSocket?: boolean; // Enable hybrid mode with WebSocket
}

export const useBillingStatusPolling = ({
  billingRecordId,
  enabled,
  onPaymentSuccess,
  interval = 3000, // Poll every 3 seconds
  useWebSocket = true, // Enable WebSocket by default for hybrid approach
}: UseBillingStatusPollingOptions) => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocketStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const hasReceivedWebSocketUpdate = useRef(false);

  // WebSocket listener for instant payment updates
  useEffect(() => {
    if (!useWebSocket || !socket || !isConnected || !enabled || !billingRecordId) {
      return;
    }

    const handlePaymentUpdate = (data: { billingRecordId: string; paymentStatus: string }) => {
      console.log('📡 WebSocket payment update received:', data);
      
      if (data.billingRecordId === billingRecordId && data.paymentStatus === 'PAID') {
        hasReceivedWebSocketUpdate.current = true;
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: billingKeys.byId(billingRecordId) });
        queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
        queryClient.invalidateQueries({ queryKey: billingKeys.summary() });
        
        // Call success callback
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        
        // Stop polling since we got WebSocket update
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    socket.on('payment:status_update', handlePaymentUpdate);

    return () => {
      socket.off('payment:status_update', handlePaymentUpdate);
    };
  }, [socket, isConnected, useWebSocket, enabled, billingRecordId, onPaymentSuccess, queryClient]);

  // Polling as fallback mechanism
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start polling if not enabled or no billing record ID
    if (!enabled || !billingRecordId) {
      return;
    }

    // Reset WebSocket flag when starting new polling session
    hasReceivedWebSocketUpdate.current = false;

    const pollStatus = async () => {
      // Skip polling if we already received WebSocket update
      if (hasReceivedWebSocketUpdate.current) {
        return;
      }

      try {
        const response = await api.get<ApiResponse<BillingStatus>>(
          `/billing/${billingRecordId}/status`
        );
        
        const status = response.data.data;
        
        if (status) {
          const currentStatus = status.paymentStatus;
          
          // Check if payment status changed to PAID
          if (currentStatus === 'PAID' && lastStatusRef.current !== 'PAID') {
            console.log('✅ Polling detected payment success');
            
            // Invalidate all related queries to refresh data
            queryClient.invalidateQueries({ queryKey: billingKeys.byId(billingRecordId) });
            queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
            queryClient.invalidateQueries({ queryKey: billingKeys.summary() });
            
            // Call success callback
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            
            // Stop polling after successful payment
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
          
          lastStatusRef.current = currentStatus;
        }
      } catch (error) {
        console.error('Error polling billing status:', error);
      }
    };

    // Poll immediately on start
    pollStatus();

    // Set up interval for subsequent polls
    intervalRef.current = setInterval(pollStatus, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [billingRecordId, enabled, interval, onPaymentSuccess, queryClient]);

  // Cleanup function to manually stop polling
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { stopPolling };
};
