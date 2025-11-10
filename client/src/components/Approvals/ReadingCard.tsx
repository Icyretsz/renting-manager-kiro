import React from 'react';
import { Card, Row, Col, Tag, Button, Space, Popconfirm } from 'antd';
import { EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { MeterReading } from '@/types';

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

interface ReadingCardProps {
  reading: MeterReading;
  onReview: (reading: MeterReading) => void;
  onApprove: (readingId: string) => void;
  approveLoading: boolean;
  getStatusColor: (status: string) => string;
}

export const ReadingCard: React.FC<ReadingCardProps> = ({
  reading,
  onReview,
  onApprove,
  approveLoading,
  getStatusColor
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow ml-2">
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-base">
              {reading.month}/{reading.year}
            </div>
            <div className="text-sm text-gray-500">
              Floor {reading.room?.floor}
            </div>
            <div className="text-xs text-gray-400">
              Submitted: {new Date(reading.submittedAt).toLocaleDateString()}
            </div>
            {reading.submitter && (
              <div className="text-xs text-gray-400">
                By: {reading.submitter.name} ({reading.submitter.role})
                {reading.submitter.tenant?.roomId && (
                  <span> - Room {reading.submitter.tenant.roomId}</span>
                )}
              </div>
            )}
          </div>
          <Tag color={getStatusColor(reading.status)} className="ml-2">
            {reading.status}
          </Tag>
        </div>

        {/* Readings Row */}
        <Row gutter={16}>
          <Col span={8}>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-sm font-medium text-blue-600">
                ⚡ {toNumber(reading.electricityReading)}
              </div>
              <div className="text-xs text-gray-500">Electricity</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center p-2 bg-cyan-50 rounded">
              <div className="text-sm font-medium text-cyan-600">
                💧 {toNumber(reading.waterReading)}
              </div>
              <div className="text-xs text-gray-500">Water</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-sm font-medium text-green-600">
                {toNumber(reading.totalAmount || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total VNĐ</div>
            </div>
          </Col>
        </Row>

        {/* Actions Row */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => onReview(reading)}
          >
            Review
          </Button>

          {reading.status.toLowerCase() === 'pending' && (
            <Space>
              <Popconfirm
                title="Approve this reading?"
                description="This action cannot be undone."
                onConfirm={() => onApprove(reading.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  loading={approveLoading}
                  className="bg-green-500 hover:bg-green-600 border-green-500"
                >
                  Approve
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>
      </div>
    </Card>
  );
};
