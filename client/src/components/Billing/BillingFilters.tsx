import React from 'react';
import { Card, Row, Col, Select, DatePicker, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

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
  return (
    <Card style={{ marginBottom: '24px' }}>
      <Row gutter={[8, 8]}>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Payment Status"
            style={{ width: '100%' }}
            allowClear
            onChange={onStatusChange}
          >
            <Option value="UNPAID">Unpaid</Option>
            <Option value="PAID">Paid</Option>
            <Option value="OVERDUE">Overdue</Option>
          </Select>
        </Col>
        
        {isAdmin && (
          <>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="Room"
                style={{ width: '100%' }}
                allowClear
                onChange={onRoomChange}
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map(roomNum => (
                  <Option key={roomNum} value={roomNum}>Room {roomNum}</Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="Floor"
                style={{ width: '100%' }}
                allowClear
                onChange={onFloorChange}
              >
                <Option value={1}>Floor 1</Option>
                <Option value={2}>Floor 2</Option>
              </Select>
            </Col>
          </>
        )}
        
        <Col xs={24} sm={12} md={6}>
          <DatePicker
            picker="month"
            placeholder="Select Month"
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
              Export CSV
            </Button>
          </Col>
        )}
      </Row>
    </Card>
  );
};
