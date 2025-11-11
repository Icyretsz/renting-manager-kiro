import React from 'react';
import { Modal, Form, Input, Select, Button, Space, Row, Col, DatePicker, Switch } from 'antd';
import { Tenant } from '@/types';
import { Room } from '@/types';

const { Option } = Select;

interface TenantModalProps {
  visible: boolean;
  tenant: Tenant | null;
  form: any;
  rooms: Room[] | undefined;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const TenantModal: React.FC<TenantModalProps> = ({
  visible,
  tenant,
  form,
  rooms,
  loading,
  onClose,
  onSubmit
}) => {
  return (
    <Modal
      title={tenant ? 'Edit Tenant' : 'Create Tenant'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="95%"
      style={{ maxWidth: '600px' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter the full name' }]}
            >
              <Input placeholder="Enter full name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="roomId"
              label="Room"
              rules={[{ required: true, message: 'Please select a room' }]}
            >
              <Select placeholder="Select room">
                {rooms?.map(room => (
                  <Option key={room.id} value={room.id}>
                    Room {room.roomNumber} (Floor {room.floor})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input placeholder="Enter email address" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="phone"
              label="Phone"
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fingerprintId"
              label="Fingerprint ID"
            >
              <Input type="number" placeholder="Enter fingerprint ID" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="permanentAddress"
              label="Permanent Address"
            >
              <Input placeholder="Enter permanent address" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="moveInDate"
              label="Move In Date"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="moveOutDate"
              label="Move Out Date"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="isActive"
          label="Status"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
            >
              {tenant ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
