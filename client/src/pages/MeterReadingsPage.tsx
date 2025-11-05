import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Button,
  Typography,
  Row,
  Col,
  Upload,
  Image,
  Statistic,
  Divider,
  Alert,
  Select
} from 'antd';
import {
  CameraOutlined,
  CalculatorOutlined,
  HistoryOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useRoomsQuery, useRoomQuery } from '@/hooks/useRooms';
import { useMeterReadingsQuery, useSubmitMeterReadingMutation, useUpdateMeterReadingMutation } from '@/hooks/useMeterReadings';
import { useSettingValue } from '@/hooks/useSettings';
import { useUploadMeterPhotoMutation } from '@/hooks/useFileUpload';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { ReadingHistoryModal } from '@/components/MeterReadings';


const { Title, Text } = Typography;
const { Option } = Select;

interface ReadingFormData {
  roomId: number;
  waterReading: number;
  electricityReading: number;
  waterPhoto?: File;
  electricityPhoto?: File;
}

interface CalculatedBill {
  totalBill: number,
  electricityUsage: number,
  waterUsage: number,
  electricityBill: number,
  waterBill: number
}

// Utility function to safely convert Prisma Decimal strings to numbers
const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const MeterReadingsPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { data: rooms } = useRoomsQuery();
  const [form] = Form.useForm();

  // Get settings values
  const waterRate = useSettingValue('water_rate', 22000);
  const electricityRate = useSettingValue('electricity_rate', 3500);
  const trashFee = useSettingValue('trash_fee', 52000);

  // For regular users, default to their tenant room; for admins, no default selection
  const userRoomId = user?.tenant?.roomId;
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    !isAdmin() && userRoomId ? userRoomId : null
  );
  const [waterPhotoUrl, setWaterPhotoUrl] = useState<string>('');
  const [electricityPhotoUrl, setElectricityPhotoUrl] = useState<string>('');
  const [calculatedBill, setCalculatedBill] = useState<CalculatedBill>({
    totalBill: 0, electricityUsage: 0, waterUsage: 0, waterBill: 0, electricityBill: 0
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { data: readings, isLoading: readingLoading } = useMeterReadingsQuery(selectedRoomId || 0);

  // Get room details for the selected room
  const { data: currentRoom } = useRoomQuery(selectedRoomId || 0);

  // Get the most recent approved reading as previous reading for billing calculations
  const previousReading = readings?.find(r => r.status === 'APPROVED') || null;
  
  // Get current month's readings (there can be multiple now)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentMonthReadings = readings?.filter(r => r.month === currentMonth && r.year === currentYear) || [];
  
  // Get the most relevant reading for the current month:
  // 1. APPROVED reading (if exists)
  // 2. PENDING reading (if exists and user can edit it)
  // 3. Most recent REJECTED reading (for display purposes)
  const currentMonthReading = currentMonthReadings.find(r => r.status === 'APPROVED') ||
    currentMonthReadings.find(r => r.status === 'PENDING' && (!isAdmin() ? r.submittedBy === user?.id : true)) ||
    currentMonthReadings.filter(r => r.status === 'REJECTED').sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
  
  // Determine if user can edit current month's reading
  const canEditCurrentReading = currentMonthReading && 
    currentMonthReading.status === 'PENDING' && 
    (!isAdmin() ? currentMonthReading.submittedBy === user?.id : true);
  
  // For admin, they can always edit APPROVED readings (override)
  const canAdminOverride = isAdmin() && currentMonthReading && currentMonthReading.status === 'APPROVED';
  
  // Check if we should allow creating a new reading
  // - No readings exist for current month
  // - Only REJECTED readings exist (user can resubmit)
  // - User has REJECTED reading and wants to resubmit
  const hasApprovedReading = currentMonthReadings.some(r => r.status === 'APPROVED');
  const hasPendingReading = currentMonthReadings.some(r => r.status === 'PENDING' && (!isAdmin() ? r.submittedBy === user?.id : true));
  const canCreateNewReading = !hasApprovedReading && !hasPendingReading;

  // console.log(previousReading)

  const uploadMutation = useUploadMeterPhotoMutation();

  // Get available rooms for the user
  const availableRooms = isAdmin()
    ? rooms
    : (userRoomId && rooms ? rooms.filter(room => room.id === userRoomId) : []);

  // Auto-select room for regular users when user data loads
  useEffect(() => {
    if (!isAdmin() && userRoomId && !selectedRoomId) {
      setSelectedRoomId(userRoomId);
    }
  }, [isAdmin, userRoomId, selectedRoomId]);

  // Pre-fill form with current month reading if it exists and is editable
  useEffect(() => {
    if (currentMonthReading && (canEditCurrentReading || canAdminOverride)) {
      form.setFieldsValue({
        waterReading: toNumber(currentMonthReading.waterReading),
        electricityReading: toNumber(currentMonthReading.electricityReading),
      });
      setWaterPhotoUrl(currentMonthReading.waterPhotoUrl || '');
      setElectricityPhotoUrl(currentMonthReading.electricityPhotoUrl || '');
      
      // Calculate bill with existing values
      if (previousReading && currentRoom) {
        calculateBill(
          toNumber(currentMonthReading.waterReading),
          toNumber(currentMonthReading.electricityReading)
        );
      }
    } else if (canCreateNewReading) {
      // Clear form when user can create new reading (no editable reading exists)
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

    // Convert string values to numbers for calculations
    const prevWaterReading = toNumber(previousReading.waterReading);
    const prevElectricityReading = toNumber(previousReading.electricityReading);
    const baseRent = toNumber(currentRoom.baseRent); // Use current room's base rent

    const waterUsage = Math.max(0, waterReading - prevWaterReading);
    const electricityUsage = Math.max(0, electricityReading - prevElectricityReading);

    const waterCost = waterUsage * waterRate;
    const electricityCost = electricityUsage * electricityRate;

    // console.log('Calculation:', { waterCost, electricityCost, baseRent, trashFee });

    const total = waterCost + electricityCost + baseRent + trashFee;
    // console.log('Total:', total);
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
      const uploadedUrl = await uploadMutation.mutateAsync({
        file,
        roomId: selectedRoomId,
        meterType: type
      });
      if (type === 'water') {
        setWaterPhotoUrl(uploadedUrl);
      } else {
        setElectricityPhotoUrl(uploadedUrl);
      }
      return false; // Prevent default upload behavior
    } catch (error) {
      console.error('Photo upload failed:', error);
      return false;
    }
  };

  const submitMutation = useSubmitMeterReadingMutation();

  const updateMutation = useUpdateMeterReadingMutation();

  const handleSubmit = async (values: ReadingFormData) => {
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
        // Update existing reading (PENDING or admin override on APPROVED)
        await updateMutation.mutateAsync({
          readingId: currentMonthReading.id,
          data: submissionData
        });
      } else if (canCreateNewReading) {
        // Create new reading (no editable reading exists)
        await submitMutation.mutateAsync(submissionData);
      } else {
        console.error('Cannot submit: no valid action available');
        return;
      }

      // Reset form after successful submission only if creating new reading
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



  if (readingLoading) {
    return <LoadingSpinner message="Loading previous readings..." />;
  }

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <Title level={3} className="mb-1">Meter Readings</Title>
          <Text className="text-gray-600">
            Submit monthly utility readings with photos
          </Text>
        </div>

        {/* Room Selection */}
        <Card title={isAdmin() ? "Select Room" : "Your Room"} size="small">
          <Select
            placeholder={isAdmin() ? "Choose a room" : "Your assigned room"}
            className="w-full"
            value={selectedRoomId}
            onChange={handleRoomChange}
            disabled={!isAdmin()}
          >
            {availableRooms?.map((room) => (
              <Option key={room.id} value={room.id}>
                Room {room.roomNumber} - Floor {room.floor}
              </Option>
            ))}
          </Select>
          {!isAdmin() && !userRoomId && (
            <div className="mt-2 text-sm text-gray-500">
              You are not assigned to any room as a tenant. Contact your administrator.
            </div>
          )}
        </Card>

        {selectedRoomId && availableRooms && availableRooms.length > 0 && (
          <>
            {/* Current Month Reading Status */}
            {currentMonthReading && (
              <Card 
                title={`Current Month Reading (${currentMonth}/${currentYear})`} 
                size="small"
                className={
                  currentMonthReading.status === 'APPROVED' ? 'border-green-200 bg-green-50' :
                  currentMonthReading.status === 'REJECTED' ? 'border-red-200 bg-red-50' :
                  'border-orange-200 bg-orange-50'
                }
                extra={
                  currentMonthReadings.length > 1 && (
                    <span className="text-xs text-gray-500">
                      {currentMonthReadings.length} submissions
                    </span>
                  )
                }
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Water"
                      value={toNumber(currentMonthReading.waterReading)}
                      precision={1}
                      suffix="units"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Electricity"
                      value={toNumber(currentMonthReading.electricityReading)}
                      precision={1}
                      suffix="units"
                    />
                  </Col>
                  <Col span={8}>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">Status</div>
                      <div className={`font-bold ${currentMonthReading.status === 'APPROVED' ? 'text-green-500' : currentMonthReading.status === 'REJECTED' ? 'text-red-500' : 'text-orange-500'}`}>
                        {currentMonthReading.status.toUpperCase()}
                      </div>
                    </div>
                  </Col>
                </Row>
                
                {currentMonthReading.status === 'APPROVED' && !isAdmin() && (
                  <Alert
                    message="Reading Approved"
                    description="This reading has been approved and cannot be modified. Contact admin if changes are needed."
                    type="success"
                    showIcon
                    className="mt-3"
                  />
                )}
                
                {currentMonthReading.status === 'REJECTED' && (
                  <Alert
                    message="Reading Rejected"
                    description={`This reading was rejected. ${canCreateNewReading ? 'You can submit a new reading below.' : 'Please wait for admin review of other submissions.'}`}
                    type="error"
                    showIcon
                    className="mt-3"
                  />
                )}
                
                {currentMonthReading.status === 'PENDING' && (
                  <Alert
                    message="Pending Approval"
                    description="This reading is waiting for admin approval. You can still modify it until it's approved."
                    type="warning"
                    showIcon
                    className="mt-3"
                  />
                )}

                {canAdminOverride && (
                  <Alert
                    message="Admin Override Available"
                    description="As an admin, you can modify this approved reading. Changes will be logged in the modification history."
                    type="info"
                    showIcon
                    className="mt-3"
                  />
                )}
              </Card>
            )}

            {/* Previous Reading Info */}
            {previousReading && previousReading.id !== currentMonthReading?.id && (
              <Card title="Previous Reading" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Water"
                      value={toNumber(previousReading.waterReading)}
                      precision={1}
                      suffix="units"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Electricity"
                      value={toNumber(previousReading.electricityReading)}
                      precision={1}
                      suffix="units"
                    />
                  </Col>
                </Row>
                <div className="mt-2 text-xs text-gray-500">
                  From: {new Date(previousReading.submittedAt).toLocaleDateString()}
                </div>
              </Card>
            )}

            {/* Reading History Button */}
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

            {/* Reading History Modal */}
            <ReadingHistoryModal
              visible={showHistoryModal}
              onClose={() => setShowHistoryModal(false)}
              readings={readings || []}
              loading={readingLoading}
              roomNumber={currentRoom?.roomNumber}
            />

            {/* Reading Input Form */}
            <Card 
              title={
                canAdminOverride
                  ? "Current Month Reading (Admin Override)"
                  : canEditCurrentReading
                  ? "Edit Current Month Reading"
                  : canCreateNewReading
                  ? "Submit New Reading"
                  : "Current Month Reading"
              }
              size="small"
            >
              {hasApprovedReading && !canAdminOverride ? (
                <Alert
                  message="Reading Already Approved"
                  description="An approved reading exists for this month and cannot be modified."
                  type="success"
                  showIcon
                  className="mb-4"
                />
              ) : hasPendingReading && !canEditCurrentReading && !canCreateNewReading ? (
                <Alert
                  message="Reading Pending Review"
                  description="A reading is currently pending admin approval. You cannot submit another until it's reviewed."
                  type="warning"
                  showIcon
                  className="mb-4"
                />
              ) : null}
              
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={handleReadingChange}
                disabled={!canEditCurrentReading && !canAdminOverride && !canCreateNewReading}
              >
                {/* Water Reading */}
                <Form.Item
                  name="waterReading"
                  label="Water Meter Reading"
                  rules={[
                    { required: true, message: 'Please enter water reading' },
                    {
                      validator: (_, value) => {
                        if (previousReading && value < toNumber(previousReading.waterReading)) {
                          return Promise.reject('Reading cannot be less than previous month');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    className="w-full"
                    placeholder="Enter water reading"
                    precision={1}
                    min={0}
                    step={0.1}
                  />
                </Form.Item>

                {/* Water Photo Upload */}
                <Form.Item label="Water Meter Photo">
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => handlePhotoUpload(file, 'water')}
                    disabled={uploadMutation.isPending || !selectedRoomId}
                  >
                    <Button
                      icon={<CameraOutlined />}
                      loading={uploadMutation.isPending}
                      className="w-full"
                      disabled={!selectedRoomId}
                    >
                      Take Water Meter Photo
                    </Button>
                  </Upload>
                  {waterPhotoUrl && (
                    <div className="mt-2">
                      <Image
                        src={waterPhotoUrl}
                        alt="Water meter"
                        width={100}
                        height={100}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                </Form.Item>

                <Divider />

                {/* Electricity Reading */}
                <Form.Item
                  name="electricityReading"
                  label="Electricity Meter Reading"
                  rules={[
                    { required: true, message: 'Please enter electricity reading' },
                    {
                      validator: (_, value) => {
                        if (previousReading && value < toNumber(previousReading.electricityReading)) {
                          return Promise.reject('Reading cannot be less than previous month');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    className="w-full"
                    placeholder="Enter electricity reading"
                    precision={1}
                    min={0}
                    step={0.1}
                  />
                </Form.Item>

                {/* Electricity Photo Upload */}
                <Form.Item label="Electricity Meter Photo">
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => handlePhotoUpload(file, 'electricity')}
                    disabled={uploadMutation.isPending || !selectedRoomId}
                  >
                    <Button
                      icon={<CameraOutlined />}
                      loading={uploadMutation.isPending}
                      className="w-full"
                      disabled={!selectedRoomId}
                    >
                      Take Electricity Meter Photo
                    </Button>
                  </Upload>
                  {electricityPhotoUrl && (
                    <div className="mt-2">
                      <Image
                        src={electricityPhotoUrl}
                        alt="Electricity meter"
                        width={100}
                        height={100}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                </Form.Item>

                {/* Bill Calculation */}
                {calculatedBill.totalBill > 0 && (
                  <Card className="bg-blue-50 border-blue-200" size="small">
                    <div className="text-center">
                      <CalculatorOutlined className="text-2xl text-blue-500 mb-2" />
                      <Statistic
                        title="Calculated Monthly Bill"
                        value={calculatedBill.totalBill}
                        precision={0}
                        suffix="VNĐ"
                        valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      />
                      <div>Electricity: {calculatedBill.electricityUsage} kWh x {electricityRate.toLocaleString()} = {calculatedBill.electricityBill.toLocaleString()} VNĐ</div>
                      <div>Water: {calculatedBill.waterUsage} m³ x {waterRate.toLocaleString()} = {calculatedBill.waterBill.toLocaleString()} VNĐ</div>
                      <div>Trash fee: {trashFee.toLocaleString()} VNĐ</div>
                      <div>Base rent: {currentRoom ? Number(currentRoom.baseRent).toLocaleString() : 'Loading...'} VNĐ</div>
                      <div className="text-xs text-gray-600 mt-2">
                        Including base rent, utilities, and trash fee
                      </div>
                    </div>
                  </Card>
                )}

                {/* Submit Button */}
                <Form.Item className="mt-6">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    className="w-full"
                    size="large"
                    loading={submitMutation.isPending || updateMutation.isPending}
                    disabled={
                      (!canEditCurrentReading && !canAdminOverride && !canCreateNewReading) ||
                      !waterPhotoUrl || 
                      !electricityPhotoUrl || 
                      submitMutation.isPending || 
                      updateMutation.isPending
                    }
                  >
                    {canAdminOverride
                      ? 'Update Reading (Admin Override)'
                      : canEditCurrentReading
                      ? 'Update Reading'
                      : canCreateNewReading
                      ? 'Submit New Reading'
                      : 'Cannot Submit'
                    }
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Info Alert */}
            <Alert
              message="Reading Submission Guidelines"
              description="Please ensure photos are clear and show the complete meter display. Readings cannot be less than the previous month's values."
              type="info"
              showIcon
              className="text-sm"
            />
          </>
        )}
      </div>
    </PageErrorBoundary>
  );
};