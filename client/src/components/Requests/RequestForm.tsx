import { Form, Button, Select, Alert, Space, Tag, FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import TextArea from 'antd/es/input/TextArea';
import { SaveOutlined, UserOutlined } from '@ant-design/icons';
import { RoomTenant } from '@/hooks/useCurfew.ts';
import { useState } from 'react';

type FieldType = {
  requestType: string;
  requestDescription?: string;
  curfewReason?: string;
  tenantIds?: string[];
};

interface RequestFormProps {
  roomTenants: RoomTenant[];
  isTenantsLoading: boolean;
  onFinish: (values: FieldType) => void;
  form: FormInstance;
  isRequestMutationPending: boolean;
}

const RequestForm = ({
  roomTenants,
  isTenantsLoading,
  onFinish,
  form,
  isRequestMutationPending,
}: RequestFormProps) => {
  const { t } = useTranslation();
  const [requestType, setRequestType] = useState<
    'curfew' | 'repair' | 'other' | ''
  >('');
  const { Option } = Select;

  return (
    <>
      <Form onFinish={onFinish} form={form}>
        <Form.Item
          name="requestType"
          label={t('request.request')}
          rules={[
            { required: true, message: t('request.emptyRequestTypeError') },
          ]}
        >
          <Select
            className="w-full"
            placeholder={t('request.chooseRequest')}
            options={[
              { value: 'curfew', label: <span>{`${t('request.curfewRequest')}`}</span> },
              { value: 'repair', label: <span>{`${t('request.repairRequest')}`}</span> },
              { value: 'other', label: <span>{`${t('request.otherRequest')}`}</span> },
            ]}
            value={requestType}
            onChange={e => {
              setRequestType(e);
            }}
          />
        </Form.Item>

        {requestType !== 'curfew' && requestType !== '' && (
          <Form.Item
            name="requestDescription"
            label={t('request.requestDescription')}
          >
            <TextArea
              className="w-full"
              placeholder={t('request.descriptionPlaceholder')}
            />
          </Form.Item>
        )}

        {requestType === 'curfew' && (
          <>
            <Alert
              message={t('curfew.policy')}
              description={t('curfew.policyDescription')}
              type="info"
              showIcon
              className="mb-4"
            />

            <Form.Item
              name="tenantIds"
              label={t('curfew.selectTenants')}
              rules={[
                { required: true, message: t('curfew.selectAtLeastOne') },
              ]}
            >
              <Select
                mode="multiple"
                placeholder={t('curfew.selectTenantsPlaceholder')}
                loading={isTenantsLoading}
                optionFilterProp="children"
              >
                {roomTenants?.map(tenant => {
                  // Only allow NORMAL status to be selected
                  const isSelectable = tenant.curfewStatus === 'NORMAL';

                  return (
                    <Option
                      key={tenant.id}
                      value={tenant.id}
                      disabled={!isSelectable}
                    >
                      <Space>
                        <UserOutlined />
                        <span>{tenant.name}</span>
                        {tenant.user && (
                          <Tag color="blue">{t('curfew.hasAccount')}</Tag>
                        )}
                        {tenant.curfewStatus === 'APPROVED_PERMANENT' && (
                          <Tag color="green">
                            {t('curfew.permanentApproval')}
                          </Tag>
                        )}
                        {tenant.curfewStatus === 'APPROVED_TEMPORARY' && (
                          <Tag color="cyan">{t('curfew.approvedUntil6AM')}</Tag>
                        )}
                        {tenant.curfewStatus === 'PENDING' && (
                          <Tag color="orange">
                            {t('curfew.pendingApproval')}
                          </Tag>
                        )}
                      </Space>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>

            <Form.Item name="curfewReason" label={t('curfew.reasonOptional')}>
              <TextArea
                rows={3}
                placeholder={t('curfew.reasonPlaceholder')}
                maxLength={200}
                showCount
              />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            className="w-full"
            size="large"
            disabled={requestType === ''}
            loading={isRequestMutationPending}
          >
              {`${t('request.title')}`}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default RequestForm;
