import { useTranslation } from 'react-i18next';

export const useTranslationHelpers = () => {
  const { t } = useTranslation();

  const getMonthName = (month: number): string => {
    const months = [
      'months.january',
      'months.february',
      'months.march',
      'months.april',
      'months.may',
      'months.june',
      'months.july',
      'months.august',
      'months.september',
      'months.october',
      'months.november',
      'months.december'
    ];
    return t(months[month - 1]);
  };

  const formatCurrency = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const getStatus = (status: string): string => {
    switch(status) {
      case 'APPROVED':
        return t('meterReadings.approved')
      case 'PENDING':
        return t('meterReadings.pending')
      case 'REJECTED':
        return t('meterReadings.rejected')
      default:
        return 'unknown'
    }
  }

  const getModificationHistoryAction = (action: string): string => {
    switch(action) {
      case 'CREATE':
        return t('meterReadings.create')
      case 'UPDATE':
        return t('meterReadings.updated')
      case 'APPROVE':
        return t('meterReadings.approved')
      case 'REJECT':
        return t('meterReadings.rejected')
      default:
        return 'unknown'
    }
  }

  const getModificationHistoryFieldName = (fieldName: string): string => {
    switch(fieldName) {
      case 'reading':
        return t('meterReadings.reading')
      case 'status':
        return t('meterReadings.status')
      case 'waterReading':
        return t('meterReadings.waterReading')
      case 'electricityReading':
        return t('meterReadings.electricityReading')
      default:
        return 'unknown'
    }
  }

  const getRole = (role: string) => {
    switch(role) {
      case 'USER':
        return t('userManagement.user')
      case 'ADMIN':
        return t('userManagement.admin')
      default:
        return 'unknown'
    }
  }

  return {
    t,
    getMonthName,
    formatCurrency,
    getStatus,
    getModificationHistoryAction,
    getModificationHistoryFieldName,
    getRole
  };
};
