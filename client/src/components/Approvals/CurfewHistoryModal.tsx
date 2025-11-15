import React from 'react';
import { Modal, Timeline, Tag, Typography, Empty, Spin } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCurfewModificationsQuery } from '@/hooks/useCurfew';
import dayjs from 'dayjs';

const { Text } = Typography;

interface CurfewHistoryModalProps {
  visible: boolean;
  tenantId: string | null;
  tenantName?: string;
  onClose: () => void;
}

const getModificationIcon = (type: string) => {
  switch (type) {
    case 'REQUEST':
      return <ClockCircleOutlined />;
    case 'APPROVE':
      return <CheckCircleOutlined />;
    case 'REJECT':
      return <CloseCircleOutlined />;
    case 'RESET':
      return <ReloadOutlined />;
    case 'MANUAL_CHANGE':
      return <EditOutlined />;
    default:
      return <UserOutlined />;
  }
};

const getModificationColor = (type: string) => {
  switch (type) {
    case 'REQUEST':
      return 'orange';
    case 'APPROVE':
      return 'green';
    case 'REJECT':
      return 'red';
    case 'RESET':
      return 'blue';
    case 'MANUAL_CHANGE':
      return 'purple';
    default:
      return 'default';
  }
};

export const CurfewHistoryModal: React.FC<CurfewHistoryModalProps> = ({
  visible,
  tenantId,
  tenantName,
  onClose
}) => {
  const { t } = useTranslation();
  const { data: modifications, isLoading } = useCurfewModificationsQuery(tenantId);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return t('curfew.normal');
      case 'PENDING':
        return t('curfew.pendingApproval');
      case 'APPROVED_TEMPORARY':
        return t('curfew.approvedTemporary');
      case 'APPROVED_PERMANENT':
        return t('curfew.approvedPermanent');
      default:
        return status;
    }
  };

  const getModificationTypeLabel = (type: string) => {
    switch (type) {
      case 'REQUEST':
        return t('curfew.request');
      case 'APPROVE':
        return t('curfew.approve');
      case 'REJECT':
        return t('curfew.reject');
      case 'RESET':
        return t('curfew.reset');
      case 'MANUAL_CHANGE':
        return t('curfew.manualChange');
      default:
        return type;
    }
  };

  return (
    <Modal
      title={`${t('curfew.curfewHistory')}${tenantName ? ` - ${tenantName}` : ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <Spin tip={t('curfew.loadingHistory')} />
        </div>
      ) : !modifications || modifications.length === 0 ? (
        <Empty description={t('curfew.noModificationHistory')} />
      ) : (
        <Timeline
          items={modifications.map((mod: any) => ({
            color: getModificationColor(mod.modificationType),
            dot: getModificationIcon(mod.modificationType),
            children: (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag color={getModificationColor(mod.modificationType)}>
                    {getModificationTypeLabel(mod.modificationType)}
                  </Tag>
                  {mod.isPermanent && (
                    <Tag color="green">{t('curfew.permanent').toUpperCase()}</Tag>
                  )}
                </div>

                <div className="text-sm">
                  {mod.oldStatus && (
                    <div>
                      <Text type="secondary">{t('curfew.statusChanged')}: </Text>
                      <Tag color="default" className="text-xs">
                        {getStatusLabel(mod.oldStatus)}
                      </Tag>
                      <Text type="secondary"> → </Text>
                      <Tag color="blue" className="text-xs">
                        {getStatusLabel(mod.newStatus)}
                      </Tag>
                    </div>
                  )}
                  {!mod.oldStatus && (
                    <div>
                      <Text type="secondary">{t('curfew.newStatus')}: </Text>
                      <Tag color="blue" className="text-xs">
                        {getStatusLabel(mod.newStatus)}
                      </Tag>
                    </div>
                  )}
                </div>

                {mod.reason && (
                  <div className="text-sm bg-gray-50 p-2 rounded">
                    <Text type="secondary">{t('curfew.reason')}: </Text>
                    <Text>{mod.reason}</Text>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <div>
                    {t('curfew.by')}: {mod.modifier?.name} ({mod.modifier?.role})
                  </div>
                  <div>
                    {dayjs(mod.modifiedAt).format('MMM DD, YYYY HH:mm:ss')}
                  </div>
                </div>
              </div>
            ),
          }))}
        />
      )}
    </Modal>
  );
};
