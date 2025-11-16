import { NotificationDB } from '@/types';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DollarOutlined,
  CreditCardOutlined,
  NotificationOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

export interface NavigationResult {
  path: string;
  shouldNavigate: boolean;
  description: string;
}

export const getNotificationNavigation = (notification: NotificationDB): NavigationResult => {
  const type = notification.type;

  switch (type) {
    // User notifications - navigate to user pages
    case 'bill_ready':
    case 'bill_generated':
      return {
        path: '/billing',
        shouldNavigate: true,
        description: 'View and pay your bill'
      };

    case 'payment_success':
    case 'payment_confirmed':
      return {
        path: '/billing',
        shouldNavigate: true,
        description: 'View payment confirmation'
      };

    case 'reading_approved':
      return {
        path: '/billing',
        shouldNavigate: true,
        description: 'View approved readings'
      };

    case 'reading_rejected':
      return {
        path: '/meter-readings',
        shouldNavigate: true,
        description: 'View rejected readings and resubmit'
      };

    case 'reading_modified':
      return {
        path: '/meter-readings',
        shouldNavigate: true,
        description: 'View modified readings'
      };

    // Admin notifications - navigate to admin pages
    case 'reading_submitted':
    case 'reading_updated':
      return {
        path: '/approvals',
        shouldNavigate: true,
        description: 'Review and approve readings'
      };

    case 'payment_received':
      return {
        path: '/financial-dashboard',
        shouldNavigate: true,
        description: 'View payment details'
      };

    // Curfew notifications
    case 'curfew_request':
      return {
        path: '/approvals',
        shouldNavigate: true,
        description: 'Review curfew override request'
      };

    case 'curfew_approved':
      return {
        path: '/profile',
        shouldNavigate: true,
        description: 'View curfew status'
      };

    case 'curfew_rejected':
      return {
        path: '/profile',
        shouldNavigate: true,
        description: 'View curfew status'
      };

    // System notifications - no navigation
    case 'system':
    default:
      return {
        path: '',
        shouldNavigate: false,
        description: 'System notification'
      };
  }
};

export const getNotificationActionText = (notification: NotificationDB): string => {
  const navigation = getNotificationNavigation(notification);
  
  if (!navigation.shouldNavigate) {
    return '';
  }

  return 'Tap to view';
};

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'reading_submitted':
      return FileTextOutlined;
    case 'reading_approved':
      return CheckCircleOutlined;
    case 'reading_rejected':
      return CloseCircleOutlined;
    case 'reading_modified':
      return EditOutlined;
    case 'bill_ready':
    case 'bill_generated':
      return DollarOutlined;
    case 'payment_success':
    case 'payment_confirmed':
    case 'payment_received':
      return CreditCardOutlined;
    case 'curfew_request':
    case 'curfew_approved':
    case 'curfew_rejected':
      return ClockCircleOutlined;
    case 'system':
      return NotificationOutlined;
    default:
      return NotificationOutlined;
  }
};