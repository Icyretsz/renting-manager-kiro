import React from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';

const { TextArea } = Input;

interface CurfewRejectModalProps {
  visible: boolean;
  tenantName?: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}

export const CurfewRejectModal: React.FC<CurfewRejectModalProps> = ({
  visible,
  tenantName,
  onClose,
  onSubmit,
  loading
}) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onSubmit(values.reason || '');
    form.resetFields();
  };

  return (
    <Modal
      title={`Reject Curfew Request${tenantName ? ` - ${tenantName}` : ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="reason"
          label="Reason for Rejection (Optional)"
        >
          <TextArea
            rows={4}
            placeholder="e.g., Insufficient justification, policy violation, etc."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              danger
              htmlType="submit"
              loading={loading}
            >
              Reject Request
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
