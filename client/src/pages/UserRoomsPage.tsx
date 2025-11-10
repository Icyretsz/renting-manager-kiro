import React from 'react';
import { Card, Row, Col, Typography, Empty } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useRoomsQuery, useRoomQuery } from '@/hooks/useRooms';
import { useSettingValue } from '@/hooks/useSettings';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { RoomCard, RoomDetailsView } from '@/components/UserRooms';

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
                <RoomCard
                  room={room}
                  waterRate={waterRate}
                  electricityRate={electricityRate}
                  trashFee={trashFee}
                />
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
        <RoomDetailsView
          room={userRoomDetails}
          waterRate={waterRate}
          electricityRate={electricityRate}
          trashFee={trashFee}
        />

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