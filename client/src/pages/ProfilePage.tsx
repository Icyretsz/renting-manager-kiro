import React from 'react';
import { Card, Descriptions, Typography, Tag, Space, Divider } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  IdcardOutlined,
  SafetyOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const tenant = user.tenant;

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        <Title level={3}>Profile</Title>

        {/* Account Information */}
        <Card title={<Space><UserOutlined /> Account Information</Space>}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Name">
              <Text strong>{user.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <Space>
                <MailOutlined />
                {user.email}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              <Tag color={user.role === 'ADMIN' ? 'blue' : 'green'}>
                {user.role}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="User ID">
              <Text type="secondary" copyable>
                {user.id}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Account Created">
              <Space>
                <CalendarOutlined />
                {dayjs(user.createdAt).format('MMMM D, YYYY')}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Tenant Information - Only show for USER role */}
        {user.role === 'USER' && tenant && (
          <Card title={<Space><HomeOutlined /> Tenant Information</Space>}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Tenant Name">
                <Text strong>{tenant.name}</Text>
              </Descriptions.Item>
              {tenant.email && (
                <Descriptions.Item label="Contact Email">
                  <Space>
                    <MailOutlined />
                    {tenant.email}
                  </Space>
                </Descriptions.Item>
              )}
              {tenant.phone && (
                <Descriptions.Item label="Phone">
                  <Space>
                    <PhoneOutlined />
                    {tenant.phone}
                  </Space>
                </Descriptions.Item>
              )}
              {tenant.fingerprintId && (
                <Descriptions.Item label="Fingerprint ID">
                  <Space>
                    <SafetyOutlined />
                    <Text copyable>{tenant.fingerprintId}</Text>
                  </Space>
                </Descriptions.Item>
              )}
              {tenant.permanentAddress && (
                <Descriptions.Item label="Permanent Address">
                  <Space>
                    <EnvironmentOutlined />
                    {tenant.permanentAddress}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Room Number">
                <Space>
                  <HomeOutlined />
                  <Text strong>Room {tenant.room?.roomNumber}</Text>
                  {tenant.room && (
                    <Tag color="blue">Floor {tenant.room.floor}</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              {tenant.moveInDate && (
                <Descriptions.Item label="Move-in Date">
                  <Space>
                    <CalendarOutlined />
                    {dayjs(tenant.moveInDate).format('MMMM D, YYYY')}
                  </Space>
                </Descriptions.Item>
              )}
              {tenant.moveOutDate && (
                <Descriptions.Item label="Move-out Date">
                  <Space>
                    <CalendarOutlined />
                    {dayjs(tenant.moveOutDate).format('MMMM D, YYYY')}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Status">
                <Tag color={tenant.isActive ? 'success' : 'default'}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tenant ID">
                <Space>
                  <IdcardOutlined />
                  <Text type="secondary" copyable>
                    {tenant.id}
                  </Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* No Tenant Link Warning for USER role */}
        {user.role === 'USER' && !tenant && (
          <Card>
            <Space direction="vertical" className="w-full">
              <Text type="warning" strong>
                No Tenant Information
              </Text>
              <Text type="secondary">
                Your account is not linked to a tenant record. Please contact the administrator to link your account.
              </Text>
            </Space>
          </Card>
        )}
      </div>
    </PageErrorBoundary>
  );
};
