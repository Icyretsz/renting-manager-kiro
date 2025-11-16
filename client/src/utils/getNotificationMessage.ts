import i18n from '@/i18n/config';
import { WebsocketNotification } from '@/types';


const GetNotificationMessage = (notification: WebsocketNotification): {title: string, message: string} => {
  const t = i18n.t.bind(i18n);

  switch (notification.type) {
    case "reading_submitted":
      return {
        title: t('notifications.readingSubmittedTitle'),
        message: t('notifications.readingSubmittedNoti', {
          roomNumber: notification.data.roomNumber,
          month: notification.data.month,
          year: notification.data.year
        })
      }

    case "reading_updated":
      return {
        title: t('notifications.readingUpdatedTitle'),
        message: t('notifications.readingUpdatedNoti', {
          roomNumber: notification.data.roomNumber,
          month: notification.data.month,
          year: notification.data.year
        })
      }

    case "reading_approved":
      return {
        title: t('notifications.readingApprovedTitle'),
        message: t('notifications.readingApprovedNoti', {
          roomNumber: notification.data.roomNumber,
          month: notification.data.month,
          year: notification.data.year
        })
      }

    case "reading_rejected":
      return {
        title: t('notifications.readingRejectedTitle'),
        message: t('notifications.readingRejectedNoti', {
          roomNumber: notification.data.roomNumber,
          month: notification.data.month,
          year: notification.data.year,
          reason: notification.data.reason || ''
        })
      }

    case "reading_modified":
      return {
        title: t('notifications.readingModifiedTitle'),
        message: t('notifications.readingModifiedNoti', {
          roomNumber: notification.data.roomNumber,
          month: notification.data.month,
          year: notification.data.year
        })
      }

    case "bill_generated":
      return {
        title: t('notifications.billGeneratedTitle'),
        message: t('notifications.billGeneratedNoti', {
          roomNumber: notification.data.roomNumber,
          month: notification.data.month,
          year: notification.data.year,
          amount: notification.data.amount
        })
      }

    case "bill_payed":
      return {
        title: t('notifications.billPayedTitle'),
        message: t('notifications.billPayedNoti', {
          roomNumber: notification.data.roomNumber,
          month: notification.data.month,
          year: notification.data.year,
          amount: notification.data.amount
        })
      }

    case "curfew_request":
      return {
        title: t('notifications.curfewRequestTitle'),
        message: t('notifications.curfewRequestNoti', {
          requesterName: notification.data.requesterName,
          roomNumber: notification.data.roomNumber,
          tenantName: notification.data.requestedName,
          reason: notification.data.reason || ''
        })
      }

    case "curfew_approved":
      return {
        title: t('notifications.curfewApprovedTitle'),
        message: notification.data.isPermanent
          ? t('notifications.curfewApprovedPermaNoti', {
            requestedName: notification.data.requestedName
          })
          : t('notifications.curfewApprovedTempNoti', {
            requestedName: notification.data.requestedName
          })
      }

    case "curfew_rejected":
      return {
        title: t('notifications.curfewRejectedTitle'),
        message: t('notifications.curfewRejectedNoti', {
          reason: notification.data.reason || ''
        })
      }

    default:
      return {
        title: t('notifications.unknownTitle'),
        message: t('notifications.unknownMessage')
      }
  }
};

export default GetNotificationMessage;