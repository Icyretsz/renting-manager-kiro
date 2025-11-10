import React from 'react';
import { Row, Col, Input, Select, Button } from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';

const { Option } = Select;

interface TenantFiltersProps {
  searchText: string;
  filterRoom?: number;
  filterStatus?: string;
  onSearchChange: (value: string) => void;
  onRoomChange: (value: number | undefined) => void;
  onStatusChange: (value: string | undefined) => void;
  onAddTenant: () => void;
}

export const TenantFilters: React.FC<TenantFiltersProps> = ({
  searchText,
  filterRoom,
  filterStatus,
  onSearchChange,
  onRoomChange,
  onStatusChange,
  onAddTenant
}) => {
  return (
    <Row gutter={[8, 8]} style={{ marginBottom: '16px' }}>
      <Col xs={24} sm={12}>
        <Input
          placeholder="Search tenants..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Col>
      <Col xs={12} sm={6}>
        <Select
          placeholder="Room"
          style={{ width: '100%' }}
          allowClear
          value={filterRoom}
          onChange={onRoomChange}
        >
          {Array.from({ length: 18 }, (_, i) => i + 1).map(roomNum => (
            <Option key={roomNum} value={roomNum}>Room {roomNum}</Option>
          ))}
        </Select>
      </Col>
      <Col xs={12} sm={6}>
        <Select
          placeholder="Status"
          style={{ width: '100%' }}
          allowClear
          value={filterStatus}
          onChange={onStatusChange}
        >
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
          <Option value="linked">Linked</Option>
          <Option value="unlinked">Not Linked</Option>
        </Select>
      </Col>
      <Col xs={24} sm={24} md={8}>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={onAddTenant}
          style={{ width: '100%' }}
        >
          Add Tenant
        </Button>
      </Col>
    </Row>
  );
};
