import React, { useState } from 'react';
import { Card, Row, Col, Typography, Tag, Button, Modal, Divider } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  EditOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRoomsQuery, roomKeys } from '@/hooks/useRooms';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { RefreshButton } from '@/components/Common/RefreshButton';
import { EditRoomModal } from '@/components/Rooms';
import { Room } from '@/types';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export const RoomsPage: React.FC = () => {
  const { data: user } = useUserProfile();
  const isAdmin = () => user?.role === 'ADMIN';
  const { data: rooms, isLoading, error } = useRoomsQuery();
  const { t } = useTranslation();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  if (isLoading) {
    return <LoadingSpinner message={t('rooms.loadingRooms')} />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Text type="danger">{t('rooms.failedToLoad')}</Text>
      </div>
    );
  }

  const floorOneRooms = rooms?.filter(room => room.floor === 1) || [];
  const floorTwoRooms = rooms?.filter(room => room.floor === 2) || [];

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const handleEditRoom = (room: Room, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the room click
    setRoomToEdit(room);
    setEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setRoomToEdit(null);
  };

  const RoomCard: React.FC<{ room: Room }> = ({ room }) => {
    const occupancyRate = (room.occupancyCount / room.maxTenants) * 100;
    const isFullyOccupied = room.occupancyCount >= room.maxTenants;

    return (
      <Card
        size="small"
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleRoomClick(room)}
        actions={isAdmin() ? [
          <EyeOutlined key="view" />,
          <EditOutlined 
            key="edit" 
            onClick={(e) => handleEditRoom(room, e)}
          />,
        ] : [
          <EyeOutlined key="view" />
        ]}
      >
        <div className="text-center">
          <Title level={5} className="mb-1 flex justify-center items-center gap-2">
            <HomeOutlined className="text-2xl text-blue-500" />
            {t('rooms.room')} {room.roomNumber}
          </Title>
          <div className="flex items-center justify-center mb-2">
            <UserOutlined className="mr-1 text-gray-500" />
            <Text className="text-sm">
              {room.occupancyCount}/{room.maxTenants}
            </Text>
          </div>
          <Tag color={isFullyOccupied ? 'red' : occupancyRate > 50 ? 'orange' : 'green'}>
            {isFullyOccupied ? t('rooms.full') : occupancyRate > 50 ? t('rooms.partial') : t('rooms.available')}
          </Tag>
        </div>
      </Card>
    );
  };

  const RoomDetailModal: React.FC = () => (
    <Modal
      title={t('rooms.roomDetails', { number: selectedRoom?.roomNumber })}
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setModalVisible(false)}>
          {t('common.close')}
        </Button>,
        ...(isAdmin() ? [
          <Button 
            key="edit" 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => {
              setModalVisible(false);
              if (selectedRoom) {
                setRoomToEdit(selectedRoom);
                setEditModalVisible(true);
              }
            }}
          >
            {t('rooms.editRoom')}
          </Button>
        ] : [])
      ]}
    >
      {selectedRoom && (
        <div className="space-y-4">
          <div>
            <Text strong>{t('rooms.floor')}:</Text> {selectedRoom.floor}
          </div>
          <div>
            <Text strong>{t('rooms.baseRent')}:</Text> {Number(selectedRoom.baseRent).toLocaleString() || t('rooms.notSet')} VNĐ
          </div>
          <div>
            <Text strong>{t('rooms.occupancy')}:</Text> {selectedRoom.occupancyCount}/{selectedRoom.maxTenants}
          </div>
          
          {selectedRoom.tenants && selectedRoom.tenants.length > 0 && (
            <>
              <Divider />
              <div>
                <Text strong>{t('rooms.currentTenants')}:</Text>
                <div className="mt-2 space-y-2">
                  {selectedRoom.tenants.map((tenant) => (
                    <div key={tenant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        {tenant.email && (
                          <div className="text-sm text-gray-600">{tenant.email}</div>
                        )}
                      </div>
                      {tenant.phone && (
                        <Text className="text-sm text-gray-600">{tenant.phone}</Text>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );

  return (
    <PageErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Title level={3} className="mb-1">{t('rooms.title')}</Title>
            <Text className="text-gray-600">
              {t('rooms.subtitle')}
            </Text>
          </div>
          <RefreshButton
            queryKeys={[roomKeys.all]}
            tooltip={t('common.refreshData')}
          />
        </div>

        {/* Floor 1 */}
        <div>
          <Title level={4} className="mb-3">
            {t('rooms.floor1')}
          </Title>
          <Row gutter={[12, 12]}>
            {floorOneRooms.map((room) => (
              <Col span={8} key={room.id}>
                <RoomCard room={room} />
              </Col>
            ))}
          </Row>
        </div>

        {/* Floor 2 */}
        <div>
          <Title level={4} className="mb-3">
            {t('rooms.floor2')}
          </Title>
          <Row gutter={[12, 12]}>
            {floorTwoRooms.map((room) => (
              <Col span={8} key={room.id}>
                <RoomCard room={room} />
              </Col>
            ))}
          </Row>
        </div>

        <RoomDetailModal />
        
        <EditRoomModal
          room={roomToEdit}
          visible={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setRoomToEdit(null);
          }}
          onSuccess={handleEditSuccess}
        />
      </div>
    </PageErrorBoundary>
  );
};