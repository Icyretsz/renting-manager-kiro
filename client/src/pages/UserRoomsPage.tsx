import React from 'react';
import { Row, Col, Typography, Empty } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRoomsQuery, useRoomQuery, roomKeys } from '@/hooks/useRooms';
import { useSettingValue } from '@/hooks/useSettings';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { RefreshButton } from '@/components/Common/RefreshButton';
import { RoomCard, RoomDetailsView } from '@/components/UserRooms';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export const UserRoomsPage: React.FC = () => {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading: auth0Loading } = useAuth0();
  const { data: user, isLoading: profileLoading } = useUserProfile();
  const isAdmin = () => user?.role === 'ADMIN';
  const isLoading = auth0Loading || (isAuthenticated && profileLoading);
  const { data: allRooms, isLoading: roomsLoading } = useRoomsQuery();
  
  // For regular users, fetch detailed room data if they have a tenant room
  const userRoomId = user?.tenant?.roomId;
  const { data: userRoomDetails, isLoading: userRoomLoading } = useRoomQuery(userRoomId || 0);

  // Get utility rates from settings
  const waterRate = useSettingValue('water_rate', 22000);
  const electricityRate = useSettingValue('electricity_rate', 3500);
  const trashFee = useSettingValue('trash_fee', 52000);

  if (isLoading || roomsLoading || (!isAdmin() && userRoomId && userRoomLoading)) {
    return <LoadingSpinner message={`${t('rooms.loadingRooms')}`} />;
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
              description={`${t('rooms.failedToLoad')}`}
            />
          </div>
        </PageErrorBoundary>
      );
    }

    return (
      <PageErrorBoundary>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <Title level={3} className="mb-1">{`${t('billing.allRooms')}`}</Title>
              <Text className="text-gray-600">{`${t('billing.subtitle')}`}</Text>
            </div>
            <RefreshButton
              queryKeys={[roomKeys.all]}
            />
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
            description={`${t('tenants.tenantNotAssigned')}`}
          />
        </div>
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between">
          <div>
            <Title level={3} className="mb-1">{`${t('meterReadings.yourRoom')}`}</Title>
            {/* <Text className="text-gray-600">Your assigned room as a tenant</Text> */}
          </div>
          <RefreshButton
            queryKeys={[roomKeys.all]}
          />
        </div>

        {/* Single room detailed view */}
        <RoomDetailsView
          room={userRoomDetails}
          waterRate={waterRate}
          electricityRate={electricityRate}
          trashFee={trashFee}
        />

        {/* Info Card for Regular Users */}
        {/*<Card className="bg-blue-50 border-blue-200">*/}
        {/*  <div className="flex items-start space-x-3">*/}
        {/*    <InfoCircleOutlined className="text-blue-500 mt-1" />*/}
        {/*    <div>*/}
        {/*      <Text className="text-sm font-medium text-blue-800">*/}
        {/*        Room Access Information*/}
        {/*      </Text>*/}
        {/*      <div className="text-xs text-blue-700 mt-1">*/}
        {/*        You can view and manage meter readings, billing information, and tenant details for your assigned room. Contact your administrator if you need access to additional rooms.*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</Card>*/}
      </div>
    </PageErrorBoundary>
  );
};