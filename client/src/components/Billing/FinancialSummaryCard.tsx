import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

interface FinancialSummary {
  totalIncome: number;
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  occupiedRooms: number;
  roomCount: number;
  averageRoomIncome: number;
}

interface FinancialSummaryCardProps {
  summary: FinancialSummary;
  formatCurrency: (amount: string | number) => string;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  summary,
  formatCurrency
}) => {
  const { t } = useTranslation();
  const hasData = summary.totalIncome > 0 || summary.totalPaid > 0 || summary.totalUnpaid > 0 || summary.totalOverdue > 0;

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Title level={4}>{t('billing.financialOverview')}</Title>
      {!hasData && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8c8c' }}>
          {t('billing.noBillingDataYet')}
        </div>
      )}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6} lg={4}>
          <Statistic
            title={t('billing.totalIncome')}
            value={summary.totalIncome}
            formatter={(value) => formatCurrency(value as number)}
            prefix={<DollarOutlined />}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={4}>
          <Statistic
            title={t('billing.totalPaidAmount')}
            value={summary.totalPaid}
            formatter={(value) => formatCurrency(value as number)}
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={4}>
          <Statistic
            title={t('billing.totalUnpaidAmount')}
            value={summary.totalUnpaid}
            formatter={(value) => formatCurrency(value as number)}
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={4}>
          <Statistic
            title={t('billing.totalOverdueAmount')}
            value={summary.totalOverdue}
            formatter={(value) => formatCurrency(value as number)}
            valueStyle={{ color: '#d46b08' }}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={4}>
          <Statistic
            title={t('billing.occupiedRooms')}
            value={summary.occupiedRooms}
            suffix={`/ ${summary.roomCount}`}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={4}>
          <Statistic
            title={t('billing.avgRoomIncome')}
            value={summary.averageRoomIncome}
            formatter={(value) => formatCurrency(value as number)}
          />
        </Col>
      </Row>
    </Card>
  );
};
