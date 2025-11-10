import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { MeterReading } from '@/types';

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

interface PreviousReadingCardProps {
  reading: MeterReading;
}

export const PreviousReadingCard: React.FC<PreviousReadingCardProps> = ({ reading }) => {
  return (
    <Card title="Previous Reading" size="small">
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="Water"
            value={toNumber(reading.waterReading)}
            precision={1}
            suffix="units"
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Electricity"
            value={toNumber(reading.electricityReading)}
            precision={1}
            suffix="units"
          />
        </Col>
      </Row>
      <div className="mt-2 text-xs text-gray-500">
        From: {new Date(reading.submittedAt).toLocaleDateString()}
      </div>
    </Card>
  );
};
