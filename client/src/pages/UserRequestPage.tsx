import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { Button, Card, Form, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import RequestForm from '@/components/Requests/RequestForm.tsx';
import { RequestHistoryModal } from '@/components/Requests/RequestHistoryModal';
import { useRoomTenantsQuery, useRequestCurfewOverrideMutation } from '@/hooks/useCurfew.ts';
import { LoadingSpinner } from '@/components/Loading';
import type { FormProps } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useCreateRequestMutation } from '@/hooks/useRequests';
import { useAllUserRequestsQuery } from '@/hooks/useAllUserRequests';
import { useState } from 'react';
import { UploadFile } from 'antd/es/upload';
import { useGetPresignedURLMutation, useUploadToS3Mutation } from '@/hooks/useFileUpload';
import { useUserProfile } from '@/hooks/useUserProfile';

type FieldType = {
  requestType: string;
  requestDescription?: string;
  curfewReason?: string;
  tenantIds?: string[];
};

const UserRequestPage = () => {
  const { Title, Text } = Typography;
  const { t } = useTranslation();
  const { data: user } = useUserProfile();
  const { data: roomTenants, isLoading: isTenantsLoading } = useRoomTenantsQuery();
  const createRequestMutation = useCreateRequestMutation();
  const curfewRequestMutation = useRequestCurfewOverrideMutation();
  const { data: allRequests, isLoading: isRequestsLoading } = useAllUserRequestsQuery();
  const [form] = Form.useForm();

  // Modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Photo upload states
  const [repairPhotoList, setRepairPhotoList] = useState<UploadFile[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  
  const getPresignedURLForUpload = useGetPresignedURLMutation();
  const uploadToS3 = useUploadToS3Mutation();

  const handlePhotoUpload = async (file: File): Promise<boolean> => {
    const roomId = user?.tenant?.roomId;
    if (!roomId) {
      console.error('No room ID found');
      return false;
    }

    try {
      // Get presigned URL for upload
      const presignedURL = await getPresignedURLForUpload.mutateAsync({
        operation: 'put',
        roomNumber: roomId.toString(),
        contentType: file.type,
        imageType: 'repair', // Using water as a generic type for requests
        fileName: file.name
      });
      
      if (presignedURL) {
        // Upload to S3
        await uploadToS3.mutateAsync({
          presignedUrl: presignedURL.url,
          file: file
        });
        
        const fileName = presignedURL.fileName;
        
        // Store filename for submission
        setPhotoUrls(prev => [...prev, fileName]);
      }
      
      return false;
    } catch (error) {
      console.error('Photo upload failed:', error);
      return false;
    }
  };

  const onFinish: FormProps<FieldType>['onFinish'] = async values => {
    try {
      if (values.requestType === 'curfew') {
        if (!values.tenantIds || values.tenantIds.length === 0) return;
        
        // Use old curfew route for curfew requests
        await curfewRequestMutation.mutateAsync({
          tenantIds: values.tenantIds,
          reason: values.curfewReason,
        });
      } else if (values.requestType === 'repair') {
        if (!values.requestDescription) return;
        
        // Use new request route for repair requests
        await createRequestMutation.mutateAsync({
          requestType: 'REPAIR',
          description: values.requestDescription,
          photoUrls: photoUrls,
        });
        
        // Reset photo states
        setRepairPhotoList([]);
        setPhotoUrls([]);
      } else if (values.requestType === 'other') {
        if (!values.requestDescription) return;
        
        // Use new request route for other requests
        await createRequestMutation.mutateAsync({
          requestType: 'OTHER',
          description: values.requestDescription,
        });
      }
      
      form.resetFields();
    } catch (error) {
      // Error handled by mutation
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
            onClick={() => setShowHistoryModal(true)}
            loading={isRequestsLoading}
          >
            {`${t('request.viewRequestHistory')}`}
          </Button>
        </Card>

        <RequestHistoryModal
          visible={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          requests={allRequests || []}
          loading={isRequestsLoading}
        />
        <Card size="small">
          <RequestForm
            roomTenants={roomTenants ? roomTenants : []}
            isTenantsLoading={isTenantsLoading}
            onFinish={onFinish}
            form={form}
            isRequestMutationPending={createRequestMutation.isPending || curfewRequestMutation.isPending}
            repairPhotoList={repairPhotoList}
            setRepairPhotoList={setRepairPhotoList}
            onPhotoUpload={handlePhotoUpload}
            uploadLoading={uploadToS3.isPending || getPresignedURLForUpload.isPending}
          />
        </Card>
      </div>
    </PageErrorBoundary>
  );
};

export default UserRequestPage;
