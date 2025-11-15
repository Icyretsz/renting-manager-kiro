import React from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onSubmit(values.reason || '');
    form.resetFields();
  };

  return (
    <Modal
      title={`${t('curfew.rejectCurfewRequest')}${tenantName ? ` - ${tenantName}` : ''}`}
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
          label={t('curfew.reasonForRejection')}
        >
          <TextArea
            rows={4}
            placeholder={t('curfew.rejectionPlaceholder')}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              danger
              htmlType="submit"
              loading={loading}
            >
              {t('curfew.rejectRequestButton')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
