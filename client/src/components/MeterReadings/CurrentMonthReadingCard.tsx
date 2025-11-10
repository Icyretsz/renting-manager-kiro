import React from 'react';
import { Card, Row, Col, Statistic, Alert, Tag } from 'antd';
import { MeterReading } from '@/types';

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

interface CurrentMonthReadingCardProps {
  reading: MeterReading;
  currentMonth: number;
  currentYear: number;
  submissionCount: number;
  isAdmin: boolean;
  canAdminOverride: boolean;
  canCreateNewReading: boolean;
}

export const CurrentMonthReadingCard: React.FC<CurrentMonthReadingCardProps> = ({
  reading,
  currentMonth,
  currentYear,
  submissionCount,
  isAdmin,
  canAdminOverride,
  canCreateNewReading
}) => {
  const getStatusColor = () => {
    switch (reading.status) {
      case 'APPROVED': return 'border-green-200 bg-green-50';
      case 'REJECTED': return 'border-red-200 bg-red-50';
      default: return 'border-orange-200 bg-orange-50';
    }
  };

  return (
    <Card
      title={`Current Month Reading (${currentMonth}/${currentYear})`}
      size="small"
      className={getStatusColor()}
      extra={
        submissionCount > 1 && (
          <span className="text-xs text-gray-500">
            {submissionCount} submissions
          </span>
        )
      }
    >
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="Water"
            value={toNumber(reading.waterReading)}
            precision={1}
            suffix="units"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Electricity"
            value={toNumber(reading.electricityReading)}
            precision={1}
            suffix="units"
          />
        </Col>
        <Col span={8}>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <Tag color={
              reading.status === 'APPROVED' ? 'green' :
              reading.status === 'REJECTED' ? 'red' : 'orange'
            }>
              {reading.status.toUpperCase()}
            </Tag>
          </div>
        </Col>
      </Row>

      {reading.status === 'APPROVED' && !isAdmin && (
        <Alert
          message="Reading Approved"
          description="This reading has been approved and cannot be modified. Contact admin if changes are needed."
          type="success"
          showIcon
          className="mt-3"
        />
      )}

      {reading.status === 'REJECTED' && (
        <Alert
          message="Reading Rejected"
          description={`This reading was rejected. ${canCreateNewReading ? 'You can submit a new reading below.' : 'Please wait for admin review of other submissions.'}`}
          type="error"
          showIcon
          className="mt-3"
        />
      )}

      {reading.status === 'PENDING' && (
        <Alert
          message="Pending Approval"
          description="This reading is waiting for admin approval. You can still modify it until it's approved."
          type="warning"
          showIcon
          className="mt-3"
        />
      )}

      {canAdminOverride && (
        <Alert
          message="Admin Override Available"
          description="As an admin, you can modify this approved reading. Changes will be logged in the modification history."
          type="info"
          showIcon
          className="mt-3"
        />
      )}
    </Card>
  );
};
