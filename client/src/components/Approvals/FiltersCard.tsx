import React from 'react';
import { Card, Row, Col, Select, Space } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

const { Option } = Select;

interface FiltersCardProps {
  filterStatus: string;
  sortBy: string;
  onFilterStatusChange: (value: string) => void;
  onSortByChange: (value: string) => void;
}

export const FiltersCard: React.FC<FiltersCardProps> = ({
  filterStatus,
  sortBy,
  onFilterStatusChange,
  onSortByChange
}) => {
  return (
    <Card size="small">
      <Row gutter={16} align="middle">
        <Col sm={12} md={8}>
          <Space className="w-full">
            <FilterOutlined />
            <Select
              value={filterStatus}
              onChange={onFilterStatusChange}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="PENDING">Pending</Option>
              <Option value="APPROVED">Approved</Option>
              <Option value="REJECTED">Rejected</Option>
            </Select>
          </Space>
        </Col>
        <Col sm={12} md={8}>
          <Select
            value={sortBy}
            onChange={onSortByChange}
            style={{ width: '100%' }}
            placeholder="Sort by..."
          >
            <Option value="date">Latest First</Option>
            <Option value="room">Room Number</Option>
            <Option value="amount">Amount</Option>
            <Option value="status">Status</Option>
          </Select>
        </Col>
      </Row>
    </Card>
  );
};
