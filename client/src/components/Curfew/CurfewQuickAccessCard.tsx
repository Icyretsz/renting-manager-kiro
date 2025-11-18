import React, { useState } from 'react';
import { Card, Button, Tag, Typography, List, Avatar, Spin } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { CurfewOverrideModal } from './CurfewOverrideModal';
import { useTranslation } from 'react-i18next';
import { useRoomTenantsQuery } from '@/hooks/useCurfew';
import type { Tenant } from '@/types';

const { Text, Title } = Typography;

interface CurfewQuickAccessCardProps {
  tenant: Tenant;
}

export const CurfewQuickAccessCard: React.FC<CurfewQuickAccessCardProps> = () => {
  const [curfewModalVisible, setCurfewModalVisible] = useState(false);
  const { t } = useTranslation();
  const { data: roomTenants, isLoading } = useRoomTenantsQuery();

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED_PERMANENT':
        return t('curfew.approvedPermanent');
      case 'APPROVED_TEMPORARY':
        return t('curfew.approvedTemporary');
      case 'PENDING':
        return t('curfew.pendingApproval');
      default:
        return t('curfew.normal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED_PERMANENT':
        return 'green';
      case 'APPROVED_TEMPORARY':
        return 'cyan';
      case 'PENDING':
        return 'orange';
      default:
        return 'default';
    }
  };

  const hasPendingRequest = roomTenants?.some(t => t.curfewStatus === 'PENDING');

  return (
    <>
      <Card
        className="mb-4"
        style={{
          background: hasPendingRequest
            ? 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)'
            : 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
          borderLeft: '4px solid',
          borderLeftColor: hasPendingRequest ? '#fa8c16' : '#1890ff',
        }}
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center gap-3">
              <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Title level={5} style={{ margin: 0 }}>
                {t('curfew.status')}
              </Title>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<ClockCircleOutlined />}
              onClick={() => setCurfewModalVisible(true)}
              block
              className="sm:w-auto"
            >
              {t('curfew.requestOverride')}
            </Button>
          </div>

          {/* Tenants List */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spin />
            </div>
          ) : (
            <List
              dataSource={roomTenants || []}
              renderItem={(roomTenant) => (
                <List.Item
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Avatar
                        icon={<UserOutlined />}
                        style={{
                          backgroundColor: roomTenant.user ? '#1890ff' : '#d9d9d9',
                        }}
                      />
                      <div>
                        <Text strong>{roomTenant.name}</Text>
                        {roomTenant.user && (
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                            {t('curfew.account')}: {roomTenant.user.name}
                          </Text>
                        )}
                      </div>
                    </div>
                    <Tag color={getStatusColor(roomTenant.curfewStatus)}>
                      {getStatusText(roomTenant.curfewStatus)}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
      </Card>

      <CurfewOverrideModal
        visible={curfewModalVisible}
        onClose={() => setCurfewModalVisible(false)}
      />
    </>
  );
};
