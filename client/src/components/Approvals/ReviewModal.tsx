import React from 'react';
import { Modal, Button, Row, Col, Card, Image, Divider, Typography, Tag, Timeline, Popconfirm, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { MeterReading } from '@/types';
import getActorInfo from '@/utils/getActorInfo';
import { useGetPresignedURLQuery } from '@/hooks/useFileUpload';

const { Text } = Typography;

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

interface ReviewModalProps {
  visible: boolean;
  reading: MeterReading | null;
  onClose: () => void;
  onApprove: (readingId: string) => void;
  onReject: (readingId: string) => void;
  approveLoading: boolean;
  rejectLoading: boolean;
  getStatusColor: (status: string) => string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  reading,
  onClose,
  onApprove,
  onReject,
  approveLoading,
  rejectLoading,
  getStatusColor
}) => {
  // Fetch presigned URLs for photos using queries (with caching)
  const waterPhotoParams = reading?.waterPhotoUrl && reading?.roomId ? {
    operation: 'get' as const,
    roomNumber: reading.roomId.toString(),
    contentType: undefined,
    meterType: 'water' as const,
    fileName: reading.waterPhotoUrl
  } : null;

  const electricityPhotoParams = reading?.electricityPhotoUrl && reading?.roomId ? {
    operation: 'get' as const,
    roomNumber: reading.roomId.toString(),
    contentType: undefined,
    meterType: 'electricity' as const,
    fileName: reading.electricityPhotoUrl
  } : null;

  const { data: waterPresigned, isLoading: waterLoading } = useGetPresignedURLQuery(waterPhotoParams);
  const { data: electricityPresigned, isLoading: electricityLoading } = useGetPresignedURLQuery(electricityPhotoParams);

  if (!reading) return null;

  return (
    <Modal
      title={`Review Reading - Room ${reading.room?.roomNumber}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        reading.status.toLowerCase() === 'pending' ? [
          <Button key="cancel" onClick={onClose}>
            Cancel
          </Button>,
          <Popconfirm
            key="reject"
            title="Reject this reading?"
            description="The tenant will need to resubmit."
            onConfirm={() => onReject(reading.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<CloseCircleOutlined />}
              loading={rejectLoading}
            >
              Reject
            </Button>
          </Popconfirm>,
          <Popconfirm
            key="approve"
            title="Approve this reading?"
            description="This action cannot be undone."
            onConfirm={() => onApprove(reading.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={approveLoading}
              className="bg-green-500 hover:bg-green-600"
            >
              Approve
            </Button>
          </Popconfirm>,
        ] : [
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]
      }
    >
      <div className="space-y-4">
        {/* Reading Details */}
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="Current Readings">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Water:</span>
                  <span className="font-medium text-cyan-600">
                    {toNumber(reading.waterReading)} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Electricity:</span>
                  <span className="font-medium text-blue-600">
                    {toNumber(reading.electricityReading)} units
                  </span>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="Bill Calculation">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Base Rent:</span>
                  <span>{toNumber(reading.baseRent).toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span>Trash Fee:</span>
                  <span>{toNumber(reading.trashFee).toLocaleString()} VNĐ</span>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between font-medium text-green-600">
                  <span>Total:</span>
                  <span>{toNumber(reading.totalAmount || 0).toLocaleString()} VNĐ</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Meter Photos */}
        <Card size="small" title="Meter Photos">
          <Row gutter={16}>
            <Col span={12}>
              <div className="text-center">
                <div className="text-sm font-medium mb-2 text-cyan-600">Water Meter</div>
                {waterLoading ? (
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Spin tip="Loading photo..." />
                  </div>
                ) : waterPresigned?.url ? (
                  <Image
                    src={waterPresigned.url}
                    alt="Water meter"
                    width="100%"
                    height={200}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Text type="secondary">No photo uploaded</Text>
                  </div>
                )}
              </div>
            </Col>
            <Col span={12}>
              <div className="text-center">
                <div className="text-sm font-medium mb-2 text-blue-600">Electricity Meter</div>
                {electricityLoading ? (
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Spin tip="Loading photo..." />
                  </div>
                ) : electricityPresigned?.url ? (
                  <Image
                    src={electricityPresigned.url}
                    alt="Electricity meter"
                    width="100%"
                    height={200}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Text type="secondary">No photo uploaded</Text>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Modification History */}
        {reading.modifications && reading.modifications.length > 0 && (
          <Card size="small" title={<><HistoryOutlined /> Modification History</>}>
            <Timeline
              items={reading.modifications.map((mod) => ({
                color: mod.modificationType.toLowerCase() === 'approve' ? 'green' :
                  mod.modificationType.toLowerCase() === 'reject' ? 'red' : 'blue',
                children: (
                  <div>
                    <div className="font-medium">
                      {mod.modificationType.charAt(0).toUpperCase() + mod.modificationType.slice(1)}
                      {mod.fieldName && ` - ${mod.fieldName}`}
                    </div>
                    {mod.oldValue && mod.newValue && (
                      <div className="text-sm text-gray-600">
                        Changed from "{mod.oldValue}" to "{mod.newValue}"
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const actor = getActorInfo(mod, reading);
                        return `By ${actor.name} (${actor.role})${actor.roomId ? ` - Room ${actor.roomId}` : ''} on ${new Date(mod.modifiedAt).toLocaleString()}`;
                      })()}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        )}

        {/* Submission Info */}
        <Card size="small" title="Submission Information">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Period:</span>
              <span className="font-medium">{reading.month}/{reading.year}</span>
            </div>
            <div className="flex justify-between">
              <span>Submitted:</span>
              <span>{new Date(reading.submittedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <Tag color={getStatusColor(reading.status)}>
                {reading.status.toUpperCase()}
              </Tag>
            </div>
            {reading.approvedAt && (
              <div className="flex justify-between">
                <span>Approved:</span>
                <span>{new Date(reading.approvedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
};
