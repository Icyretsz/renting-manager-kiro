import React from 'react';
import { Modal, Typography, Row, Divider, Button } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { BillingRecord } from '@/types';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface PaymentSuccessModalProps {
  open: boolean;
  billingRecord: BillingRecord | null;
  onClose: () => void;
  formatCurrency: (amount: string | number) => string;
  getMonthName: (month: number) => string;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  open,
  billingRecord,
  onClose,
  formatCurrency,
  getMonthName,
}) => {
  const { t } = useTranslation();
  
  if (!billingRecord) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          {t('common.close')}
        </Button>,
      ]}
      width={500}
      centered
    >
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: '80px', color: '#52c41a', marginBottom: '24px' }}>
          <CheckCircleOutlined />
        </div>
        
        <Title level={2} style={{ color: '#52c41a', marginBottom: '8px' }}>
          {t('billing.paymentSuccess')}
        </Title>
        
        <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '32px' }}>
          {t('billing.paymentSuccessMessage')}
        </Text>

        <Divider />

        <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <Row justify="space-between" style={{ marginBottom: '16px' }}>
            <Text strong style={{ fontSize: '15px' }}>{t('rooms.roomNumber')}:</Text>
            <Text style={{ fontSize: '15px' }}>{billingRecord.room?.roomNumber}</Text>
          </Row>
          
          <Row justify="space-between" style={{ marginBottom: '16px' }}>
            <Text strong style={{ fontSize: '15px' }}>{t('billing.period')}:</Text>
            <Text style={{ fontSize: '15px' }}>
              {getMonthName(billingRecord.month)} {billingRecord.year}
            </Text>
          </Row>
          
          <Row justify="space-between" style={{ marginBottom: '16px' }}>
            <Text strong style={{ fontSize: '15px' }}>{t('billing.paymentDate')}:</Text>
            <Text style={{ fontSize: '15px' }}>
              {dayjs().format('MMMM DD, YYYY')}
            </Text>
          </Row>

          <Divider style={{ margin: '16px 0' }} />
          
          <Row justify="space-between" style={{ marginBottom: '8px' }}>
            <Text strong style={{ fontSize: '16px' }}>{t('billing.totalAmount')}:</Text>
            <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
              {formatCurrency(billingRecord.totalAmount)}
            </Text>
          </Row>
        </div>

        <Divider />

        <Text type="secondary" style={{ fontSize: '13px' }}>
          {t('billing.paymentConfirmation')}
        </Text>
      </div>
    </Modal>
  );
};
