import React from 'react';
import { Card, Row, Col, Divider, Typography } from 'antd';
import { UserOutlined, DollarOutlined } from '@ant-design/icons';
import { RoomDetailsViewProps } from '@/types';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export const RoomDetailsView: React.FC<RoomDetailsViewProps> = ({
  room,
  waterRate,
  electricityRate,
  trashFee
}) => {
  const { t }  = useTranslation()
  return (
    <div className="space-y-2">
      {/* Room Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
          <div className='font-bold text-xl'>
            {`${t('rooms.room')}`} {room.roomNumber} ({`${t('rooms.floor')}`} {room.floor})
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
                {`${t('rooms.occupancy')}`}
              </Title>
              <div className='flex justify-center items-center gap-15'>
                <div className="space-y-2">
                  <Text className="text-2xl font-bold">
                    {room.occupancyCount}/{room.maxTenants}
                  </Text>
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
                            {`${t('tenants.moveInDate')}`}: {new Date(tenant.moveInDate).toLocaleDateString()}
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
                {`${t('rooms.pricingInformation')}`}
              </Title>
              
              {/* Base Rent */}
              <div className="mb-4">
                <Text className="text-2xl font-bold text-green-600">
                  {Number(room.baseRent).toLocaleString() || 'Not set'} VNĐ
                </Text>
                <div className="text-sm text-gray-600">{`${t('billing.baseRent')} (${t('common.month')})`}</div>
              </div>

              <Divider className="my-3" />

              {/* Utility Rates */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <Text className="text-sm text-gray-600">{`${t('rooms.waterRate')}`}:</Text>
                  <Text className="text-sm font-medium">{waterRate.toLocaleString()} VNĐ/m³</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-sm text-gray-600">{`${t('rooms.electricityRate')}`}:</Text>
                  <Text className="text-sm font-medium">{electricityRate.toLocaleString()} VNĐ/kWh</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-sm text-gray-600">{`${t('billing.trashFee')}`}:</Text>
                  <Text className="text-sm font-medium">{trashFee.toLocaleString()} VNĐ/{`${t('common.month')}`}</Text>
                </div>
              </div>

            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
