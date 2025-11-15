import React, { useState } from 'react';
import { Modal, Form, Select, Input, Button, Space, Alert, Tag } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useRoomTenantsQuery, useRequestCurfewOverrideMutation } from '@/hooks/useCurfew';

const { Option } = Select;
const { TextArea } = Input;

interface CurfewOverrideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CurfewOverrideModal: React.FC<CurfewOverrideModalProps> = ({
  visible,
  onClose
}) => {
  const [form] = Form.useForm();
  const { data: roomTenants, isLoading } = useRoomTenantsQuery();
  const requestMutation = useRequestCurfewOverrideMutation();

  const handleSubmit = async (values: any) => {
    try {
      await requestMutation.mutateAsync({
        tenantIds: values.tenantIds,
        reason: values.reason
      });
      form.resetFields();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Request Curfew Override</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Alert
        message="Curfew Policy"
        description="Building curfew is at 12:00 AM (midnight). Override permission is valid until 6:00 AM the next day."
        type="info"
        showIcon
        className="mb-4"
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="tenantIds"
          label="Select Tenants"
          rules={[{ required: true, message: 'Please select at least one tenant' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select tenants who need curfew override"
            loading={isLoading}
            optionFilterProp="children"
          >
            {roomTenants?.map((tenant) => (
              <Option key={tenant.id} value={tenant.id} disabled={tenant.curfewStatus === 'PENDING'}>
                <Space>
                  <UserOutlined />
                  <span>{tenant.name}</span>
                  {tenant.user && <Tag color="blue">Has Account</Tag>}
                  {tenant.curfewStatus === 'APPROVED_PERMANENT' && <Tag color="green">Permanent Approval</Tag>}
                  {tenant.curfewStatus === 'APPROVED_TEMPORARY' && <Tag color="cyan">Approved Until 6 AM</Tag>}
                  {tenant.curfewStatus === 'PENDING' && <Tag color="orange">Pending</Tag>}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason (Optional)"
        >
          <TextArea
            rows={3}
            placeholder="e.g., Late work shift, family emergency, etc."
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={requestMutation.isPending}
            >
              Submit Request
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
