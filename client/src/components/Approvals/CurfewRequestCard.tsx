import React from 'react';
import { Card, Tag, Button, Space, Popconfirm, Typography, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, UserOutlined, HistoryOutlined } from '@ant-design/icons';
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
              Room {request.room.roomNumber} - Floor {request.room.floor}
            </div>
            <div className="text-xs text-gray-400">
              Requested: {dayjs(request.curfewRequestedAt).format('MMM DD, YYYY HH:mm')}
            </div>
            {latestRequest?.modifier && (
              <div className="text-xs text-gray-400">
                By: {latestRequest.modifier.name}
              </div>
            )}
          </div>
          <Tag color="orange" icon={<ClockCircleOutlined />}>
            PENDING
          </Tag>
        </div>

        {/* Reason */}
        {latestRequest?.reason && (
          <div className="p-2 bg-gray-50 rounded">
            <Text className="text-sm">
              <strong>Reason:</strong> {latestRequest.reason}
            </Text>
          </div>
        )}

        {/* User Account Info */}
        {request.user && (
          <div className="text-xs text-gray-500">
            Account: {request.user.email}
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
            History
          </Button>

          <Space>
            <Popconfirm
              title="Reject this request?"
              description="The tenant will be notified."
              onConfirm={() => onReject(request.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger
                icon={<CloseCircleOutlined />}
                size="small"
                loading={rejectLoading}
              >
                Reject
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Approve curfew override?"
              description={
                <div className="space-y-2">
                  <div>Choose approval type:</div>
                  <Space direction="vertical">
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => onApprove(request.id, false)}
                      loading={approveLoading}
                      className="w-full"
                    >
                      Temporary (Until 6 AM)
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => onApprove(request.id, true)}
                      loading={approveLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Permanent
                    </Button>
                  </Space>
                </div>
              }
              okButtonProps={{ style: { display: 'none' } }}
              cancelText="Cancel"
            >
              <Tooltip title="Click to choose approval type">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  className="bg-green-500 hover:bg-green-600 border-green-500"
                >
                  Approve
                </Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>
      </div>
    </Card>
  );
};
