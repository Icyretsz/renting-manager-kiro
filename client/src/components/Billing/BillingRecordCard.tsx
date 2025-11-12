import React from 'react';
import { Card, Button, Tag, Avatar, Row, Col, Typography } from 'antd';
import { EyeOutlined, QrcodeOutlined, HomeOutlined, CalendarOutlined, DropboxOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { BillingRecord } from '@/types';
import dayjs from 'dayjs';
import { useTranslationHelpers } from '@/hooks/useTranslationHelpers';

const { Text } = Typography;

interface BillingRecordCardProps {
  record: BillingRecord;
  isAdmin: boolean;
  onViewDetails: (record: BillingRecord) => void;
  onGenerateQRCode: (record: BillingRecord) => void;
  getPaymentStatusColor: (status: string) => "success" | "error" | "warning" | "default";
  formatCurrency: (amount: string | number) => string;
  getMonthName: (month: number) => string;
}

export const BillingRecordCard: React.FC<BillingRecordCardProps> = ({
  record,
  isAdmin,
  onViewDetails,
  onGenerateQRCode,
  getPaymentStatusColor,
  formatCurrency,
  getMonthName
}) => {
  const { t, getPaymentStatus } = useTranslationHelpers();
  
  return (
    <Card
      style={{ marginBottom: '16px' }}
      hoverable
      actions={[
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => onViewDetails(record)}
          size="small"
        >
          {t('billing.details')}
        </Button>,
        record.paymentStatus === 'UNPAID' ? (
          <Button
            type="text"
            icon={<QrcodeOutlined />}
            onClick={() => onGenerateQRCode(record)}
            size="small"
            style={{ color: '#1890ff' }}
          >
            {t('billing.payNow')}
          </Button>
        ) : (
          <Button type="text" disabled size="small">
            {t('billing.paidStatus')}
          </Button>
        ),
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            icon={<HomeOutlined />}
            style={{ backgroundColor: '#1890ff', marginRight: '12px' }}
          />
          <div>
            <Text strong style={{ fontSize: '16px' }}>
              {t('rooms.room')} {record.room?.roomNumber}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('rooms.floor')} {record.room?.floor}
            </Text>
          </div>
        </div>
        <Tag color={getPaymentStatusColor(record.paymentStatus)} style={{ margin: 0 }}>
          {getPaymentStatus(record.paymentStatus)}
        </Tag>
      </div>

      <Row gutter={16} style={{ marginBottom: '12px' }}>
        <Col span={12}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <CalendarOutlined style={{ marginRight: '8px', color: '#666' }} />
            <Text style={{ fontSize: '14px' }}>
              {record.month}/{record.year}
            </Text>
          </div>
        </Col>
        <Col span={12}>
          <div style={{ textAlign: 'right' }}>
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              {formatCurrency(record.totalAmount)}
            </Text>
          </div>
        </Col>
      </Row>

      <Row gutter={8} style={{ marginBottom: '12px' }}>
        <Col span={12}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
            <DropboxOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
            <Text style={{ fontSize: '12px' }}>
              {parseFloat(record.waterUsage.toString()).toFixed(1)} m³
            </Text>
          </div>
        </Col>
        <Col span={12}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
            <ThunderboltOutlined style={{ marginRight: '6px', color: '#faad14' }} />
            <Text style={{ fontSize: '12px' }}>
              {parseFloat(record.electricityUsage.toString()).toFixed(1)} kWh
            </Text>
          </div>
        </Col>
      </Row>

      {record.paymentDate && (
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {t('billing.paidOn', { date: dayjs(record.paymentDate).format('MMM DD, YYYY') })}
          </Text>
        </div>
      )}

      {isAdmin && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {t('billing.createdOn')}: {dayjs(record.createdAt).format('DD/MM/YYYY')}
          </Text>
        </div>
      )}
    </Card>
  );
};
