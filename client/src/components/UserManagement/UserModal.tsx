import React from 'react';
import { Modal, Form, Input, Select, Button, Space } from 'antd';
import { UserWithTenant } from '@/hooks/useUserManagement';

const { Option } = Select;

interface UserModalProps {
  visible: boolean;
  user: UserWithTenant | null;
  form: any;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

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
      style={{ maxWidth: '500px' }}
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
