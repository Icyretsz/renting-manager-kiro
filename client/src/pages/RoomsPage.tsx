import React, { useState } from 'react';
import { Card, Row, Col, Typography, Tag, Button, Modal, Divider } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  PlusOutlined,
  EditOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useRoomsQuery } from '@/hooks/useRooms';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Room } from '@/types';

const { Title, Text } = Typography;

export const RoomsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: rooms, isLoading, error } = useRoomsQuery();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  if (isLoading) {
    return <LoadingSpinner message="Loading rooms..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Text type="danger">Failed to load rooms</Text>
      </div>
    );
  }

  const floorOneRooms = rooms?.filter(room => room.floor === 1) || [];
  const floorTwoRooms = rooms?.filter(room => room.floor === 2) || [];

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setModalVisible(true);
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
          <EditOutlined key="edit" />,
        ] : [
          <EyeOutlined key="view" />
        ]}
      >
        <div className="text-center">
          <Title level={5} className="mb-1 flex justify-center items-center gap-2">
            <HomeOutlined className="text-2xl text-blue-500" />
            Room {room.roomNumber}
          </Title>
          <div className="flex items-center justify-center mb-2">
            <UserOutlined className="mr-1 text-gray-500" />
            <Text className="text-sm">
              {room.occupancyCount}/{room.maxTenants}
            </Text>
          </div>
          <Tag color={isFullyOccupied ? 'red' : occupancyRate > 50 ? 'orange' : 'green'}>
            {isFullyOccupied ? 'Full' : occupancyRate > 50 ? 'Partial' : 'Available'}
          </Tag>
        </div>
      </Card>
    );
  };

  const RoomDetailModal: React.FC = () => (
    <Modal
      title={`Room ${selectedRoom?.roomNumber} Details`}
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setModalVisible(false)}>
          Close
        </Button>,
        ...(isAdmin() ? [
          <Button key="edit" type="primary" icon={<EditOutlined />}>
            Edit Room
          </Button>
        ] : [])
      ]}
    >
      {selectedRoom && (
        <div className="space-y-4">
          <div>
            <Text strong>Floor:</Text> {selectedRoom.floor}
          </div>
          <div>
            <Text strong>Base Rent:</Text> ₱{selectedRoom.baseRent?.toLocaleString() || 'Not set'}
          </div>
          <div>
            <Text strong>Occupancy:</Text> {selectedRoom.occupancyCount}/{selectedRoom.maxTenants}
          </div>
          
          {selectedRoom.tenants && selectedRoom.tenants.length > 0 && (
            <>
              <Divider />
              <div>
                <Text strong>Current Tenants:</Text>
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
        <div className="flex justify-between items-center">
          <div>
            <Title level={3} className="mb-1">Rooms</Title>
            <Text className="text-gray-600">
              Manage building rooms and occupancy
            </Text>
          </div>
          {isAdmin() && (
            <Button type="primary" icon={<PlusOutlined />} size="small">
              Add Room
            </Button>
          )}
        </div>

        {/* Floor 1 */}
        <div>
          <Title level={4} className="mb-3">
            Floor 1 (Rooms 1-9)
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
            Floor 2 (Rooms 10-18)
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
      </div>
    </PageErrorBoundary>
  );
};