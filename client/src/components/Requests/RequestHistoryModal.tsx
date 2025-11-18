import React from 'react';
import { Modal, Card, Tag, Space, Empty, Image, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { ClockCircleOutlined, ToolOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { Request } from '@/types';
import { useGetPresignedURLQuery } from '@/hooks/useFileUpload';
import dayjs from 'dayjs';

interface RequestHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  requests: Request[];
  loading: boolean;
}

export const RequestHistoryModal: React.FC<RequestHistoryModalProps> = ({
  visible,
  onClose,
  requests,
  loading
}) => {
  const { t } = useTranslation();

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'CURFEW':
        return <ClockCircleOutlined />;
      case 'REPAIR':
        return <ToolOutlined />;
      case 'OTHER':
        return <FileTextOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'CURFEW':
        return 'blue';
      case 'REPAIR':
        return 'orange';
      case 'OTHER':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleOutlined />;
      case 'REJECTED':
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('request.statusPending');
      case 'APPROVED':
        return t('request.statusApproved');
      case 'REJECTED':
        return t('request.statusRejected');
      default:
        return status;
    }
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'CURFEW':
        return t('request.curfewRequest');
      case 'REPAIR':
        return t('request.repairRequest');
      case 'OTHER':
        return t('request.otherRequest');
      default:
        return type;
    }
  };

  // Component for rendering a single request card with photo fetching
  const RequestCard: React.FC<{ request: Request }> = ({ request }) => {
    // Fetch presigned URLs for photos
    const photoQueries = (request.photoUrls || []).map((fileName) =>
      useGetPresignedURLQuery(
        fileName ? {
          operation: 'get',
          roomNumber: request.room?.roomNumber?.toString() || request.roomId.toString(),
          contentType: undefined,
          imageType: 'repair',
          fileName: fileName
        } : null
      )
    );

    const isLoadingPhotos = photoQueries.some(q => q.isLoading);
    const photoURLs = photoQueries.map(q => q.data?.url).filter(Boolean);

    return (
      <Card key={request.id} size="small" className="hover:shadow-md transition-shadow">
        <div className="space-y-3">
          {/* Header: Type and Status */}
          <div className="flex justify-between items-start flex-wrap gap-2">
            <Tag icon={getRequestTypeIcon(request.requestType)} color={getRequestTypeColor(request.requestType)} className="text-sm">
              {getRequestTypeText(request.requestType)}
            </Tag>
            <Tag icon={getStatusIcon(request.status)} color={getStatusColor(request.status)} className="text-sm">
              {getStatusText(request.status)}
            </Tag>
          </div>

          {/* Description */}
          <div>
            {request.requestType === 'CURFEW' && request.curfewRequest ? (
              <div>
                <div className="text-sm text-gray-700 font-medium">
                  {t('request.curfewFor')}: {request.curfewRequest.tenantNames?.join(', ') || `${request.curfewRequest.tenantIds.length} ${t('request.tenants')}`}
                </div>
                {request.curfewRequest.reason && (
                  <div className="text-sm text-gray-500 mt-1">
                    {request.curfewRequest.reason}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-700">
                {request.description || '-'}
              </div>
            )}
          </div>

          {/* Photos */}
          {request.photoUrls && request.photoUrls.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">{t('request.photos')}:</div>
              {isLoadingPhotos ? (
                <div className="flex justify-center py-2">
                  <Spin size="small" />
                </div>
              ) : (
                <Image.PreviewGroup>
                  <Space size={8}>
                    {photoURLs.map((url, index) => (
                      <Image
                        key={index}
                        width={60}
                        height={60}
                        src={url}
                        alt={`Photo ${index + 1}`}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="flex flex-col gap-1 text-xs text-gray-500 border-t pt-2">
            <div className="flex items-center gap-1">
              <CalendarOutlined />
              <span>{t('request.createdAt')}: {dayjs(request.createdAt).format('DD/MM/YYYY HH:mm')}</span>
            </div>
            {request.approvedAt && (
              <div className="flex items-center gap-1">
                <CalendarOutlined />
                <span>{t('request.approvedAt')}: {dayjs(request.approvedAt).format('DD/MM/YYYY HH:mm')}</span>
              </div>
            )}
          </div>

          {/* Rejection Reason */}
          {request.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <div className="text-xs text-red-600 font-medium">{t('request.reason')}:</div>
              <div className="text-sm text-red-700 mt-1">{request.rejectionReason}</div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>{t('request.requestHistory')}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : requests.length === 0 ? (
          <Empty
            description={t('request.noRequests')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))
        )}
      </div>

      {/* Footer with count */}
      {!loading && requests.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4 pt-3 border-t">
          {t('common.total')} {requests.length} {t('request.requests')}
        </div>
      )}
    </Modal>
  );
};
