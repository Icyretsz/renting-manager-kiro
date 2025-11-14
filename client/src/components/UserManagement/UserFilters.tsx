import React from 'react';
import { Row, Col, Input, Button } from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import { UserFiltersProps } from '@/types';

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchText,
  onSearchChange,
  onAddUser
}) => {
  return (
    <Row gutter={[8, 8]} style={{ marginBottom: '16px' }}>
      <Col xs={24} sm={16}>
        <Input
          placeholder="Search users by name or email..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Col>
      <Col xs={24} sm={8}>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={onAddUser}
          style={{ width: '100%' }}
        >
          Add User
        </Button>
      </Col>
    </Row>
  );
};
