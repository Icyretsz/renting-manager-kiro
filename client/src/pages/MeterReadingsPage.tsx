import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Typography, Alert } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useRoomsQuery, useRoomQuery } from '@/hooks/useRooms';
import { useMeterReadingsQuery, useSubmitMeterReadingMutation, useUpdateMeterReadingMutation } from '@/hooks/useMeterReadings';
import { useSettingValue } from '@/hooks/useSettings';
import { useGetPresignedURLMutation, useGetPresignedURLQuery, useUploadToS3Mutation } from '@/hooks/useFileUpload';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { RefreshButton } from '@/components/Common/RefreshButton';
import {
  ReadingHistoryModal,
  RoomSelector,
  CurrentMonthReadingCard,
  PreviousReadingCard,
  MeterReadingForm
} from '@/components/MeterReadings';
import { UploadFile } from 'antd/es/upload';
import { meterReadingKeys } from '@/hooks/useMeterReadings';
import { roomKeys } from '@/hooks/useRooms';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const MeterReadingsPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { data: rooms } = useRoomsQuery();
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const waterRate = useSettingValue('water_rate', 22000);
  const electricityRate = useSettingValue('electricity_rate', 3500);
  const trashFee = useSettingValue('trash_fee', 52000);

  const userRoomId = user?.tenant?.roomId;
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    !isAdmin() && userRoomId ? userRoomId : null
  );
  
  // Store filenames only (what goes to DB)
  const [waterPhotoName, setWaterPhotoName] = useState<string>('');
  const [electricityPhotoName, setElectricityPhotoName] = useState<string>('');
  
  // Store file lists for Ant Design Upload component
  const [waterPhotoList, setWaterPhotoList] = useState<UploadFile[]>([]);
  const [electricityPhotoList, setElectricityPhotoList] = useState<UploadFile[]>([]);
  
  const [calculatedBill, setCalculatedBill] = useState({
    totalBill: 0, electricityUsage: 0, waterUsage: 0, waterBill: 0, electricityBill: 0
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const { data: readings, isLoading: readingLoading } = useMeterReadingsQuery(selectedRoomId || 0);
  const { data: currentRoom } = useRoomQuery(selectedRoomId || 0);

  const previousReading = readings?.find(r => r.status === 'APPROVED') || null;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentMonthReadings = readings?.filter(r => r.month === currentMonth && r.year === currentYear) || [];

  const currentMonthReading = currentMonthReadings.find(r => r.status === 'APPROVED') ||
    currentMonthReadings.find(r => r.status === 'PENDING' && (!isAdmin() ? r.submittedBy === user?.id : true)) ||
    currentMonthReadings.filter(r => r.status === 'REJECTED').sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

  const canEditCurrentReading = currentMonthReading &&
    currentMonthReading.status === 'PENDING' &&
    (!isAdmin() ? currentMonthReading.submittedBy === user?.id : true);

  const canAdminOverride = isAdmin() && currentMonthReading && currentMonthReading.status === 'APPROVED';

  const hasApprovedReading = currentMonthReadings.some(r => r.status === 'APPROVED');
  const hasPendingReading = currentMonthReadings.some(r => r.status === 'PENDING' && (!isAdmin() ? r.submittedBy === user?.id : true));
  const canCreateNewReading = !hasApprovedReading && !hasPendingReading;

  const getPresignedURLForUpload = useGetPresignedURLMutation(); // For PUT operations
  const uploadToS3 = useUploadToS3Mutation();
  const submitMutation = useSubmitMeterReadingMutation();
  const updateMutation = useUpdateMeterReadingMutation();

  const availableRooms = isAdmin()
    ? rooms
    : (userRoomId && rooms ? rooms.filter(room => room.id === userRoomId) : []);

  useEffect(() => {
    if (!isAdmin() && userRoomId && !selectedRoomId) {
      setSelectedRoomId(userRoomId);
    }
  }, [isAdmin, userRoomId, selectedRoomId]);

  // Fetch presigned URLs for existing photos using queries (with caching)
  const waterPhotoParams = currentMonthReading?.waterPhotoUrl && selectedRoomId && (canEditCurrentReading || canAdminOverride) ? {
    operation: 'get' as const,
    roomNumber: selectedRoomId.toString(),
    contentType: undefined,
    meterType: 'water' as const,
    fileName: currentMonthReading.waterPhotoUrl
  } : null;

  const electricityPhotoParams = currentMonthReading?.electricityPhotoUrl && selectedRoomId && (canEditCurrentReading || canAdminOverride) ? {
    operation: 'get' as const,
    roomNumber: selectedRoomId.toString(),
    contentType: undefined,
    meterType: 'electricity' as const,
    fileName: currentMonthReading.electricityPhotoUrl
  } : null;

  const { data: waterPresigned } = useGetPresignedURLQuery(waterPhotoParams);
  const { data: electricityPresigned } = useGetPresignedURLQuery(electricityPhotoParams);

  useEffect(() => {
    if (currentMonthReading && (canEditCurrentReading || canAdminOverride)) {
      form.setFieldsValue({
        waterReading: toNumber(currentMonthReading.waterReading),
        electricityReading: toNumber(currentMonthReading.electricityReading),
      });
      
      // Set filenames from DB
      const waterFileName = currentMonthReading.waterPhotoUrl || '';
      const electricityFileName = currentMonthReading.electricityPhotoUrl || '';
      
      setWaterPhotoName(waterFileName);
      setElectricityPhotoName(electricityFileName);
      
      // Create file lists for Upload component using fetched presigned URLs
      if (waterPresigned?.url) {
        setWaterPhotoList([{
          uid: waterFileName,
          name: waterFileName,
          status: 'done',
          url: waterPresigned.url,
        }]);
      }
      
      if (electricityPresigned?.url) {
        setElectricityPhotoList([{
          uid: electricityFileName,
          name: electricityFileName,
          status: 'done',
          url: electricityPresigned.url,
        }]);
      }

      if (previousReading && currentRoom) {
        calculateBill(
          toNumber(currentMonthReading.waterReading),
          toNumber(currentMonthReading.electricityReading)
        );
      }
    } else if (canCreateNewReading) {
      form.resetFields();
      setWaterPhotoName('');
      setElectricityPhotoName('');
      setWaterPhotoList([]);
      setElectricityPhotoList([]);
      setCalculatedBill({
        totalBill: 0, electricityUsage: 0, waterUsage: 0, waterBill: 0, electricityBill: 0
      });
    }
  }, [currentMonthReading, canEditCurrentReading, canAdminOverride, canCreateNewReading, form, previousReading, currentRoom, waterPresigned, electricityPresigned]);

  const handleRoomChange = (roomId: number) => {
    setSelectedRoomId(roomId);
    form.resetFields(['waterReading', 'electricityReading']);
    setWaterPhotoName('');
    setElectricityPhotoName('');
    setWaterPhotoList([]);
    setElectricityPhotoList([]);
    setCalculatedBill({
      totalBill: 0, electricityUsage: 0, waterUsage: 0, waterBill: 0, electricityBill: 0
    });
  };

  const handleReadingChange = () => {
    const values = form.getFieldsValue();
    if (values.waterReading && values.electricityReading && previousReading && currentRoom) {
      calculateBill(values.waterReading, values.electricityReading);
    }
  };

  const calculateBill = (waterReading: number, electricityReading: number) => {
    if (!previousReading || !currentRoom) return;

    const prevWaterReading = toNumber(previousReading.waterReading);
    const prevElectricityReading = toNumber(previousReading.electricityReading);
    const baseRent = toNumber(currentRoom.baseRent);

    const waterUsage = Math.max(0, waterReading - prevWaterReading);
    const electricityUsage = Math.max(0, electricityReading - prevElectricityReading);

    const waterCost = waterUsage * waterRate;
    const electricityCost = electricityUsage * electricityRate;

    const total = waterCost + electricityCost + baseRent + trashFee;
    setCalculatedBill({
      totalBill: total,
      electricityUsage: electricityUsage,
      waterUsage: waterUsage,
      electricityBill: electricityCost,
      waterBill: waterCost
    });
  };

  const handlePhotoUpload = async (file: File, type: 'water' | 'electricity'): Promise<boolean> => {
    if (!selectedRoomId) {
      console.error('No room selected');
      return false;
    }

    try {
      // Get presigned URL for upload (PUT operation)
      const presignedURL = await getPresignedURLForUpload.mutateAsync({
        operation: 'put',
        roomNumber: selectedRoomId.toString(),
        contentType: file.type,
        meterType: type,
        fileName: file.name
      });
      
      if (presignedURL) {
        // Upload to S3
        await uploadToS3.mutateAsync({
          presignedUrl: presignedURL.url,
          file: file
        });
        
        // Store the filename from the presigned URL response
        const fileName = presignedURL.fileName;
        
        if (type === 'water') {
          setWaterPhotoName(fileName);
          setWaterPhotoList([{
            uid: fileName,
            name: file.name, // Display original filename
            status: 'done',
            url: presignedURL.url.split('?')[0], // Remove query params to get clean URL
          }]);
        } else {
          setElectricityPhotoName(fileName);
          setElectricityPhotoList([{
            uid: fileName,
            name: file.name, // Display original filename
            status: 'done',
            url: presignedURL.url.split('?')[0],
          }]);
        }
      }
      
      return false; // Return false to prevent Upload component from auto-uploading
    } catch (error) {
      console.error('Photo upload failed:', error);
      return false;
    }
  };

  const handleSubmit = async (values: any) => {
    if (!selectedRoomId) {
      console.error('No room selected');
      return;
    }

    try {
      const submissionData = {
        roomId: selectedRoomId,
        month: currentMonth,
        year: currentYear,
        waterReading: values.waterReading,
        electricityReading: values.electricityReading,
        waterPhotoUrl: waterPhotoName, // Will be waterPhotoName after DB migration
        electricityPhotoUrl: electricityPhotoName, // Will be electricityPhotoName after DB migration
      };

      if (currentMonthReading && (canEditCurrentReading || canAdminOverride)) {
        await updateMutation.mutateAsync({
          readingId: currentMonthReading.id,
          data: submissionData
        });
      } else if (canCreateNewReading) {
        await submitMutation.mutateAsync(submissionData);
      } else {
        console.error('Cannot submit: no valid action available');
        return;
      }

      if (canCreateNewReading && !currentMonthReading) {
        form.resetFields();
        setWaterPhotoName('');
        setElectricityPhotoName('');
        setWaterPhotoList([]);
        setElectricityPhotoList([]);
        setCalculatedBill({
          totalBill: 0, electricityUsage: 0, waterUsage: 0, waterBill: 0, electricityBill: 0
        });
      }
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  if (!isAdmin() && selectedRoomId && readingLoading) {
    return (
      <PageErrorBoundary>
        <div className="space-y-4">
          <div>
            <Title level={3} className="mb-1">{`${t('meterReadings.title')}`}</Title>
            <Text className="text-gray-600">
              {`${t('meterReadings.subtitle')}`}
            </Text>
          </div>
          <RoomSelector
            rooms={availableRooms}
            selectedRoomId={selectedRoomId}
            onRoomChange={handleRoomChange}
            isAdmin={isAdmin()}
            userRoomId={userRoomId}
          />
          <LoadingSpinner message={`${t('meterReadings.loadingPreviousReadings')}`} />
        </div>
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <Title level={3} className="mb-1">{`${t('meterReadings.title')}`}</Title>
            <Text className="text-gray-600">
              {`${t('meterReadings.subtitle')}`}
            </Text>
          </div>
          <RefreshButton
            queryKeys={[
              meterReadingKeys.all,
              roomKeys.all,
            ]}
          />
        </div>

        <RoomSelector
          rooms={availableRooms}
          selectedRoomId={selectedRoomId}
          onRoomChange={handleRoomChange}
          isAdmin={isAdmin()}
          userRoomId={userRoomId}
        />

        {isAdmin() && !selectedRoomId && (
          <Card size="small">
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg mb-2">{`${t('meterReadings.selectARoom')}`}</div>
              <div className="text-sm">{`${t('meterReadings.selectRoomToView')}`}</div>
            </div>
          </Card>
        )}

        {selectedRoomId && availableRooms && availableRooms.length > 0 && (
          <>
            {readingLoading ? (
              <Card size="small">
                <LoadingSpinner message={`${t('meterReadings.loadingReadings')}`} />
              </Card>
            ) : (
              <>
                {currentMonthReading && (
                  <CurrentMonthReadingCard
                    reading={currentMonthReading}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    submissionCount={currentMonthReadings.length}
                    isAdmin={isAdmin()}
                    canAdminOverride={canAdminOverride}
                    canCreateNewReading={canCreateNewReading}
                  />
                )}

                {previousReading && previousReading.id !== currentMonthReading?.id && (
                  <PreviousReadingCard reading={previousReading} />
                )}

                <Card size="small">
                  <Button
                    icon={<HistoryOutlined />}
                    className="w-full"
                    onClick={() => setShowHistoryModal(true)}
                    disabled={!selectedRoomId}
                  >
                    {`${t('meterReadings.viewHistory')}`}
                  </Button>
                </Card>

                <ReadingHistoryModal
                  visible={showHistoryModal}
                  onClose={() => setShowHistoryModal(false)}
                  readings={readings || []}
                  loading={readingLoading}
                  roomNumber={currentRoom?.roomNumber}
                />

                <MeterReadingForm
                  form={form}
                  previousReading={previousReading}
                  currentRoom={currentRoom || null}
                  calculatedBill={calculatedBill}
                  waterRate={waterRate}
                  electricityRate={electricityRate}
                  trashFee={trashFee}
                  canEdit={!!canEditCurrentReading}
                  canAdminOverride={canAdminOverride}
                  canCreateNew={canCreateNewReading}
                  hasApprovedReading={hasApprovedReading}
                  hasPendingReading={hasPendingReading}
                  selectedRoomId={selectedRoomId}
                  uploadLoading={uploadToS3.isPending || getPresignedURLForUpload.isPending}
                  submitLoading={submitMutation.isPending || updateMutation.isPending}
                  onPhotoUpload={handlePhotoUpload}
                  onSubmit={handleSubmit}
                  onValuesChange={handleReadingChange}
                  waterPhotoList={waterPhotoList}
                  setWaterPhotoList={setWaterPhotoList}
                  electricityPhotoList={electricityPhotoList}
                  setElectricityPhotoList={setElectricityPhotoList}
                />

                <Alert
                  message={`${t('meterReadings.guidelineTitle')}`}
                  description={`${t('meterReadings.guidelineDes')}`}
                  type="info"
                  showIcon
                  className="text-sm"
                />
              </>
            )}
          </>
        )}
      </div>
    </PageErrorBoundary>
  );
};