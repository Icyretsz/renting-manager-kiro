import React, { useState } from 'react';
import { Card, Button, Tag, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { CurfewOverrideModal } from './CurfewOverrideModal';
import { useTranslation } from 'react-i18next';
import type { Tenant } from '@/types';

const { Text } = Typography;

interface CurfewQuickAccessCardProps {
  tenant: Tenant;
}

export const CurfewQuickAccessCard: React.FC<CurfewQuickAccessCardProps> = ({ tenant }) => {
  const [curfewModalVisible, setCurfewModalVisible] = useState(false);
  const { t } = useTranslation();

  const getStatusText = () => {
    switch (tenant.curfewStatus) {
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

  return (
    <>
      <Card
        className="mb-4"
        style={{
          background:
            tenant.curfewStatus === 'PENDING'
              ? 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)'
              : 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
          borderLeft: '4px solid',
          borderLeftColor: tenant.curfewStatus === 'PENDING' ? '#fa8c16' : '#1890ff',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <div>
              <Text strong style={{ fontSize: '16px', display: 'block' }}>
                {t('curfew.status')}
              </Text>
              <Tag
                color={
                  tenant.curfewStatus === 'APPROVED_PERMANENT'
                    ? 'green'
                    : tenant.curfewStatus === 'APPROVED_TEMPORARY'
                      ? 'cyan'
                      : tenant.curfewStatus === 'PENDING'
                        ? 'orange'
                        : 'default'
                }
                style={{ marginTop: '4px' }}
              >
                {getStatusText()}
              </Tag>
            </div>
          </div>
          {tenant.curfewStatus !== 'PENDING' && (
            <Button
              type="primary"
              size="large"
              icon={<ClockCircleOutlined />}
              onClick={() => setCurfewModalVisible(true)}
            >
              {t('curfew.requestOverride')}
            </Button>
          )}
          {tenant.curfewStatus === 'PENDING' && (
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {t('curfew.requestBeingReviewed')}
            </Text>
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
