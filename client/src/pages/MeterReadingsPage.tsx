import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Typography, Alert } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useRoomsQuery, useRoomQuery } from '@/hooks/useRooms';
import { useMeterReadingsQuery, useSubmitMeterReadingMutation, useUpdateMeterReadingMutation } from '@/hooks/useMeterReadings';
import { useSettingValue } from '@/hooks/useSettings';
import { useGetPresignedURLMutation, useUploadToS3Mutation } from '@/hooks/useFileUpload';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import {
  ReadingHistoryModal,
  RoomSelector,
  CurrentMonthReadingCard,
  PreviousReadingCard,
  MeterReadingForm
} from '@/components/MeterReadings';

const { Title, Text } = Typography;

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const MeterReadingsPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { data: rooms } = useRoomsQuery();
  const [form] = Form.useForm();

  const waterRate = useSettingValue('water_rate', 22000);
  const electricityRate = useSettingValue('electricity_rate', 3500);
  const trashFee = useSettingValue('trash_fee', 52000);

  const userRoomId = user?.tenant?.roomId;
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    !isAdmin() && userRoomId ? userRoomId : null
  );
  const [waterPhotoUrl, setWaterPhotoUrl] = useState<string>('');
  const [electricityPhotoUrl, setElectricityPhotoUrl] = useState<string>('');
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

  const getPresignedURL = useGetPresignedURLMutation();
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

  useEffect(() => {
    if (currentMonthReading && (canEditCurrentReading || canAdminOverride)) {
      form.setFieldsValue({
        waterReading: toNumber(currentMonthReading.waterReading),
        electricityReading: toNumber(currentMonthReading.electricityReading),
      });
      setWaterPhotoUrl(currentMonthReading.waterPhotoUrl || '');
      setElectricityPhotoUrl(currentMonthReading.electricityPhotoUrl || '');

      if (previousReading && currentRoom) {
        calculateBill(
          toNumber(currentMonthReading.waterReading),
          toNumber(currentMonthReading.electricityReading)
        );
      }
    } else if (canCreateNewReading) {
      form.resetFields();
      setWaterPhotoUrl('');
      setElectricityPhotoUrl('');
      setCalculatedBill({
        totalBill: 0, electricityUsage: 0, waterUsage: 0, waterBill: 0, electricityBill: 0
      });
    }
  }, [currentMonthReading, canEditCurrentReading, canAdminOverride, canCreateNewReading, form, previousReading, currentRoom]);

  const handleRoomChange = (roomId: number) => {
    setSelectedRoomId(roomId);
    form.resetFields(['waterReading', 'electricityReading']);
    setWaterPhotoUrl('');
    setElectricityPhotoUrl('');
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

  const handlePhotoUpload = async (file: File, type: 'water' | 'electricity') => {
    if (!selectedRoomId) {
      console.error('No room selected');
      return false;
    }

    try {
      const presignedURL = await getPresignedURL.mutateAsync({
        operation: 'put',
        roomNumber: selectedRoomId.toString(),
        contentType: file.type,
        meterType: type,
        fileName: file.name
      });
      if (presignedURL) {
        await uploadToS3.mutateAsync({
          presignedUrl: presignedURL,
          file: file
        });
      }
      return false;
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
        waterPhotoUrl,
        electricityPhotoUrl,
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
        setWaterPhotoUrl('');
        setElectricityPhotoUrl('');
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
            <Title level={3} className="mb-1">Meter Readings</Title>
            <Text className="text-gray-600">
              Submit monthly utility readings with photos
            </Text>
          </div>
          <RoomSelector
            rooms={availableRooms}
            selectedRoomId={selectedRoomId}
            onRoomChange={handleRoomChange}
            isAdmin={isAdmin()}
            userRoomId={userRoomId}
          />
          <LoadingSpinner message="Loading previous readings..." />
        </div>
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        <div>
          <Title level={3} className="mb-1">Meter Readings</Title>
          <Text className="text-gray-600">
            Submit monthly utility readings with photos
          </Text>
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
              <div className="text-lg mb-2">Select a Room</div>
              <div className="text-sm">Choose a room from the dropdown above to view and manage meter readings.</div>
            </div>
          </Card>
        )}

        {selectedRoomId && availableRooms && availableRooms.length > 0 && (
          <>
            {readingLoading ? (
              <Card size="small">
                <LoadingSpinner message="Loading meter readings..." />
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
                    View Reading History
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
                  waterPhotoUrl={waterPhotoUrl}
                  electricityPhotoUrl={electricityPhotoUrl}
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
                  uploadLoading={uploadToS3.isPending || getPresignedURL.isPending}
                  submitLoading={submitMutation.isPending || updateMutation.isPending}
                  onPhotoUpload={handlePhotoUpload}
                  onSubmit={handleSubmit}
                  onValuesChange={handleReadingChange}
                />

                <Alert
                  message="Reading Submission Guidelines"
                  description="Please ensure photos are clear and show the complete meter display. Readings cannot be less than the previous month's values."
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
