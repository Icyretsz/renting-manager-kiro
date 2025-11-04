import React, { useState } from 'react';
import {
  Modal,
  Tag,
  Image,
  Typography,
  Row,
  Col,
  Statistic,
  Space,
  Button,
  Tooltip,
  Card,
  Collapse,
  Empty,
  Pagination
} from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { MeterReading } from '@/types';

const { Text } = Typography;

interface ReadingHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  readings: MeterReading[];
  loading?: boolean;
  roomNumber?: number;
}

// Utility function to safely convert Prisma Decimal strings to numbers
const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    case 'pending':
      return 'orange';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircleOutlined />;
    case 'rejected':
      return <CloseCircleOutlined />;
    case 'pending':
      return <ClockCircleOutlined />;
    default:
      return null;
  }
};

export const ReadingHistoryModal: React.FC<ReadingHistoryModalProps> = ({
  visible,
  onClose,
  readings,
  loading = false,
  roomNumber
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Calculate usage differences for consecutive readings
  const readingsWithUsage = readings.map((reading, index) => {
    const previousReading = readings[index + 1]; // Next item is previous chronologically
    let waterUsage = 0;
    let electricityUsage = 0;
    let isFirstReading = false;
    let isMeterReset = false;

    if (previousReading) {
      const waterDiff = toNumber(reading.waterReading) - toNumber(previousReading.waterReading);
      const electricityDiff = toNumber(reading.electricityReading) - toNumber(previousReading.electricityReading);
      
      // Check for meter reset: if current reading is significantly lower than previous
      // This indicates meter replacement or reset
      const waterResetThreshold = toNumber(previousReading.waterReading) * 0.5; // 50% drop indicates reset
      const electricityResetThreshold = toNumber(previousReading.electricityReading) * 0.5;
      
      const isWaterReset = waterDiff < 0 && Math.abs(waterDiff) > waterResetThreshold;
      const isElectricityReset = electricityDiff < 0 && Math.abs(electricityDiff) > electricityResetThreshold;
      
      if (isWaterReset || isElectricityReset) {
        // Meter reset detected - treat current reading as usage from 0
        waterUsage = toNumber(reading.waterReading);
        electricityUsage = toNumber(reading.electricityReading);
        isMeterReset = true;
      } else {
        // Normal case: calculate difference from previous reading
        waterUsage = Math.max(0, waterDiff);
        electricityUsage = Math.max(0, electricityDiff);
      }
    } else {
      // First reading case: the reading itself represents the usage from 0
      waterUsage = toNumber(reading.waterReading);
      electricityUsage = toNumber(reading.electricityReading);
      isFirstReading = true;
    }

    return {
      ...reading,
      waterUsage,
      electricityUsage,
      isFirstReading,
      isMeterReset,
    };
  });

  // Paginate readings
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedReadings = readingsWithUsage.slice(startIndex, endIndex);

  const ReadingCard: React.FC<{ reading: MeterReading & { waterUsage: number; electricityUsage: number; isFirstReading: boolean; isMeterReset: boolean } }> = ({ reading }) => (
    <Card 
      className="mb-4 shadow-sm hover:shadow-md transition-shadow"
      size="small"
    >
      {/* Header with period and status */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-lg font-semibold text-gray-800">
            {reading.month}/{reading.year}
          </div>
          <Text type="secondary" className="text-sm">
            Submitted: {new Date(reading.submittedAt).toLocaleDateString()}
          </Text>
        </div>
        <Tag
          color={getStatusColor(reading.status)}
          icon={getStatusIcon(reading.status)}
          className="capitalize"
        >
          {reading.status}
        </Tag>
      </div>

      {/* Main readings */}
      <Row gutter={16} className="mb-3">
        <Col xs={12} sm={6}>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-medium text-blue-600">
              {toNumber(reading.waterReading).toFixed(1)}
            </div>
            <Text type="secondary" className="text-xs">Water (units)</Text>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-lg font-medium text-yellow-600">
              {toNumber(reading.electricityReading).toFixed(1)}
            </div>
            <Text type="secondary" className="text-xs">Electricity (kWh)</Text>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-medium text-green-600">
              {reading.totalAmount ? `${toNumber(reading.totalAmount).toLocaleString()}` : '-'}
            </div>
            <Text type="secondary" className="text-xs">Total (VNĐ)</Text>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="text-center p-2 bg-gray-50 rounded">
            <Space size="small" className="flex justify-center">
              {reading.waterPhotoUrl && (
                <Tooltip title="Water meter photo">
                  <Image
                    src={reading.waterPhotoUrl}
                    alt="Water meter"
                    width={24}
                    height={24}
                    className="rounded object-cover cursor-pointer"
                    preview={{
                      mask: <EyeOutlined />,
                    }}
                  />
                </Tooltip>
              )}
              {reading.electricityPhotoUrl && (
                <Tooltip title="Electricity meter photo">
                  <Image
                    src={reading.electricityPhotoUrl}
                    alt="Electricity meter"
                    width={24}
                    height={24}
                    className="rounded object-cover cursor-pointer"
                    preview={{
                      mask: <EyeOutlined />,
                    }}
                  />
                </Tooltip>
              )}
            </Space>
            <Text type="secondary" className="text-xs block">Photos</Text>
          </div>
        </Col>
      </Row>

      {/* Expandable details */}
      <Collapse
        ghost
        size="small"
        items={[
          {
            key: reading.id,
            label: (
              <Text type="secondary" className="text-sm">
                View detailed breakdown
              </Text>
            ),
            children: (
              <div className="bg-gray-50 p-3 rounded -mx-3">
                <Row gutter={[16, 8]}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={
                        reading.isFirstReading 
                          ? "Water Reading" 
                          : reading.isMeterReset 
                            ? "Water Usage (Reset)" 
                            : "Water Usage"
                      }
                      value={reading.waterUsage}
                      precision={1}
                      suffix="m³"
                      valueStyle={{ fontSize: '14px' }}
                    />
                    {reading.isFirstReading && (
                      <Text type="secondary" className="text-xs">
                        (First reading)
                      </Text>
                    )}
                    {reading.isMeterReset && (
                      <Text type="warning" className="text-xs">
                        (Meter replaced/reset)
                      </Text>
                    )}
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={
                        reading.isFirstReading 
                          ? "Electricity Reading" 
                          : reading.isMeterReset 
                            ? "Electricity Usage (Reset)" 
                            : "Electricity Usage"
                      }
                      value={reading.electricityUsage}
                      precision={1}
                      suffix="kWh"
                      valueStyle={{ fontSize: '14px' }}
                    />
                    {reading.isFirstReading && (
                      <Text type="secondary" className="text-xs">
                        (First reading)
                      </Text>
                    )}
                    {reading.isMeterReset && (
                      <Text type="warning" className="text-xs">
                        (Meter replaced/reset)
                      </Text>
                    )}
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Base Rent"
                      value={toNumber(reading.baseRent)}
                      precision={0}
                      suffix="VNĐ"
                      valueStyle={{ fontSize: '14px' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Trash Fee"
                      value={toNumber(reading.trashFee)}
                      precision={0}
                      suffix="VNĐ"
                      valueStyle={{ fontSize: '14px' }}
                    />
                  </Col>
                </Row>
                {reading.approvedAt && (
                  <div className="mt-2 text-xs text-gray-500">
                    Approved on: {new Date(reading.approvedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Card>
  );

  return (
    <Modal
      title={
        <div>
          Reading History
          {roomNumber && (
            <Text type="secondary" className="ml-2">
              - Room {roomNumber}
            </Text>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={800}
      className="reading-history-modal"
    >
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <Text type="secondary">Loading reading history...</Text>
          </div>
        ) : readingsWithUsage.length === 0 ? (
          <Empty 
            description="No reading history found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {paginatedReadings.map((reading) => (
              <ReadingCard key={reading.id} reading={reading} />
            ))}
            
            {readingsWithUsage.length > pageSize && (
              <div className="text-center mt-4">
                <Pagination
                  current={currentPage}
                  total={readingsWithUsage.length}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showTotal={(total, range) => 
                    `${range[0]}-${range[1]} of ${total} readings`
                  }
                  size="small"
                />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};