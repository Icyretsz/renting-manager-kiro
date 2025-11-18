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
  ClockCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { ReadingHistoryModalProps, MeterReading } from '@/types';
import { useGetPresignedURLQuery } from '@/hooks/useFileUpload';
import { LoadingSpinner } from '../Loading';
import { useTranslation } from 'react-i18next';
import { useTranslationHelpers } from '@/hooks/useTranslationHelpers';

const { Text } = Typography;

// Utility function to safely convert Prisma Decimal strings to numbers
const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

// Helper function to get the correct actor information based on modification type
const getActorInfo = (mod: any, reading: MeterReading) => {
  switch (mod.modificationType.toLowerCase()) {
    case 'approve':
      // For approve actions, use the approver information
      return reading.approver ? {
        name: reading.approver.tenant?.name || reading.approver.name,
        role: reading.approver.role,
        roomId: reading.approver.tenant?.roomId
      } : { name: 'Unknown', role: 'Unknown', roomId: null };

    case 'reject':
      // For reject actions, use the modifier information
      return mod.modifier ? {
        name: mod.modifier.tenant?.name || mod.modifier.name,
        role: mod.modifier.role,
        roomId: mod.modifier.tenant?.roomId
      } : { name: 'Unknown', role: 'Unknown', roomId: null };

    case 'create':
      // For create actions, use the submitter information
      return reading.submitter ? {
        name: reading.submitter.tenant?.name || reading.submitter.name,
        role: reading.submitter.role,
        roomId: reading.submitter.tenant?.roomId
      } : { name: 'Unknown', role: 'Unknown', roomId: null };

    default:
      // For update and other actions, use the modifier information
      return mod.modifier ? {
        name: mod.modifier.tenant?.name || mod.modifier.name,
        role: mod.modifier.role,
        roomId: mod.modifier.tenant?.roomId
      } : { name: 'Unknown', role: 'Unknown', roomId: null };
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
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
  switch (status.toLowerCase()) {
    case 'approved':
      return <CheckCircleOutlined />;
    case 'rejected':
      return <CloseCircleOutlined />;
    case 'PENDING':
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
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const { getStatus, getModificationHistoryAction, getModificationHistoryFieldName, getRole } = useTranslationHelpers()

  // Calculate usage differences for consecutive readings
  const readingsWithUsage = readings.map((reading, index) => {
    const previousReading = readings[index + 1]; // Next item is previous chronologically
    let waterUsage = 0;
    let electricityUsage = 0;
    let isFirstReading = false;

    if (previousReading) {
      // Normal case: calculate difference from previous reading
      waterUsage = Math.max(0, toNumber(reading.waterReading) - toNumber(previousReading.waterReading));
      electricityUsage = Math.max(0, toNumber(reading.electricityReading) - toNumber(previousReading.electricityReading));
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
    };
  });

  // Paginate readings
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedReadings = readingsWithUsage.slice(startIndex, endIndex);

  const ReadingCard: React.FC<{ reading: MeterReading & { waterUsage: number; electricityUsage: number; isFirstReading: boolean } }> = ({ reading }) => {
    const { t } = useTranslation();
    // Use queries for fetching presigned URLs (with caching)
    const { data: waterPresigned, isLoading: waterLoading } = useGetPresignedURLQuery(
      reading.waterPhotoUrl ? {
        operation: 'get',
        roomNumber: reading.roomId.toString(),
        contentType: undefined,
        imageType: 'water',
        fileName: reading.waterPhotoUrl
      } : null
    );

    const { data: electricityPresigned, isLoading: electricityLoading } = useGetPresignedURLQuery(
      reading.electricityPhotoUrl ? {
        operation: 'get',
        roomNumber: reading.roomId.toString(),
        contentType: undefined,
        imageType: 'electricity',
        fileName: reading.electricityPhotoUrl
      } : null
    );

    const waterPhotoURL = waterPresigned?.url || '';
    const electricityPhotoURL = electricityPresigned?.url || '';
    const isPending = waterLoading || electricityLoading;

    return (<Card
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
            {t('meterReadings.submitted')}: {new Date(reading.submittedAt).toLocaleDateString()}
          </Text>
        </div>
        <Tag
          color={getStatusColor(reading.status)}
          icon={getStatusIcon(reading.status)}
          className="capitalize"
        >
          {getStatus(reading.status)}
        </Tag>
      </div>

      {/* Main readings */}
      <Row gutter={16} className="mb-3">
        <Col xs={12} sm={6}>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-medium text-blue-600">
              {toNumber(reading.waterReading).toFixed(1)}
            </div>
            <Text type="secondary" className="text-xs">{t('meterReadings.water')} (m³)</Text>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-lg font-medium text-yellow-600">
              {toNumber(reading.electricityReading).toFixed(1)}
            </div>
            <Text type="secondary" className="text-xs">{t('meterReadings.electricity')} (kWh)</Text>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-medium text-green-600">
              {reading.totalAmount ? `${toNumber(reading.totalAmount).toLocaleString()}` : '-'}
            </div>
            <Text type="secondary" className="text-xs">{t('meterReadings.total')} (VNĐ)</Text>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="text-center p-2 bg-red-50 flex flex-col gap-2 rounded">
            <Space size="small" className="flex justify-center">
              {!isPending ? (
                <Tooltip title="Water meter photo">
                  <Image
                    src={waterPhotoURL}
                    alt="Water meter"
                    width={24}
                    height={24}
                    className="rounded object-cover cursor-pointer"
                    preview={{
                      mask: <EyeOutlined />,
                    }}
                  />
                </Tooltip>
              ) : <LoadingSpinner />}
              {!isPending ? (
                <Tooltip title="Electricity meter photo">
                  <Image
                    src={electricityPhotoURL}
                    alt="Electricity meter"
                    width={24}
                    height={24}
                    className="rounded object-cover cursor-pointer"
                    preview={{
                      mask: <EyeOutlined />,
                    }}
                  />
                </Tooltip>
              ) : <LoadingSpinner />}
            </Space>
            <Text type="secondary" className="text-xs block">{t('meterReadings.photos')}</Text>
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
                {t('meterReadings.viewDetailedBreakdown')}
              </Text>
            ),
            children: (
              <div className="bg-gray-50 p-3 rounded -mx-3">
                <Row gutter={[16, 8]}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={t('meterReadings.waterUsage')}
                      value={reading.waterUsage}
                      precision={1}
                      suffix="m³"
                      valueStyle={{ fontSize: '14px' }}
                    />
                    {reading.isFirstReading && (
                      <Text type="secondary" className="text-xs">
                        ({t('meterReadings.firstEntry')})
                      </Text>
                    )}
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={t('meterReadings.electricityUsage')}
                      value={reading.electricityUsage}
                      precision={1}
                      suffix="kWh"
                      valueStyle={{ fontSize: '14px' }}
                    />
                    {reading.isFirstReading && (
                      <Text type="secondary" className="text-xs">
                        ({t('meterReadings.firstEntry')})
                      </Text>
                    )}
                  </Col>
                </Row>

                {/* Modification History */}
                {reading.modifications && reading.modifications.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center mb-2">
                      <HistoryOutlined className="text-gray-500 mr-1" />
                      <Text strong className="text-sm">{t('meterReadings.modificationHistory')}</Text>
                    </div>
                    <div className="space-y-2">
                      {reading.modifications.map((mod) => (
                        <div key={mod.id} className="text-xs bg-white p-2 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium">
                                {getModificationHistoryAction(mod.modificationType)}
                              </span>
                              {mod.fieldName && (
                                <span className="text-gray-600"> - {getModificationHistoryFieldName(mod.fieldName)}</span>
                              )}
                            </div>
                            <span className="text-gray-500">
                              {new Date(mod.modifiedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {mod.oldValue && mod.newValue && (
                            <div className="text-gray-600 mt-1">
                              {t('meterReadings.changedFromTo', { oldValue: mod.oldValue, newValue: mod.newValue })}
                            </div>
                          )}
                          <div className="text-gray-500 mt-1">
                            {(() => {
                              const actor = getActorInfo(mod, reading);
                              return actor.roomId 
                                ? t('meterReadings.byActorRoleRoom', { name: actor.name, role: getRole(actor.role), room: actor.roomId })
                                : t('meterReadings.byActorRole', { name: actor.name, role: getRole(actor.role) });
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reading.approvedAt && (
                  <div className="mt-2 text-xs text-gray-500">
                    {t('meterReadings.approvedOn')}: {new Date(reading.approvedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Card>
    )
  };

  return (
    <Modal
      title={
        <div>
          {t('meterReadings.readingHistoryTitle')}
          {roomNumber && (
            <Text type="secondary" className="ml-2">
              - {t('meterReadings.room')} {roomNumber}
            </Text>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common.close')}
        </Button>
      ]}
      width={800}
      className="reading-history-modal"
    >
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <Text type="secondary">{t('meterReadings.loadingReadingHistory')}</Text>
          </div>
        ) : readingsWithUsage.length === 0 ? (
          <Empty
            description={t('meterReadings.noReadingHistoryFound')}
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
                    t('meterReadings.readingsRange', { start: range[0], end: range[1], total })
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