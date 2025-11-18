import React, { useState } from 'react';
import {
  Card,
  Button,
  Tag,
  Typography,
  Empty,
  Tabs,
  Badge,
  Image,
  Space,
  Spin,
} from 'antd';
import {
  DownOutlined,
  RightOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import {
  useAllReadingsQuery,
  useApproveReadingMutation,
  useRejectReadingMutation,
  meterReadingKeys,
} from '@/hooks/useMeterReadings';
import {
  usePendingCurfewRequestsQuery,
  useApproveCurfewOverrideMutation,
  useRejectCurfewOverrideMutation,
  curfewKeys,
} from '@/hooks/useCurfew';
import {
  usePendingRequestsQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  requestKeys,
} from '@/hooks/useRequests';
import { useGetPresignedURLQuery } from '@/hooks/useFileUpload';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { RefreshButton } from '@/components/Common/RefreshButton';
import { MeterReading } from '@/types';
import {
  StatisticsCards,
  FiltersCard,
  ReadingCard,
  ReviewModal,
  CurfewRequestCard,
  CurfewHistoryModal,
  CurfewRejectModal,
} from '@/components/Approvals';
import { ToolOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Utility function to safely convert Prisma Decimal strings to numbers
const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const ApprovalsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('readings');
  
  // Reading states
  const [selectedReading, setSelectedReading] = useState<MeterReading | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, _setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());
  const [collapsedStatuses, setCollapsedStatuses] = useState<Set<string>>(new Set());

  // Curfew states
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenantName, setSelectedTenantName] = useState<string>('');
  const [curfewHistoryVisible, setCurfewHistoryVisible] = useState(false);
  const [curfewRejectModalVisible, setCurfewRejectModalVisible] = useState(false);
  const [tenantToReject, setTenantToReject] = useState<string | null>(null);

  const { data: allReadings, isLoading } = useAllReadingsQuery();
  const approveMutation = useApproveReadingMutation();
  const rejectMutation = useRejectReadingMutation();

  // Curfew queries
  const { data: pendingCurfewRequests, isLoading: curfewLoading } = usePendingCurfewRequestsQuery();
  const approveCurfewMutation = useApproveCurfewOverrideMutation();
  const rejectCurfewMutation = useRejectCurfewOverrideMutation();

  // General requests queries
  const { data: pendingRequests, isLoading: requestsLoading } = usePendingRequestsQuery();
  const approveRequestMutation = useApproveRequestMutation();
  const rejectRequestMutation = useRejectRequestMutation();

  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <Text type="danger">Access denied. Admin privileges required.</Text>
      </div>
    );
  }

  // Filter readings based on status and search
  const filteredReadings = allReadings?.filter((reading) => {
    const matchesStatus = filterStatus === 'all' || reading.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = searchText === '' ||
      reading.room?.roomNumber.toString().includes(searchText) ||
      `${reading.month}/${reading.year}`.includes(searchText);
    return matchesStatus && matchesSearch;
  }) || [];

  // Group readings by room, then by status within each room
  const groupedReadings = filteredReadings.reduce((acc, reading) => {
    const roomNumber = reading.room?.roomNumber || 'Unknown';
    const status = reading.status.toLowerCase();

    if (!acc[roomNumber]) {
      acc[roomNumber] = {};
    }

    if (!acc[roomNumber][status]) {
      acc[roomNumber][status] = [];
    }

    acc[roomNumber][status].push(reading);
    return acc;
  }, {} as Record<string, Record<string, MeterReading[]>>);

  // Sort rooms by room number and sort readings within each status group
  const sortedRoomNumbers = Object.keys(groupedReadings).sort((a, b) => {
    const roomA = a === 'Unknown' ? Infinity : parseInt(a);
    const roomB = b === 'Unknown' ? Infinity : parseInt(b);
    return roomA - roomB;
  });

  // Sort readings within each status group
  Object.keys(groupedReadings).forEach(roomNumber => {
    Object.keys(groupedReadings[roomNumber]).forEach(status => {
      groupedReadings[roomNumber][status].sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
          case 'amount':
            return toNumber(b.totalAmount || 0) - toNumber(a.totalAmount || 0);
          default:
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
      });
    });
  });

  // Calculate statistics from all readings
  const pendingCount = allReadings?.filter(r => r.status.toLowerCase() === 'pending').length || 0;
  const totalCount = allReadings?.length || 0;
  const approvedTodayCount = allReadings?.filter(r =>
    r.status.toLowerCase() === 'approved' &&
    r.approvedAt &&
    new Date(r.approvedAt).toDateString() === new Date().toDateString()
  ).length || 0;

  const handleReviewReading = (reading: MeterReading) => {
    setSelectedReading(reading);
    setReviewModalVisible(true);
  };

  const handleApprove = async (readingId: string) => {
    try {
      await approveMutation.mutateAsync(readingId);
      setReviewModalVisible(false);
    } catch (error) {
      console.error('Failed to approve reading:', error);
    }
  };

  const handleReject = async (readingId: string) => {
    try {
      await rejectMutation.mutateAsync(readingId);
      setReviewModalVisible(false);
    } catch (error) {
      console.error('Failed to reject reading:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  const toggleRoomCollapse = (roomNumber: string) => {
    const newCollapsed = new Set(collapsedRooms);
    if (newCollapsed.has(roomNumber)) {
      newCollapsed.delete(roomNumber);
    } else {
      newCollapsed.add(roomNumber);
    }
    setCollapsedRooms(newCollapsed);
  };

  const toggleStatusCollapse = (roomNumber: string, status: string) => {
    const key = `${roomNumber}-${status}`;
    const newCollapsed = new Set(collapsedStatuses);
    if (newCollapsed.has(key)) {
      newCollapsed.delete(key);
    } else {
      newCollapsed.add(key);
    }
    setCollapsedStatuses(newCollapsed);
  };

  // Curfew handlers
  const handleApproveCurfew = async (tenantId: string, isPermanent: boolean) => {
    try {
      await approveCurfewMutation.mutateAsync({
        tenantIds: [tenantId],
        isPermanent
      });
    } catch (error) {
      console.error('Failed to approve curfew:', error);
    }
  };

  const handleRejectCurfew = (tenantId: string) => {
    setTenantToReject(tenantId);
    setCurfewRejectModalVisible(true);
  };

  const handleRejectCurfewSubmit = async (reason: string) => {
    if (!tenantToReject) return;
    
    try {
      await rejectCurfewMutation.mutateAsync({
        tenantIds: [tenantToReject],
        reason
      });
      setCurfewRejectModalVisible(false);
      setTenantToReject(null);
    } catch (error) {
      console.error('Failed to reject curfew:', error);
    }
  };

  const handleViewCurfewHistory = (tenantId: string, tenantName?: string) => {
    setSelectedTenantId(tenantId);
    setSelectedTenantName(tenantName || '');
    setCurfewHistoryVisible(true);
  };

  // Component for rendering a request card with photo fetching
  const RequestCard: React.FC<{ request: any }> = ({ request }) => {
    // Fetch presigned URLs for photos
    const photoQueries = (request.photoUrls || []).map((fileName: string) =>
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

    const isLoadingPhotos = photoQueries.some((q: { isLoading: boolean; }) => q.isLoading);
    const photoURLs = photoQueries.map((q: { data: { url: string; }; }) => q.data?.url).filter(Boolean);

    return (
      <Card key={request.id} size="small" className="hover:shadow-md transition-shadow">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Tag color={request.requestType === 'REPAIR' ? 'orange' : 'purple'}>
                {request.requestType}
              </Tag>
              <span className="text-sm text-gray-600">
                Room {request.room?.roomNumber}
              </span>
            </div>
            <Tag color="orange">PENDING</Tag>
          </div>

          {/* User Info */}
          <div className="text-sm">
            <span className="text-gray-600">Requested by: </span>
            <span className="font-medium">{request.user?.name}</span>
          </div>

          {/* Description */}
          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
            {request.description}
          </div>

          {/* Photos */}
          {request.photoUrls && request.photoUrls.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Attached photos:</div>
              {isLoadingPhotos ? (
                <div className="flex justify-center py-2">
                  <Spin size="small" />
                </div>
              ) : (
                <Image.PreviewGroup>
                  <Space size={8}>
                    {photoURLs.map((url : string, index : number) => (
                      <Image
                        key={index}
                        width={80}
                        height={80}
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

          {/* Date */}
          <div className="text-xs text-gray-500">
            Submitted: {new Date(request.createdAt).toLocaleString()}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              type="primary"
              size="small"
              onClick={() => approveRequestMutation.mutate({ requestId: request.id })}
              loading={approveRequestMutation.isPending}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              danger
              size="small"
              onClick={() => {
                const reason = prompt('Enter rejection reason (optional):');
                if (reason !== null) {
                  rejectRequestMutation.mutate({ requestId: request.id, reason: reason || undefined });
                }
              }}
              loading={rejectRequestMutation.isPending}
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Group curfew requests by room
  const groupedCurfewRequests = (pendingCurfewRequests || []).reduce((acc: any, request: any) => {
    const roomNumber = request.room?.roomNumber || 'Unknown';
    if (!acc[roomNumber]) {
      acc[roomNumber] = [];
    }
    acc[roomNumber].push(request);
    return acc;
  }, {});

  const sortedCurfewRoomNumbers = Object.keys(groupedCurfewRequests).sort((a, b) => {
    const roomA = a === 'Unknown' ? Infinity : parseInt(a);
    const roomB = b === 'Unknown' ? Infinity : parseInt(b);
    return roomA - roomB;
  });

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Title level={3} className="mb-1">Approvals</Title>
            <Text className="text-gray-600">
              Review and approve meter readings and curfew requests
            </Text>
          </div>
          <RefreshButton
            queryKeys={[meterReadingKeys.all, curfewKeys.all, requestKeys.all]}
            tooltip="Refresh approvals"
          />
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'readings',
              label: (
                <span>
                  <FileTextOutlined />
                  Meter Readings
                  {pendingCount > 0 && (
                    <Badge count={pendingCount} className="ml-2" />
                  )}
                </span>
              ),
              children: null,
            },
            {
              key: 'curfew',
              label: (
                <span>
                  <ClockCircleOutlined />
                  Curfew Requests
                  {(pendingCurfewRequests?.length || 0) > 0 && (
                    <Badge count={pendingCurfewRequests?.length} className="ml-2" />
                  )}
                </span>
              ),
              children: null,
            },
            {
              key: 'requests',
              label: (
                <span>
                  <ToolOutlined />
                  General Requests
                  {(pendingRequests?.length || 0) > 0 && (
                    <Badge count={pendingRequests?.length} className="ml-2" />
                  )}
                </span>
              ),
              children: null,
            },
          ]}
        />

        {/* Meter Readings Tab */}
        {activeTab === 'readings' && (
          <>
            {isLoading ? (<LoadingSpinner message="Loading readings..." />) :
            <>
            {/* Statistics */}
            <StatisticsCards
              pendingCount={pendingCount}
              totalCount={totalCount}
              approvedTodayCount={approvedTodayCount}
            />

        {/* Filters */}
        <FiltersCard
          filterStatus={filterStatus}
          sortBy={sortBy}
          onFilterStatusChange={setFilterStatus}
          onSortByChange={setSortBy}
        />

        {/* Results Count and Controls */}
        {filteredReadings.length > 0 && (
          <div className="flex justify-between items-center px-2">
            <div className="flex gap-2">
              <Button
                size="small"
                type="text"
                onClick={() => setCollapsedRooms(new Set())}
                disabled={collapsedRooms.size === 0}
              >
                Expand All Rooms
              </Button>
              <Button
                size="small"
                type="text"
                onClick={() => setCollapsedRooms(new Set(sortedRoomNumbers))}
                disabled={collapsedRooms.size === sortedRoomNumbers.length}
              >
                Collapse All Rooms
              </Button>
            </div>
          </div>
        )}

        {/* Grouped Readings List */}
        <div className="space-y-6">
          {sortedRoomNumbers.length === 0 ? (
            <Card>
              <Empty
                description={
                  filterStatus === 'all'
                    ? "No readings found"
                    : `No ${filterStatus.toLowerCase()} readings found`
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            sortedRoomNumbers.map((roomNumber) => {
              const roomReadings = groupedReadings[roomNumber];
              const statusOrder = ['pending', 'approved', 'rejected'];
              const sortedStatuses = Object.keys(roomReadings).sort((a, b) => {
                const indexA = statusOrder.indexOf(a);
                const indexB = statusOrder.indexOf(b);
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
              });

              const isRoomCollapsed = collapsedRooms.has(roomNumber);

              return (
                <div key={roomNumber} className="space-y-3">
                  {/* Room Header */}
                  <div
                    className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleRoomCollapse(roomNumber)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {isRoomCollapsed ? (
                          <RightOutlined className="text-gray-500 text-xs" />
                        ) : (
                          <DownOutlined className="text-gray-500 text-xs" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Room {roomNumber}
                          </h3>
                          <div className="text-sm text-gray-600">
                            {Object.values(roomReadings).flat().length} reading{Object.values(roomReadings).flat().length !== 1 ? 's' : ''}
                            {sortedStatuses.length > 1 && (
                              <span className="ml-2">
                                ({sortedStatuses.map(status => `${roomReadings[status].length} ${status}`).join(', ')})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {sortedStatuses.map(status => (
                          <Tag key={status} color={getStatusColor(status)} className="text-xs">
                            {roomReadings[status].length} {status.toUpperCase()}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status Groups */}
                  {!isRoomCollapsed && sortedStatuses.map((status) => {
                    const statusKey = `${roomNumber}-${status}`;
                    const isStatusCollapsed = collapsedStatuses.has(statusKey);
                    const hasMultipleReadings = roomReadings[status].length > 1;

                    return (
                      <div key={statusKey} className="ml-4 space-y-2">
                        {hasMultipleReadings && (
                          <div
                            className="text-sm font-medium text-gray-600 capitalize px-2 cursor-pointer hover:bg-gray-50 rounded py-1 flex items-center gap-2"
                            onClick={() => toggleStatusCollapse(roomNumber, status)}
                          >
                            {isStatusCollapsed ? (
                              <RightOutlined className="text-gray-400 text-xs" />
                            ) : (
                              <DownOutlined className="text-gray-400 text-xs" />
                            )}
                            {status} ({roomReadings[status].length})
                          </div>
                        )}

                        {(!hasMultipleReadings || !isStatusCollapsed) && roomReadings[status].map((reading) => (
                          <ReadingCard
                            key={reading.id}
                            reading={reading}
                            onReview={handleReviewReading}
                            onApprove={handleApprove}
                            approveLoading={approveMutation.isPending}
                            getStatusColor={getStatusColor}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
        </>}

            {/* Review Modal */}
            <ReviewModal
              visible={reviewModalVisible}
              reading={selectedReading}
              onClose={() => setReviewModalVisible(false)}
              onApprove={handleApprove}
              onReject={handleReject}
              approveLoading={approveMutation.isPending}
              rejectLoading={rejectMutation.isPending}
              getStatusColor={getStatusColor}
            />
          </>
        )}

        {/* Curfew Requests Tab */}
        {activeTab === 'curfew' && (
          <>
            {curfewLoading ? (
              <LoadingSpinner message="Loading curfew requests..." />
            ) : (
              <>
                {/* Statistics */}
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-500">
                        {pendingCurfewRequests?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Pending Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-500">
                        {sortedCurfewRoomNumbers.length}
                      </div>
                      <div className="text-sm text-gray-600">Rooms with Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-500">
                        {Object.values(groupedCurfewRequests).reduce((sum: number, requests: any) => sum + requests.length, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Tenants</div>
                    </div>
                  </div>
                </Card>

                {/* Curfew Requests List */}
                <div className="space-y-6">
                  {sortedCurfewRoomNumbers.length === 0 ? (
                    <Card>
                      <Empty
                        description="No pending curfew requests"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </Card>
                  ) : (
                    sortedCurfewRoomNumbers.map((roomNumber) => {
                      const roomRequests = groupedCurfewRequests[roomNumber];

                      return (
                        <div key={roomNumber} className="space-y-3">
                          {/* Room Header */}
                          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-orange-500">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                  Room {roomNumber}
                                </h3>
                                <div className="text-sm text-gray-600">
                                  {roomRequests.length} pending request{roomRequests.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <Tag color="orange" className="text-xs">
                                {roomRequests.length} PENDING
                              </Tag>
                            </div>
                          </div>

                          {/* Request Cards */}
                          <div className="ml-4 space-y-2">
                            {roomRequests.map((request: any) => (
                              <CurfewRequestCard
                                key={request.id}
                                request={request}
                                onApprove={handleApproveCurfew}
                                onReject={handleRejectCurfew}
                                onViewHistory={(tenantId) => handleViewCurfewHistory(tenantId, request.name)}
                                approveLoading={approveCurfewMutation.isPending}
                                rejectLoading={rejectCurfewMutation.isPending}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Curfew History Modal */}
                <CurfewHistoryModal
                  visible={curfewHistoryVisible}
                  tenantId={selectedTenantId}
                  tenantName={selectedTenantName}
                  onClose={() => {
                    setCurfewHistoryVisible(false);
                    setSelectedTenantId(null);
                    setSelectedTenantName('');
                  }}
                />

                {/* Curfew Reject Modal */}
                <CurfewRejectModal
                  visible={curfewRejectModalVisible}
                  tenantName={pendingCurfewRequests?.find((r: any) => r.id === tenantToReject)?.name}
                  onClose={() => {
                    setCurfewRejectModalVisible(false);
                    setTenantToReject(null);
                  }}
                  onSubmit={handleRejectCurfewSubmit}
                  loading={rejectCurfewMutation.isPending}
                />
              </>
            )}
          </>
        )}

        {/* General Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {requestsLoading ? (
              <LoadingSpinner message="Loading requests..." />
            ) : (
              <>
                {/* Statistics */}
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-500">
                        {pendingRequests?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Pending Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-500">
                        {pendingRequests?.filter(r => r.requestType === 'REPAIR').length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Repair Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-500">
                        {pendingRequests?.filter(r => r.requestType === 'OTHER').length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Other Requests</div>
                    </div>
                  </div>
                </Card>

                {/* Requests List */}
                <div className="space-y-3">
                  {(pendingRequests?.length || 0) === 0 ? (
                    <Card>
                      <Empty
                        description="No pending requests"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </Card>
                  ) : (
                    pendingRequests?.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageErrorBoundary>
  );
};