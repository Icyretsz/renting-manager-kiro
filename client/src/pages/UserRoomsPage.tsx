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
import { useSettingValue } from '@/hooks/useSettings';
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

  // Get utility rates from settings
  const waterRate = useSettingValue('water_rate', 22000);
  const electricityRate = useSettingValue('electricity_rate', 3500);
  const trashFee = useSettingValue('trash_fee', 52000);

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
            <div className="flex items-center justify-center gap-2 mb-1">
              <HomeOutlined className="text-lg text-blue-500" />
              <Title level={5} className="mb-0">
                Room {room.roomNumber}
              </Title>
            </div>
            <Text className="text-xs text-gray-600">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarOutlined className="mr-1 text-gray-500" />
                <Text className="text-sm">Base Rent</Text>
              </div>
              <Text className="text-sm font-medium">
                {Number(room.baseRent).toLocaleString() || 'Not set'} VNĐ
              </Text>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Water:</span>
                <span>{waterRate.toLocaleString()} VNĐ/m³</span>
              </div>
              <div className="flex justify-between">
                <span>Electricity:</span>
                <span>{electricityRate.toLocaleString()} VNĐ/kWh</span>
              </div>
              <div className="flex justify-between">
                <span>Trash:</span>
                <span>{trashFee.toLocaleString()} VNĐ/month</span>
              </div>
            </div>
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
    // console.log(room)

    return (
      <div className="space-y-2">
        {/* Room Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
              <div className='font-bold text-xl'>
                Room {room.roomNumber} (Floor {room.floor})
              </div>
          </div>
        </div>

        {/* Room Details Cards */}
        <Row gutter={[24, 24]}>
          {/* Occupancy Info */}
          <Col xs={24} sm={12}>
            <Card>
              <div className="text-center">
                
                <Title level={4} className="mb-2 flex justify-center items-center gap-2">
                  <UserOutlined className="text-3xl text-blue-500" />
                  Occupancy
                </Title>
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
                <Title level={4} className="mb-2 flex justify-center items-center gap-2">
                  <DollarOutlined className="text-3xl text-green-500" />
                  Pricing Information
                </Title>
                
                {/* Base Rent */}
                <div className="mb-4">
                  <Text className="text-2xl font-bold text-green-600">
                    {Number(room.baseRent).toLocaleString() || 'Not set'} VNĐ
                  </Text>
                  <div className="text-sm text-gray-600">Base Rent (Monthly)</div>
                </div>

                <Divider className="my-3" />

                {/* Utility Rates */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <Text className="text-sm text-gray-600">Water Rate:</Text>
                    <Text className="text-sm font-medium">{waterRate.toLocaleString()} VNĐ/m³</Text>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text className="text-sm text-gray-600">Electricity Rate:</Text>
                    <Text className="text-sm font-medium">{electricityRate.toLocaleString()} VNĐ/kWh</Text>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text className="text-sm text-gray-600">Trash Fee:</Text>
                    <Text className="text-sm font-medium">{trashFee.toLocaleString()} VNĐ/month</Text>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-3">
                  * Utility charges based on actual usage
                </div>
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