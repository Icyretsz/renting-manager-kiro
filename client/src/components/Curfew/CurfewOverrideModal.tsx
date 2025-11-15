import React from 'react';
import { Modal, Form, Select, Input, Button, Space, Alert, Tag } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          <span>{t('curfew.modalTitle')}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Alert
        message={t('curfew.policy')}
        description={t('curfew.policyDescription')}
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
          label={t('curfew.selectTenants')}
          rules={[{ required: true, message: t('curfew.selectAtLeastOne') }]}
        >
          <Select
            mode="multiple"
            placeholder={t('curfew.selectTenantsPlaceholder')}
            loading={isLoading}
            optionFilterProp="children"
          >
            {roomTenants?.map((tenant) => (
              <Option key={tenant.id} value={tenant.id} disabled={tenant.curfewStatus === 'PENDING'}>
                <Space>
                  <UserOutlined />
                  <span>{tenant.name}</span>
                  {tenant.user && <Tag color="blue">{t('curfew.hasAccount')}</Tag>}
                  {tenant.curfewStatus === 'APPROVED_PERMANENT' && <Tag color="green">{t('curfew.permanentApproval')}</Tag>}
                  {tenant.curfewStatus === 'APPROVED_TEMPORARY' && <Tag color="cyan">{t('curfew.approvedUntil6AM')}</Tag>}
                  {tenant.curfewStatus === 'PENDING' && <Tag color="orange">{t('curfew.pendingApproval')}</Tag>}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="reason"
          label={t('curfew.reasonOptional')}
        >
          <TextArea
            rows={3}
            placeholder={t('curfew.reasonPlaceholder')}
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={requestMutation.isPending}
            >
              {t('curfew.submitRequest')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
