import React from 'react';
import { Card, Row, Col, Typography, Tag, Empty, Divider } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  DollarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useRoomsQuery, useRoomQuery } from '@/hooks/useRooms';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Room } from '@/types';

const { Title, Text } = Typography;

export const UserRoomsPage: React.FC = () => {
  const { isAdmin, user, isLoading: authLoading } = useAuth();
  const { data: allRooms, isLoading: roomsLoading } = useRoomsQuery();
  
  // For regular users, fetch detailed room data if they have a tenant room
  const userRoomId = user?.tenant?.roomId;
  const { data: userRoomDetails, isLoading: userRoomLoading } = useRoomQuery(userRoomId || 0);

  if (authLoading || roomsLoading || (!isAdmin() && userRoomId && userRoomLoading)) {
    return <LoadingSpinner message="Loading room information..." />;
  }

  // console.log(user)

  // Room card component for admin view
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
          {room.tenants && room.tenants.length > 0 && (
            <div>
              <Text className="text-xs text-gray-600 font-medium">Current Tenants:</Text>
              <div className="mt-1 space-y-1">
                {room.tenants.slice(0, 2).map((tenant) => (
                  <div key={tenant.id} className="text-xs text-gray-700">
                    • {tenant.name}
                  </div>
                ))}
                {room.tenants.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{room.tenants.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Detailed room view component for regular users
  const RoomDetailsView: React.FC<{ room: Room }> = ({ room }) => {
    const occupancyRate = (room.occupancyCount / room.maxTenants) * 100;
    const isFullyOccupied = room.occupancyCount >= room.maxTenants;

    console.log(room)

    return (
      <div className="space-y-6">
        {/* Room Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <HomeOutlined className="text-6xl text-blue-500" />
          </div>
          <Title level={2} className="mb-2">
            Room {room.roomNumber}
          </Title>
          <Text className="text-lg text-gray-600">
            Floor {room.floor}
          </Text>
        </div>

        {/* Room Details Cards */}
        <Row gutter={[24, 24]}>
          {/* Occupancy Info */}
          <Col xs={24} sm={12}>
            <Card>
              <div className="text-center">
                <UserOutlined className="text-3xl text-blue-500 mb-1" />
                <Title level={4} className="mb-2">Occupancy</Title>
                <div className='flex justify-center items-center gap-15'>
                  <div className="space-y-2">
                    <Text className="text-2xl font-bold">
                      {room.occupancyCount}/{room.maxTenants}
                    </Text>
                    {/* <div>
                      <Tag 
                        color={isFullyOccupied ? 'red' : occupancyRate > 50 ? 'orange' : 'green'}
                        className="text-sm"
                      >
                        {isFullyOccupied ? 'Full' : occupancyRate > 50 ? 'Partial' : 'Available'}
                      </Tag>
                    </div> */}
                  </div>
                  <Divider type="vertical" />
                  <div>
                    {room.tenants.map((tenant) => (
                      <div key={tenant.id} className="flex text-start space-x-3 p-1 bg-gray-50 rounded-lg">
                        <UserOutlined className="text-gray-500" />
                        <div>
                          <Text className="font-medium">{tenant.name}</Text>
                          {tenant.moveInDate && (
                            <div className="text-xs text-gray-500">
                              Moved in: {new Date(tenant.moveInDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Rent Info */}
          <Col xs={24} sm={12}>
            <Card>
              <div className="text-center">
                <DollarOutlined className="text-3xl text-green-500 mb-3" />
                <Title level={4} className="mb-2">Base Rent</Title>
                <Text className="text-2xl font-bold text-green-600">
                  {Number(room.baseRent).toLocaleString() || 'Not set'} VNĐ
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Current Tenants */}
        {/* {room.tenants && room.tenants.length > 0 && (
          <Card>
            <Title level={4} className="mb-4">Current Tenants</Title>
            <div className="space-y-3">
              {room.tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <UserOutlined className="text-gray-500" />
                  <div>
                    <Text className="font-medium">{tenant.name}</Text>
                    {tenant.email && (
                      <div className="text-sm text-gray-600">{tenant.email}</div>
                    )}
                    {tenant.moveInDate && (
                      <div className="text-xs text-gray-500">
                        Moved in: {new Date(tenant.moveInDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )} */}
      </div>
    );
  };

  // Admin view: Show all rooms as cards
  if (isAdmin()) {
    const userRooms = allRooms || [];
    
    if (userRooms.length === 0) {
      return (
        <PageErrorBoundary>
          <div className="text-center py-8">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No rooms found"
            />
          </div>
        </PageErrorBoundary>
      );
    }

    return (
      <PageErrorBoundary>
        <div className="space-y-4">
          {/* Header */}
          <div>
            <Title level={3} className="mb-1">All Rooms</Title>
            <Text className="text-gray-600">Overview of all building rooms</Text>
          </div>

          {/* Rooms Grid */}
          <Row gutter={[16, 16]}>
            {userRooms.map((room) => (
              <Col span={12} key={room.id}>
                <RoomCard room={room} />
              </Col>
            ))}
          </Row>
        </div>
      </PageErrorBoundary>
    );
  }

  // Regular user view: Show single room details directly
  if (!userRoomDetails) {
    return (
      <PageErrorBoundary>
        <div className="text-center py-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="You are not assigned to any room as a tenant"
          />
        </div>
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <Title level={3} className="mb-1">My Room</Title>
          <Text className="text-gray-600">Your assigned room as a tenant</Text>
        </div>

        {/* Single room detailed view */}
        <RoomDetailsView room={userRoomDetails} />

        {/* Info Card for Regular Users */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <InfoCircleOutlined className="text-blue-500 mt-1" />
            <div>
              <Text className="text-sm font-medium text-blue-800">
                Room Access Information
              </Text>
              <div className="text-xs text-blue-700 mt-1">
                You can view and manage meter readings, billing information, and tenant details for your assigned room. Contact your administrator if you need access to additional rooms.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageErrorBoundary>
  );
};