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
import { useMeterReadingsQuery, useSubmitMeterReadingMutation } from '@/hooks/useMeterReadings';
import { useSettingValue } from '@/hooks/useSettings';
import { useUploadMeterPhotoMutation } from '@/hooks/useFileUpload';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';


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
  const { data: readings, isLoading: readingLoading } = useMeterReadingsQuery(selectedRoomId || 0);
  
  // Get room details for the selected room
  const { data: currentRoom } = useRoomQuery(selectedRoomId || 0);
  
  // Get the most recent reading as previous reading
  const previousReading = readings && readings.length > 0 ? readings[0] : null;

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

  const handleSubmit = async (values: ReadingFormData) => {
    if (!selectedRoomId) {
      console.error('No room selected');
      return;
    }

    try {
      const currentDate = new Date();
      const submissionData = {
        roomId: selectedRoomId,
        month: currentDate.getMonth() + 1, // JavaScript months are 0-indexed
        year: currentDate.getFullYear(),
        waterReading: values.waterReading,
        electricityReading: values.electricityReading,
        waterPhotoUrl,
        electricityPhotoUrl,
      };
      
      // console.log('Submitting reading:', submissionData);
      await submitMutation.mutateAsync(submissionData);
      
      // Reset form after successful submission
      form.resetFields();
      setWaterPhotoUrl('');
      setElectricityPhotoUrl('');
      setCalculatedBill({
    totalBill: 0, electricityUsage: 0, waterUsage: 0, waterBill: 0, electricityBill: 0
  });
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
            {/* Previous Reading Info */}
            {previousReading && (
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

            {/* Reading Input Form */}
            <Card title="Current Month Reading" size="small">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={handleReadingChange}
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
                    loading={submitMutation.isPending}
                    disabled={!waterPhotoUrl || !electricityPhotoUrl || submitMutation.isPending}
                  >
                    Submit Reading
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

        {/* Reading History Button */}
        <Card size="small">
          <Button
            icon={<HistoryOutlined />}
            className="w-full"
            onClick={() => {
              // Navigate to reading history
            }}
          >
            View Reading History
          </Button>
        </Card>
      </div>
    </PageErrorBoundary>
  );
};