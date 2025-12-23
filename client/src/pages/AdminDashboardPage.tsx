import React from 'react';
import { Card, Row, Col, Statistic, Typography, Progress, List } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  DollarOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRoomsQuery } from '@/hooks/useRooms';
import { useTenantsQuery } from '@/hooks/useTenants';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

const { Title, Text } = Typography;

export const AdminDashboardPage: React.FC = () => {
  const { data: user } = useUserProfile();
  const isAdmin = () => user?.role === 'ADMIN';
  const { data: rooms, isLoading: roomsLoading } = useRoomsQuery();
  const { data: tenants, isLoading: tenantsLoading } = useTenantsQuery();

  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <Text type="danger">Access denied. Admin privileges required.</Text>
      </div>
    );
  }

  if (roomsLoading || tenantsLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  // Calculate statistics
  const totalRooms = rooms?.length || 0;
  const occupiedRooms = rooms?.filter(room => room.occupancyCount > 0).length || 0;
  const totalTenants = tenants?.filter(tenant => tenant.isActive).length || 0;
  const totalCapacity = rooms?.reduce((sum, room) => sum + room.maxTenants, 0) || 0;
  const occupancyRate = totalCapacity > 0 ? (totalTenants / totalCapacity) * 100 : 0;

  // Mock data for pending items (would come from API)
  const pendingReadings = 3;
  const overduePayments = 2;
  const monthlyRevenue = 1250000; // Mock revenue

  const recentActivities = [
    { id: 1, type: 'reading', message: 'New meter reading submitted for Room 5', time: '2 hours ago' },
    { id: 2, type: 'payment', message: 'Payment received from Room 12', time: '4 hours ago' },
    { id: 3, type: 'tenant', message: 'New tenant added to Room 8', time: '1 day ago' },
    { id: 4, type: 'approval', message: 'Reading approved for Room 3', time: '2 days ago' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reading': return <FileTextOutlined className="text-blue-500" />;
      case 'payment': return <DollarOutlined className="text-green-500" />;
      case 'tenant': return <UserOutlined className="text-purple-500" />;
      case 'approval': return <CheckCircleOutlined className="text-orange-500" />;
      default: return <ClockCircleOutlined className="text-gray-500" />;
    }
  };

  return (
    <PageErrorBoundary>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <Title level={3} className="mb-1">
            Admin Dashboard
          </Title>
          <Text className="text-gray-600">
            Welcome back, {user?.name?.split(' ')[0]}
          </Text>
        </div>

        {/* Key Statistics */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card>
              <Statistic
                title="Total Rooms"
                value={totalRooms}
                prefix={<HomeOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="Occupied Rooms"
                value={occupiedRooms}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="Active Tenants"
                value={totalTenants}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="Monthly Revenue"
                value={monthlyRevenue}
                suffix="VNĐ"
                precision={0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Occupancy Rate */}
        <Card title="Building Occupancy Rate">
          <Progress
            percent={Math.round(occupancyRate)}
            status={occupancyRate > 80 ? 'success' : occupancyRate > 50 ? 'active' : 'normal'}
            strokeColor={occupancyRate > 80 ? '#52c41a' : occupancyRate > 50 ? '#1890ff' : '#faad14'}
          />
          <div className="mt-2 text-sm text-gray-600">
            {totalTenants} of {totalCapacity} total capacity
          </div>
        </Card>

        {/* Pending Actions */}
        <Card title="Pending Actions">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileTextOutlined className="text-2xl text-blue-500 mb-2" />
                <div className="text-lg font-semibold text-blue-600">{pendingReadings}</div>
                <div className="text-sm text-gray-600">Pending Readings</div>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <ExclamationCircleOutlined className="text-2xl text-red-500 mb-2" />
                <div className="text-lg font-semibold text-red-600">{overduePayments}</div>
                <div className="text-sm text-gray-600">Overdue Payments</div>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircleOutlined className="text-2xl text-green-500 mb-2" />
                <div className="text-lg font-semibold text-green-600">
                  {totalRooms - occupiedRooms}
                </div>
                <div className="text-sm text-gray-600">Available Rooms</div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Recent Activities */}
        <Card title="Recent Activities">
          <List
            dataSource={recentActivities}
            renderItem={(activity) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getActivityIcon(activity.type)}
                  title={activity.message}
                  description={activity.time}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </PageErrorBoundary>
  );
};