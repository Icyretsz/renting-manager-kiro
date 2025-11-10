import React, { useState } from 'react';
import {
  Card,
  Button,
  Tag,
  Typography,
  Empty,
} from 'antd';
import {
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import {
  useAllReadingsQuery,
  useApproveReadingMutation,
  useRejectReadingMutation,
} from '@/hooks/useMeterReadings';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { MeterReading } from '@/types';
import {
  StatisticsCards,
  FiltersCard,
  ReadingCard,
  ReviewModal
} from '@/components/Approvals';

const { Title, Text } = Typography;

// Utility function to safely convert Prisma Decimal strings to numbers
const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const ApprovalsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [selectedReading, setSelectedReading] = useState<MeterReading | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, _setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());
  const [collapsedStatuses, setCollapsedStatuses] = useState<Set<string>>(new Set());

  const { data: allReadings, isLoading } = useAllReadingsQuery();
  const approveMutation = useApproveReadingMutation();
  const rejectMutation = useRejectReadingMutation();

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

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <Title level={3} className="mb-1">Reading Approvals</Title>
          <Text className="text-gray-600">
            Review and approve meter reading submissions
          </Text>
        </div>

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
      </div>
    </PageErrorBoundary>
  );
};