import React from 'react';
import { Card, Row, Col, Statistic, Alert, Tag } from 'antd';
import { CurrentMonthReadingCardProps } from '@/types';
import { useTranslation } from 'react-i18next';
import { useTranslationHelpers } from '@/hooks/useTranslationHelpers';

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const CurrentMonthReadingCard: React.FC<CurrentMonthReadingCardProps> = ({
  reading,
  currentMonth,
  currentYear,
  submissionCount,
  isAdmin,
  canAdminOverride,
  canCreateNewReading
}) => {
  const { t } = useTranslation();
  const { getStatus } = useTranslationHelpers()
  
  const getStatusColor = () => {
    switch (reading.status) {
      case 'APPROVED': return 'border-green-200 bg-green-50';
      case 'REJECTED': return 'border-red-200 bg-red-50';
      default: return 'border-orange-200 bg-orange-50';
    }
  };

  return (
    <Card
      title={t('meterReadings.currentMonthReadingTitle', { month: currentMonth, year: currentYear })}
      size="small"
      className={getStatusColor()}
      extra={
        submissionCount > 1 && (
          <span className="text-xs text-gray-500">
            {submissionCount} {t('meterReadings.submissions')}
          </span>
        )
      }
    >
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title={t('meterReadings.water')}
            value={toNumber(reading.waterReading)}
            precision={1}
            suffix='m³'
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={t('meterReadings.electricity')}
            value={toNumber(reading.electricityReading)}
            precision={1}
            suffix='kWh'
          />
        </Col>
        <Col span={8}>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">{t('meterReadings.status')}</div>
            <Tag color={
              reading.status === 'APPROVED' ? 'green' :
              reading.status === 'REJECTED' ? 'red' : 'orange'
            }>
              {getStatus(reading.status.toUpperCase())}
            </Tag>
          </div>
        </Col>
      </Row>

      {reading.status === 'APPROVED' && !isAdmin && (
        <Alert
          message={t('meterReadings.readingApproved')}
          description={t('meterReadings.readingApprovedDesc')}
          type="success"
          showIcon
          className="mt-3"
        />
      )}

      {reading.status === 'REJECTED' && (
        <Alert
          message={t('meterReadings.readingRejected')}
          description={canCreateNewReading ? t('meterReadings.readingRejectedCanSubmit') : t('meterReadings.readingRejectedWaitReview')}
          type="error"
          showIcon
          className="mt-3"
        />
      )}

      {reading.status === 'PENDING' && (
        <Alert
          message={t('meterReadings.pendingApproval')}
          description={t('meterReadings.pendingApprovalDesc')}
          type="warning"
          showIcon
          className="mt-3"
        />
      )}

      {canAdminOverride && (
        <Alert
          message={t('meterReadings.adminOverrideAvailable')}
          description={t('meterReadings.adminOverrideDesc')}
          type="info"
          showIcon
          className="mt-3"
        />
      )}
    </Card>
  );
};
