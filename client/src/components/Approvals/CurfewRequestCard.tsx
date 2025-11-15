import React from 'react';
import { Card, Tag, Button, Space, Popconfirm, Typography, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, UserOutlined, HistoryOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Text } = Typography;

interface CurfewRequest {
  id: string;
  name: string;
  curfewStatus: string;
  curfewRequestedAt: Date;
  room: {
    roomNumber: number;
    floor: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  curfewModifications: Array<{
    id: string;
    reason: string | null;
    modifiedAt: Date;
    modifier: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

interface CurfewRequestCardProps {
  request: CurfewRequest;
  onApprove: (tenantId: string, isPermanent: boolean) => void;
  onReject: (tenantId: string) => void;
  onViewHistory: (tenantId: string) => void;
  approveLoading: boolean;
  rejectLoading: boolean;
}

export const CurfewRequestCard: React.FC<CurfewRequestCardProps> = ({
  request,
  onApprove,
  onReject,
  onViewHistory,
  approveLoading,
  rejectLoading
}) => {
  const { t } = useTranslation();
  const latestRequest = request.curfewModifications[0];

  return (
    <Card className="hover:shadow-md transition-shadow ml-2" size="small">
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-base flex items-center gap-2">
              <UserOutlined />
              {request.name}
            </div>
            <div className="text-sm text-gray-500">
              {t('rooms.room')} {request.room.roomNumber} - {t('rooms.floor')} {request.room.floor}
            </div>
            <div className="text-xs text-gray-400">
              {t('curfew.requested')}: {dayjs(request.curfewRequestedAt).format('MMM DD, YYYY HH:mm')}
            </div>
            {latestRequest?.modifier && (
              <div className="text-xs text-gray-400">
                {t('curfew.by')}: {latestRequest.modifier.name}
              </div>
            )}
          </div>
          <Tag color="orange" icon={<ClockCircleOutlined />}>
            {t('curfew.pending')}
          </Tag>
        </div>

        {/* Reason */}
        {latestRequest?.reason && (
          <div className="p-2 bg-gray-50 rounded">
            <Text className="text-sm">
              <strong>{t('curfew.reason')}:</strong> {latestRequest.reason}
            </Text>
          </div>
        )}

        {/* User Account Info */}
        {request.user && (
          <div className="text-xs text-gray-500">
            {t('curfew.account')}: {request.user.email}
          </div>
        )}

        {/* Actions Row */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <Button
            type="link"
            icon={<HistoryOutlined />}
            size="small"
            onClick={() => onViewHistory(request.id)}
          >
            {t('curfew.history')}
          </Button>

          <Space>
            <Popconfirm
              title={t('curfew.rejectRequest')}
              description={t('curfew.tenantWillBeNotified')}
              onConfirm={() => onReject(request.id)}
              okText={t('notifications.yes')}
              cancelText={t('notifications.no')}
            >
              <Button
                danger
                icon={<CloseCircleOutlined />}
                size="small"
                loading={rejectLoading}
              >
                {t('curfew.reject')}
              </Button>
            </Popconfirm>

            <Popconfirm
              title={t('curfew.approveCurfewOverride')}
              description={
                <div className="space-y-2">
                  <div>{t('curfew.chooseApprovalType')}</div>
                  <Space direction="vertical">
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => onApprove(request.id, false)}
                      loading={approveLoading}
                      className="w-full"
                    >
                      {t('curfew.temporaryUntil6AM')}
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => onApprove(request.id, true)}
                      loading={approveLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {t('curfew.permanent')}
                    </Button>
                  </Space>
                </div>
              }
              okButtonProps={{ style: { display: 'none' } }}
              cancelText={t('curfew.cancel')}
            >
              <Tooltip title={t('curfew.clickToChooseType')}>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  className="bg-green-500 hover:bg-green-600 border-green-500"
                >
                  {t('curfew.approve')}
                </Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>
      </div>
    </Card>
  );
};
