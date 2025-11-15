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

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'NORMAL':
      return 'Normal';
    case 'PENDING':
      return 'Pending';
    case 'APPROVED_TEMPORARY':
      return 'Approved (Temporary)';
    case 'APPROVED_PERMANENT':
      return 'Approved (Permanent)';
    default:
      return status;
  }
};

export const CurfewHistoryModal: React.FC<CurfewHistoryModalProps> = ({
  visible,
  tenantId,
  tenantName,
  onClose
}) => {
  const { data: modifications, isLoading } = useCurfewModificationsQuery(tenantId);

  return (
    <Modal
      title={`Curfew History${tenantName ? ` - ${tenantName}` : ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <Spin tip="Loading history..." />
        </div>
      ) : !modifications || modifications.length === 0 ? (
        <Empty description="No modification history found" />
      ) : (
        <Timeline
          items={modifications.map((mod: any) => ({
            color: getModificationColor(mod.modificationType),
            dot: getModificationIcon(mod.modificationType),
            children: (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag color={getModificationColor(mod.modificationType)}>
                    {mod.modificationType}
                  </Tag>
                  {mod.isPermanent && (
                    <Tag color="green">PERMANENT</Tag>
                  )}
                </div>

                <div className="text-sm">
                  {mod.oldStatus && (
                    <div>
                      <Text type="secondary">Status changed: </Text>
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
                      <Text type="secondary">New status: </Text>
                      <Tag color="blue" className="text-xs">
                        {getStatusLabel(mod.newStatus)}
                      </Tag>
                    </div>
                  )}
                </div>

                {mod.reason && (
                  <div className="text-sm bg-gray-50 p-2 rounded">
                    <Text type="secondary">Reason: </Text>
                    <Text>{mod.reason}</Text>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <div>
                    By: {mod.modifier?.name} ({mod.modifier?.role})
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
