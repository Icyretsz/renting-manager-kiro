import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { StatisticsCardsProps } from '@/types';

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  pendingCount,
  totalCount,
  approvedTodayCount
}) => {
  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card>
          <Statistic
            title="Pending Approvals"
            value={pendingCount}
            valueStyle={{ color: '#faad14' }}
            prefix={<CloseCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Total Submissions"
            value={totalCount}
            valueStyle={{ color: '#1890ff' }}
            prefix={<EyeOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Approved Today"
            value={approvedTodayCount}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};
