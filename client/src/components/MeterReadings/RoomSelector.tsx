import React from 'react';
import { Card, Select } from 'antd';
import { Room } from '@/types';
import { useTranslation } from 'react-i18next';

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
}) => {
  const { t } = useTranslation();
  return (
    <Card title={isAdmin ? `${t('meterReadings.selectRoom')}` : `${t('meterReadings.yourRoom')}`} size="small">
      <Select
        placeholder={isAdmin ? `${t('meterReadings.selectARoom')}` : `${t('meterReadings.yourRoom')}`}
        className="w-full"
        value={selectedRoomId}
        onChange={onRoomChange}
        disabled={!isAdmin}
        loading={!isAdmin && !selectedRoomId && !userRoomId}
      >
        {rooms?.map((room) => (
          <Option key={room.id} value={room.id}>
            {`${t('rooms.room')}`} {room.roomNumber} - {`${t('rooms.floor')}`} {room.floor}
          </Option>
        ))}
      </Select>
      {!isAdmin && !userRoomId && (
        <div className="mt-2 text-sm text-gray-500">
          `${t('meterReadings.userNotAssigned')}`
        </div>
      )}
    </Card>
  );
};
