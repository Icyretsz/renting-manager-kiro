import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface FinancialSummary {
  totalIncome: number;
  totalPaid: number;
  totalUnpaid: number;
  occupiedRooms: number;
  roomCount: number;
}

interface FinancialSummaryCardProps {
  summary: FinancialSummary;
  formatCurrency: (amount: string | number) => string;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  summary,
  formatCurrency
}) => {
  return (
    <Card style={{ marginBottom: '24px' }}>
      <Title level={4}>Financial Overview</Title>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="Total Income"
            value={summary.totalIncome}
            formatter={(value) => formatCurrency(value as number)}
            prefix={<DollarOutlined />}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="Total Paid"
            value={summary.totalPaid}
            formatter={(value) => formatCurrency(value as number)}
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="Total Unpaid"
            value={summary.totalUnpaid}
            formatter={(value) => formatCurrency(value as number)}
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="Occupied Rooms"
            value={summary.occupiedRooms}
            suffix={`/ ${summary.roomCount}`}
          />
        </Col>
      </Row>
    </Card>
  );
};
