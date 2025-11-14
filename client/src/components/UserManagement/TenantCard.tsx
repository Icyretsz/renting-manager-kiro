import React from 'react';
import { Card, Button, Avatar, Tag, Typography, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { TenantCardProps } from '@/types';
import dayjs from 'dayjs';

const { Text } = Typography;

export const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  onEdit,
  onDelete
}) => {
  return (
    <Card
      size="small"
      style={{ marginBottom: '12px' }}
      actions={[
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(tenant)}
          size="small"
        >
          Edit
        </Button>,
        <Popconfirm
          title="Delete tenant?"
          onConfirm={() => onDelete(tenant.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
          >
            Delete
          </Button>
        </Popconfirm>,
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <Avatar
          icon={<UserOutlined />}
          style={{ 
            backgroundColor: tenant.isActive ? '#52c41a' : '#d9d9d9',
            marginRight: '12px'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>{tenant.name}</Text>
            <div>
              <Tag color={tenant.isActive ? 'success' : 'default'}>
                {tenant.isActive ? 'Active' : 'Inactive'}
              </Tag>
              {tenant.userId && (
                <Tag color="blue">
                  <UserOutlined /> Linked
                </Tag>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: '4px' }}>
            {tenant.email && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <MailOutlined /> {tenant.email}
                </Text>
              </div>
            )}
            {tenant.phone && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <PhoneOutlined /> {tenant.phone}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>

      {(tenant.moveInDate || tenant.moveOutDate) && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: '#f0f2f5', 
          borderRadius: '4px'
        }}>
          {tenant.moveInDate && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              Move In: {dayjs(tenant.moveInDate).format('MMM DD, YYYY')}
            </div>
          )}
          {tenant.moveOutDate && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              Move Out: {dayjs(tenant.moveOutDate).format('MMM DD, YYYY')}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
