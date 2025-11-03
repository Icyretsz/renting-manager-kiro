import React from 'react';
import { Card, Row, Col, Typography, Tag, Empty } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  DollarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useRoomsQuery } from '@/hooks/useRooms';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Room } from '@/types';

const { Title, Text } = Typography;

export const UserRoomsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: allRooms, isLoading } = useRoomsQuery();

  if (isLoading) {
    return <LoadingSpinner message="Loading your rooms..." />;
  }

  // For regular users, filter rooms they have access to
  // This would typically come from a user-room assignment API
  const userRooms = isAdmin() ? allRooms : allRooms?.slice(0, 3); // Mock: first 3 rooms for demo

  if (!userRooms || userRooms.length === 0) {
    return (
      <PageErrorBoundary>
        <div className="text-center py-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No rooms assigned to you"
          />
        </div>
      </PageErrorBoundary>
    );
  }

  const RoomCard: React.FC<{ room: Room }> = ({ room }) => {
    const occupancyRate = (room.occupancyCount / room.maxTenants) * 100;
    const isFullyOccupied = room.occupancyCount >= room.maxTenants;

    return (
      <Card
        size="small"
        className="hover:shadow-md transition-shadow"
        actions={[
          <div key="info" className="text-xs text-gray-500">
            <InfoCircleOutlined className="mr-1" />
            View Details
          </div>
        ]}
      >
        <div className="space-y-3">
          {/* Room Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <HomeOutlined className="text-2xl text-blue-500" />
            </div>
            <Title level={5} className="mb-1">
              Room {room.roomNumber}
            </Title>
            <Text className="text-sm text-gray-600">
              Floor {room.floor}
            </Text>
          </div>

          {/* Occupancy Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserOutlined className="mr-1 text-gray-500" />
              <Text className="text-sm">
                {room.occupancyCount}/{room.maxTenants} tenants
              </Text>
            </div>
            <Tag color={isFullyOccupied ? 'red' : occupancyRate > 50 ? 'orange' : 'green'}>
              {isFullyOccupied ? 'Full' : occupancyRate > 50 ? 'Partial' : 'Available'}
            </Tag>
          </div>

          {/* Rent Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarOutlined className="mr-1 text-gray-500" />
              <Text className="text-sm">Base Rent</Text>
            </div>
            <Text className="text-sm font-medium">
              ₱{room.baseRent?.toLocaleString() || 'Not set'}
            </Text>
          </div>

          {/* Current Tenants */}
          {room.currentTenants && room.currentTenants.length > 0 && (
            <div>
              <Text className="text-xs text-gray-600 font-medium">Current Tenants:</Text>
              <div className="mt-1 space-y-1">
                {room.currentTenants.slice(0, 2).map((tenant) => (
                  <div key={tenant.id} className="text-xs text-gray-700">
                    • {tenant.name}
                  </div>
                ))}
                {room.currentTenants.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{room.currentTenants.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <Title level={3} className="mb-1">
            {isAdmin() ? 'All Rooms' : 'My Assigned Rooms'}
          </Title>
          <Text className="text-gray-600">
            {isAdmin() 
              ? 'Overview of all building rooms' 
              : 'Rooms you have access to manage'
            }
          </Text>
        </div>

        {/* Rooms Grid */}
        <Row gutter={[16, 16]}>
          {userRooms.map((room) => (
            <Col span={12} key={room.id}>
              <RoomCard room={room} />
            </Col>
          ))}
        </Row>

        {/* Info Card for Regular Users */}
        {!isAdmin() && (
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <InfoCircleOutlined className="text-blue-500 mt-1" />
              <div>
                <Text className="text-sm font-medium text-blue-800">
                  Room Access Information
                </Text>
                <div className="text-xs text-blue-700 mt-1">
                  You can view and manage meter readings, billing information, and tenant details for the rooms assigned to you. Contact your administrator if you need access to additional rooms.
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageErrorBoundary>
  );
};