import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { Button, Card, Form, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import RequestForm from '@/components/Requests/RequestForm.tsx';
import {
  useRequestCurfewOverrideMutation,
  useRoomTenantsQuery,
} from '@/hooks/useCurfew.ts';
import { LoadingSpinner } from '@/components/Loading';
import type { FormProps } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';

type FieldType = {
  requestType: string;
  requestDescription?: string;
  curfewReason?: string;
  tenantIds?: string[];
};

const UserRequestPage = () => {
  const { Title, Text } = Typography;
  const { t } = useTranslation();
  const { data: roomTenants, isLoading: isTenantsLoading } = useRoomTenantsQuery();
  const requestMutation = useRequestCurfewOverrideMutation();
  const [form] = Form.useForm();

  const onFinish: FormProps<FieldType>['onFinish'] = async values => {
    switch (values.requestType) {
      case 'curfew':
        if (!values.tenantIds || values.tenantIds.length === 0) return;
        try {
          await requestMutation.mutateAsync({
            tenantIds: values.tenantIds,
            reason: values.curfewReason,
          });
          form.resetFields();
        } catch (error) {
          // Error handled by mutation
        }
    }
  };

  if (isTenantsLoading) {
    return <LoadingSpinner message={`${t('common.loading')}`} />;
  }

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        <div>
          <Title level={3} className="mb-1">{`${t('request.title')}`}</Title>
          <Text className="text-gray-600">{`${t('request.description')}`}</Text>
        </div>
        <Card size="small">
          <Button
            icon={<HistoryOutlined />}
            className="w-full"
          >
            {`${t('request.viewRequestHistory')}`}
          </Button>
        </Card>
        <Card size="small">
          <RequestForm
            roomTenants={roomTenants ? roomTenants : []}
            isTenantsLoading={isTenantsLoading}
            onFinish={onFinish}
            form={form}
            isRequestMutationPending={requestMutation.isPending}
          />
        </Card>
      </div>
    </PageErrorBoundary>
  );
};

export default UserRequestPage;
