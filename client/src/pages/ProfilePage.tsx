import React, { useState } from 'react';
import { Card, Descriptions, Typography, Tag, Space, Button } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  IdcardOutlined,
  SafetyOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { CurfewOverrideModal } from '@/components/Curfew';
import dayjs from 'dayjs';
import { useTranslationHelpers } from '@/hooks/useTranslationHelpers';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t, getRole } = useTranslationHelpers();
  const [curfewModalVisible, setCurfewModalVisible] = useState(false);

  if (!user) {
    return null;
  }

  const tenant = user.tenant;

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        <Title level={3}>{t('profile.title')}</Title>

        {/* Account Information */}
        <Card title={<Space><UserOutlined /> {t('profile.accountInformation')}</Space>}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t('profile.name')}>
              <Text strong>{user.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('profile.email')}>
              <Space>
                <MailOutlined />
                {user.email}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('profile.role')}>
              <Tag color={user.role === 'ADMIN' ? 'blue' : 'green'}>
                {getRole(user.role)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('profile.userId')}>
              <Text type="secondary" copyable>
                {user.id}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('profile.accountCreated')}>
              <Space>
                <CalendarOutlined />
                {dayjs(user.createdAt).format('MMMM D, YYYY')}
              </Space>
            </Descriptions.Item>
            {user.readingsSubmitDate && (
              <Descriptions.Item label="Reading Submit Start">
                <Space>
                  <CalendarOutlined />
                  <Text>Day {user.readingsSubmitDate} of each month</Text>
                </Space>
              </Descriptions.Item>
            )}
            {user.readingsSubmitDueDate && (
              <Descriptions.Item label="Reading Submit Deadline">
                <Space>
                  <CalendarOutlined />
                  <Text>Day {user.readingsSubmitDueDate} of each month</Text>
                  <Tag color="orange">Due Date</Tag>
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Tenant Information - Only show for USER role */}
        {user.role === 'USER' && tenant && (
          <Card title={<Space><HomeOutlined /> {t('profile.tenantInformation')}</Space>}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t('profile.tenantName')}>
                <Text strong>{tenant.name}</Text>
              </Descriptions.Item>
              {tenant.email && (
                <Descriptions.Item label={t('profile.contactEmail')}>
                  <Space>
                    <MailOutlined />
                    {tenant.email}
                  </Space>
                </Descriptions.Item>
              )}
              {tenant.phone && (
                <Descriptions.Item label={t('profile.phone')}>
                  <Space>
                    <PhoneOutlined />
                    {tenant.phone}
                  </Space>
                </Descriptions.Item>
              )}
              {tenant.fingerprintId && (
                <Descriptions.Item label={t('profile.fingerprintId')}>
                  <Space>
                    <SafetyOutlined />
                    <Text copyable>{tenant.fingerprintId}</Text>
                  </Space>
                </Descriptions.Item>
              )}
              {tenant.permanentAddress && (
                <Descriptions.Item label={t('profile.permanentAddress')}>
                  <Space>
                    <EnvironmentOutlined />
                    {tenant.permanentAddress}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('profile.roomNumber')}>
                <Space>
                  <HomeOutlined />
                  <Text strong>{t('rooms.room')} {tenant.room?.roomNumber}</Text>
                  {tenant.room && (
                    <Tag color="blue">{t('rooms.floor')} {tenant.room.floor}</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              {tenant.moveInDate && (
                <Descriptions.Item label={t('profile.moveInDate')}>
                  <Space>
                    <CalendarOutlined />
                    {dayjs(tenant.moveInDate).format('MMMM D, YYYY')}
                  </Space>
                </Descriptions.Item>
              )}
              {tenant.moveOutDate && (
                <Descriptions.Item label={t('profile.moveOutDate')}>
                  <Space>
                    <CalendarOutlined />
                    {dayjs(tenant.moveOutDate).format('MMMM D, YYYY')}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('profile.status')}>
                <Tag color={tenant.isActive ? 'success' : 'default'}>
                  {tenant.isActive ? t('common.active') : t('common.inactive')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Curfew Override">
                <Space>
                  <Tag color={
                    tenant.curfewStatus === 'APPROVED_PERMANENT' ? 'green' :
                    tenant.curfewStatus === 'APPROVED_TEMPORARY' ? 'cyan' :
                    tenant.curfewStatus === 'PENDING' ? 'orange' :
                    'default'
                  }>
                    {tenant.curfewStatus === 'APPROVED_PERMANENT' ? 'Approved (Permanent)' :
                     tenant.curfewStatus === 'APPROVED_TEMPORARY' ? 'Approved (Until 6 AM)' :
                     tenant.curfewStatus === 'PENDING' ? 'Pending Approval' :
                     'Normal'}
                  </Tag>
                  {tenant.curfewStatus !== 'PENDING' && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<ClockCircleOutlined />}
                      onClick={() => setCurfewModalVisible(true)}
                    >
                      Request Override
                    </Button>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('profile.tenantId')}>
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
                {t('profile.noTenantInformation')}
              </Text>
              <Text type="secondary">
                {t('profile.noTenantInformationDesc')}
              </Text>
            </Space>
          </Card>
        )}

        {/* Curfew Override Modal */}
        {tenant && (
          <CurfewOverrideModal
            visible={curfewModalVisible}
            onClose={() => setCurfewModalVisible(false)}
          />
        )}
      </div>
    </PageErrorBoundary>
  );
};
