import React from 'react';
import { Modal, Form, Input, Select, Button, Space, InputNumber, Alert, Divider } from 'antd';
import { UserModalProps } from '@/types';

const { Option } = Select;

export const UserModal: React.FC<UserModalProps> = ({
  visible,
  user,
  form,
  loading,
  onClose,
  onSubmit
}) => {
  return (
    <Modal
      title={user ? 'Edit User' : 'Create User'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: '600px' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter the full name' }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter the email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'Please select a role' }]}
        >
          <Select placeholder="Select role">
            <Option value="USER">User</Option>
            <Option value="ADMIN">Admin</Option>
          </Select>
        </Form.Item>

        <Divider>Meter Reading Submission Settings</Divider>

        <Alert
          message="Reading Submission Window"
          description="Set the day of month when users can start submitting readings and the deadline. Leave empty for no restrictions."
          type="info"
          showIcon
          className="mb-4"
        />

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="readingsSubmitDate"
            label="Submit Start Date"
            tooltip="Day of month (1-31) when user can start submitting readings"
          >
            <InputNumber
              placeholder="e.g., 1"
              min={1}
              max={31}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="readingsSubmitDueDate"
            label="Submit Due Date"
            tooltip="Day of month (1-31) deadline for submitting readings"
          >
            <InputNumber
              placeholder="e.g., 5"
              min={1}
              max={31}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {user ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
