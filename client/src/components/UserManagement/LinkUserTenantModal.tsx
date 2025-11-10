import React from 'react';
import { Modal, Form, Input, Select, Button, Space } from 'antd';
import { UserWithTenant } from '@/hooks/useUserManagement';
import { Tenant } from '@/types';

const { Option } = Select;

interface LinkUserTenantModalProps {
  visible: boolean;
  user: UserWithTenant | null;
  availableTenants: Tenant[];
  form: any;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const LinkUserTenantModal: React.FC<LinkUserTenantModalProps> = ({
  visible,
  user,
  availableTenants,
  form,
  loading,
  onClose,
  onSubmit
}) => {
  return (
    <Modal
      title="Link User to Tenant"
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
          name="userId"
          label="User"
        >
          <Input disabled value={user?.name} />
        </Form.Item>

        <Form.Item
          name="tenantId"
          label="Tenant"
          rules={[{ required: true, message: 'Please select a tenant' }]}
        >
          <Select placeholder="Select tenant to link">
            {availableTenants.map(tenant => (
              <Option key={tenant.id} value={tenant.id}>
                {tenant.name} - Room {tenant.roomId}
              </Option>
            ))}
          </Select>
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
              Link
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
