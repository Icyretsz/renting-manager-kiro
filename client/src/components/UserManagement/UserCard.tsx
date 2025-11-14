import React from 'react';
import { Card, Button, Avatar, Tag, Typography, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, LinkOutlined, DisconnectOutlined, UserOutlined, HomeOutlined, MailOutlined } from '@ant-design/icons';
import { UserCardProps } from '@/types';
import dayjs from 'dayjs';

const { Text } = Typography;

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onLink,
  onUnlink
}) => {
  return (
    <Card
      size="small"
      style={{ marginBottom: '12px' }}
      actions={[
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(user)}
          size="small"
        >
          Edit
        </Button>,
        user.tenant ? (
          <Button
            type="text"
            icon={<DisconnectOutlined />}
            onClick={() => onUnlink(user)}
            size="small"
            danger
          >
            Unlink
          </Button>
        ) : (
          <Button
            type="text"
            icon={<LinkOutlined />}
            onClick={() => onLink(user)}
            size="small"
          >
            Link
          </Button>
        ),
        <Popconfirm
          title="Delete user?"
          onConfirm={() => onDelete(user.id)}
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
            backgroundColor: user.role === 'ADMIN' ? '#ff4d4f' : '#1890ff',
            marginRight: '12px'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>{user.name}</Text>
            <Tag color={user.role === 'ADMIN' ? 'red' : 'blue'}>
              {user.role}
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <MailOutlined /> {user.email}
          </Text>
        </div>
      </div>

      {user.tenant && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: '#f6ffed', 
          borderRadius: '4px',
          border: '1px solid #b7eb8f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <HomeOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
            <Text style={{ fontSize: '12px', color: '#52c41a' }}>
              Linked to Room {user.tenant.roomId} ({user.tenant.name})
            </Text>
          </div>
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
        Created: {dayjs(user.createdAt).format('MMM DD, YYYY')}
      </div>
    </Card>
  );
};
