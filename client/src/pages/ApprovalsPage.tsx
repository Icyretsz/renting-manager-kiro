import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Image,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Divider,
  Timeline,
  Select,
  Input,
  message,
  Popconfirm,
  Empty,
  List,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  FilterOutlined,
  SearchOutlined,
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

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// Utility function to safely convert Prisma Decimal strings to numbers
const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const ApprovalsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [selectedReading, setSelectedReading] = useState<MeterReading | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');

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

  if (isLoading) {
    return <LoadingSpinner message="Loading readings..." />;
  }

  // Filter and sort readings based on status and search
  const filteredReadings = allReadings?.filter((reading) => {
    const matchesStatus = filterStatus === 'all' || reading.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = searchText === '' || 
      reading.room?.roomNumber.toString().includes(searchText) ||
      `${reading.month}/${reading.year}`.includes(searchText);
    return matchesStatus && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      case 'room':
        return (a.room?.roomNumber || 0) - (b.room?.roomNumber || 0);
      case 'amount':
        return toNumber(b.totalAmount || 0) - toNumber(a.totalAmount || 0);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
  }) || [];

  // Calculate statistics from all readings
  const pendingCount = allReadings?.filter(r => r.status.toLowerCase() === 'pending').length || 0;
  const totalCount = allReadings?.length || 0;
  const approvedTodayCount = allReadings?.filter(r => 
    r.status.toLowerCase() === 'approved' && 
    r.approvedAt && 
    new Date(r.approvedAt).toDateString() === new Date().toDateString()
  ).length || 0;

  const handleReviewReading = (reading: MeterReading) => {
    console.log(reading)
    setSelectedReading(reading);
    setReviewModalVisible(true);
  };

  const handleApprove = async (readingId: string) => {
    try {
      await approveMutation.mutateAsync(readingId);
      message.success('Reading approved successfully');
      setReviewModalVisible(false);
    } catch (error) {
      message.error('Failed to approve reading');
    }
  };

  const handleReject = async (readingId: string) => {
    try {
      await rejectMutation.mutateAsync(readingId);
      message.success('Reading rejected successfully');
      setReviewModalVisible(false);
    } catch (error) {
      message.error('Failed to reject reading');
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

        {/* Statistics */}
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Pending Approvals"
                value={pendingCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Submissions"
                value={totalCount}
                valueStyle={{ color: '#1890ff' }}
                prefix={<EyeOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Approved Today"
                value={approvedTodayCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card size="small">
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Space className="w-full">
                <FilterOutlined />
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: 120 }}
                >
                  <Option value="all">All Status</Option>
                  <Option value="PENDING">Pending</Option>
                  <Option value="APPROVED">Approved</Option>
                  <Option value="REJECTED">Rejected</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={8} className="mt-2 sm:mt-0">
              <Search
                placeholder="Search by room or period..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} className="mt-2 sm:mt-0">
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: '100%' }}
                placeholder="Sort by..."
              >
                <Option value="date">Latest First</Option>
                <Option value="room">Room Number</Option>
                <Option value="amount">Amount</Option>
                <Option value="status">Status</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Results Count */}
        {filteredReadings.length > 0 && (
          <div className="text-sm text-gray-600 px-2">
            Showing {filteredReadings.length} reading{filteredReadings.length !== 1 ? 's' : ''}
            {filterStatus !== 'all' && ` (${filterStatus.toLowerCase()} only)`}
          </div>
        )}

        {/* Readings List */}
        <div className="space-y-3">
          {filteredReadings.length === 0 ? (
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
            filteredReadings.map((reading) => (
              <Card key={reading.id} className="hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">
                        Room {reading.room?.roomNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Floor {reading.room?.floor} • {reading.month}/{reading.year}
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
                      onClick={() => handleReviewReading(reading)}
                    >
                      Review
                    </Button>
                    
                    {reading.status.toLowerCase() === 'pending' && (
                      <Space>
                        <Popconfirm
                          title="Approve this reading?"
                          description="This action cannot be undone."
                          onConfirm={() => handleApprove(reading.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            size="small"
                            loading={approveMutation.isPending}
                            className="bg-green-500 hover:bg-green-600 border-green-500"
                          >
                            Approve
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title="Reject this reading?"
                          description="The tenant will need to resubmit."
                          onConfirm={() => handleReject(reading.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            size="small"
                            loading={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                        </Popconfirm>
                      </Space>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Review Modal */}
        <Modal
          title={`Review Reading - Room ${selectedReading?.room?.roomNumber}`}
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          width={800}
          footer={
            selectedReading?.status.toLowerCase() === 'pending' ? [
              <Button key="cancel" onClick={() => setReviewModalVisible(false)}>
                Cancel
              </Button>,
              <Popconfirm
                key="reject"
                title="Reject this reading?"
                description="The tenant will need to resubmit."
                onConfirm={() => selectedReading && handleReject(selectedReading.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={rejectMutation.isPending}
                >
                  Reject
                </Button>
              </Popconfirm>,
              <Popconfirm
                key="approve"
                title="Approve this reading?"
                description="This action cannot be undone."
                onConfirm={() => selectedReading && handleApprove(selectedReading.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={approveMutation.isPending}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Approve
                </Button>
              </Popconfirm>,
            ] : [
              <Button key="close" onClick={() => setReviewModalVisible(false)}>
                Close
              </Button>,
            ]
          }
        >
          {selectedReading && (
            <div className="space-y-4">
              {/* Reading Details */}
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="Current Readings">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Water:</span>
                        <span className="font-medium text-cyan-600">
                          {toNumber(selectedReading.waterReading)} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Electricity:</span>
                        <span className="font-medium text-blue-600">
                          {toNumber(selectedReading.electricityReading)} units
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
                        <span>{toNumber(selectedReading.baseRent).toLocaleString()} VNĐ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trash Fee:</span>
                        <span>{toNumber(selectedReading.trashFee).toLocaleString()} VNĐ</span>
                      </div>
                      <Divider className="my-2" />
                      <div className="flex justify-between font-medium text-green-600">
                        <span>Total:</span>
                        <span>{toNumber(selectedReading.totalAmount || 0).toLocaleString()} VNĐ</span>
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
                      {selectedReading.waterPhotoUrl ? (
                        <Image
                          src={selectedReading.waterPhotoUrl}
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
                      {selectedReading.electricityPhotoUrl ? (
                        <Image
                          src={selectedReading.electricityPhotoUrl}
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
              {selectedReading.modifications && selectedReading.modifications.length > 0 && (
                <Card size="small" title={<><HistoryOutlined /> Modification History</>}>
                  <Timeline
                    items={selectedReading.modifications.map((mod) => ({
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
                            By {mod.modifier?.tenant?.name || 'Unknown'} on {new Date(mod.modifiedAt).toLocaleString()}
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
                    <span className="font-medium">{selectedReading.month}/{selectedReading.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Submitted:</span>
                    <span>{new Date(selectedReading.submittedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Tag color={getStatusColor(selectedReading.status)}>
                      {selectedReading.status.toUpperCase()}
                    </Tag>
                  </div>
                  {selectedReading.approvedAt && (
                    <div className="flex justify-between">
                      <span>Approved:</span>
                      <span>{new Date(selectedReading.approvedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </PageErrorBoundary>
  );
};