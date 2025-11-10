import React from 'react';
import { Card, Select } from 'antd';
import { Room } from '@/types';

const { Option } = Select;

interface RoomSelectorProps {
  rooms: Room[] | undefined;
  selectedRoomId: number | null;
  onRoomChange: (roomId: number) => void;
  isAdmin: boolean;
  userRoomId?: number;
  loading?: boolean;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({
  rooms,
  selectedRoomId,
  onRoomChange,
  isAdmin,
  userRoomId,
  loading
}) => {
  return (
    <Card title={isAdmin ? "Select Room" : "Your Room"} size="small">
      <Select
        placeholder={isAdmin ? "Choose a room" : "Your assigned room"}
        className="w-full"
        value={selectedRoomId}
        onChange={onRoomChange}
        disabled={!isAdmin}
        loading={!isAdmin && !selectedRoomId && !userRoomId}
      >
        {rooms?.map((room) => (
          <Option key={room.id} value={room.id}>
            Room {room.roomNumber} - Floor {room.floor}
          </Option>
        ))}
      </Select>
      {!isAdmin && !userRoomId && (
        <div className="mt-2 text-sm text-gray-500">
          You are not assigned to any room as a tenant. Contact your administrator.
        </div>
      )}
    </Card>
  );
};
