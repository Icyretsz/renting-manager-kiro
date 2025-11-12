import React from 'react';
import { Card, Row, Col, Select, DatePicker, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

interface BillingFiltersProps {
  isAdmin: boolean;
  onStatusChange: (value: string | undefined) => void;
  onRoomChange: (value: number | undefined) => void;
  onFloorChange: (value: number | undefined) => void;
  onMonthChange: (date: any) => void;
  onExport: () => void;
  exportLoading: boolean;
}

export const BillingFilters: React.FC<BillingFiltersProps> = ({
  isAdmin,
  onStatusChange,
  onRoomChange,
  onFloorChange,
  onMonthChange,
  onExport,
  exportLoading
}) => {
  const { t } = useTranslation();
  
  return (
    <Card style={{ marginBottom: '24px' }}>
      <Row gutter={[8, 8]}>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder={t('billing.filterByStatus')}
            style={{ width: '100%' }}
            allowClear
            onChange={onStatusChange}
          >
            <Option value="UNPAID">{t('billing.unpaid')}</Option>
            <Option value="PAID">{t('billing.paid')}</Option>
            <Option value="OVERDUE">{t('billing.overdue')}</Option>
          </Select>
        </Col>
        
        {isAdmin && (
          <>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder={t('billing.filterByRoom')}
                style={{ width: '100%' }}
                allowClear
                onChange={onRoomChange}
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map(roomNum => (
                  <Option key={roomNum} value={roomNum}>{t('rooms.room')} {roomNum}</Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder={t('billing.filterByFloor')}
                style={{ width: '100%' }}
                allowClear
                onChange={onFloorChange}
              >
                <Option value={1}>{t('rooms.floor')} 1</Option>
                <Option value={2}>{t('rooms.floor')} 2</Option>
              </Select>
            </Col>
          </>
        )}
        
        <Col xs={24} sm={12} md={6}>
          <DatePicker
            picker="month"
            placeholder={t('billing.filterByMonth')}
            style={{ width: '100%' }}
            onChange={onMonthChange}
          />
        </Col>
        
        {isAdmin && (
          <Col xs={24} sm={12} md={4}>
            <Button
              icon={<DownloadOutlined />}
              onClick={onExport}
              loading={exportLoading}
              style={{ width: '100%' }}
            >
              {t('billing.exportData')}
            </Button>
          </Col>
        )}
      </Row>
    </Card>
  );
};
