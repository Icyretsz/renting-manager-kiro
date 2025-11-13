import React from 'react';
import { Card, Tag, Typography } from 'antd';
import { HomeOutlined, UserOutlined, DollarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Room } from '@/types';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface RoomCardProps {
  room: Room;
  waterRate: number;
  electricityRate: number;
  trashFee: number;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  waterRate,
  electricityRate,
  trashFee
}) => {
  const { t } = useTranslation()
  const occupancyRate = (room.occupancyCount / room.maxTenants) * 100;
  const isFullyOccupied = room.occupancyCount >= room.maxTenants;

  return (
    <Card
      size="small"
      className="hover:shadow-md transition-shadow"
      actions={[
        <div key="info" className="text-xs text-gray-500">
          <InfoCircleOutlined className="mr-1" />
          {t('rooms.viewDetails')}
        </div>
      ]}
    >
      <div className="space-y-3">
        {/* Room Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <HomeOutlined className="text-lg text-blue-500" />
            <Title level={5} className="mb-0">
              {`${t('rooms.room')}`} {room.roomNumber}
            </Title>
          </div>
          <Text className="text-xs text-gray-600">
            {`${t('rooms.floor')}`} {room.floor}
          </Text>
        </div>

        {/* Occupancy Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserOutlined className="mr-1 text-gray-500" />
            <Text className="text-sm">
              {room.occupancyCount}/{room.maxTenants} {`${t('tenants.title')}`}
            </Text>
          </div>
          <Tag color={isFullyOccupied ? 'red' : occupancyRate > 50 ? 'orange' : 'green'}>
            {isFullyOccupied ? `${t('rooms.full')}` : `${t('rooms.available')}`}
          </Tag>
        </div>

        {/* Rent Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarOutlined className="mr-1 text-gray-500" />
              <Text className="text-sm">{`${t('billing.baseRent')}`}</Text>
            </div>
            <Text className="text-sm font-medium">
              {Number(room.baseRent).toLocaleString() || 'Not set'} VNĐ
            </Text>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>{`${t('rooms.waterFee')}`}:</span>
              <span>{waterRate.toLocaleString()} VNĐ/m³</span>
            </div>
            <div className="flex justify-between">
              <span>{`${t('rooms.electricityRate')}`}:</span>
              <span>{electricityRate.toLocaleString()} VNĐ/kWh</span>
            </div>
            <div className="flex justify-between">
              <span>${`${t('billing.trashFee')}`}:</span>
              <span>{trashFee.toLocaleString()} VNĐ/{`${t('common.month')}`}</span>
            </div>
          </div>
        </div>

        {/* Current Tenants */}
        {room.tenants && room.tenants.length > 0 && (
          <div>
            <Text className="text-xs text-gray-600 font-medium">{`${t('rooms.currentTenants')}`}:</Text>
            <div className="mt-1 space-y-1">
              {room.tenants.slice(0, 2).map((tenant) => (
                <div key={tenant.id} className="text-xs text-gray-700">
                  • {tenant.name}
                </div>
              ))}
              {room.tenants.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{room.tenants.length - 2} {`${t('common.more')}`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
