import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { MeterReading } from '@/types';
import { useTranslation } from 'react-i18next';

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

interface PreviousReadingCardProps {
  reading: MeterReading;
}

export const PreviousReadingCard: React.FC<PreviousReadingCardProps> = ({ reading }) => {
  const { t } = useTranslation();
  
  return (
    <Card title={t('meterReadings.previousReadingTitle')} size="small">
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title={t('meterReadings.water')}
            value={toNumber(reading.waterReading)}
            precision={1}
            suffix={t('meterReadings.units')}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title={t('meterReadings.electricity')}
            value={toNumber(reading.electricityReading)}
            precision={1}
            suffix={t('meterReadings.units')}
          />
        </Col>
      </Row>
      <div className="mt-2 text-xs text-gray-500">
        {t('meterReadings.from')}: {new Date(reading.submittedAt).toLocaleDateString()}
      </div>
    </Card>
  );
};
