import React, { useState } from 'react';
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
import { useRoomsQuery } from '@/hooks/useRooms';
import { useMeterReadingsQuery, useSubmitMeterReadingMutation } from '@/hooks/useMeterReadings';
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

// Utility function to safely convert Prisma Decimal strings to numbers
const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const MeterReadingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: rooms } = useRoomsQuery();
  const [form] = Form.useForm();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [waterPhotoUrl, setWaterPhotoUrl] = useState<string>('');
  const [electricityPhotoUrl, setElectricityPhotoUrl] = useState<string>('');
  const [calculatedBill, setCalculatedBill] = useState<number>(0);
  
  const { data: readings, isLoading: readingLoading } = useMeterReadingsQuery(selectedRoomId || 0);
  
  // Get the most recent reading as previous reading
  const previousReading = readings && readings.length > 0 ? readings[0] : null;

  console.log(previousReading)
  
  const uploadMutation = useUploadMeterPhotoMutation();

  // Get available rooms for the user
  const availableRooms = isAdmin() ? rooms : rooms?.slice(0, 3); // Mock: first 3 rooms for regular users

  const handleRoomChange = (roomId: number) => {
    setSelectedRoomId(roomId);
    form.resetFields(['waterReading', 'electricityReading']);
    setWaterPhotoUrl('');
    setElectricityPhotoUrl('');
    setCalculatedBill(0);
  };

  const handleReadingChange = () => {
    const values = form.getFieldsValue();
    if (values.waterReading && values.electricityReading && previousReading) {
      calculateBill(values.waterReading, values.electricityReading);
    }
  };

  const calculateBill = (waterReading: number, electricityReading: number) => {
    if (!previousReading) return;

    // Convert string values to numbers for calculations
    const prevWaterReading = toNumber(previousReading.waterReading);
    const prevElectricityReading = toNumber(previousReading.electricityReading);
    const baseRent = toNumber(previousReading.baseRent);

    const waterUsage = Math.max(0, waterReading - prevWaterReading);
    const electricityUsage = Math.max(0, electricityReading - prevElectricityReading);
    
    const waterCost = waterUsage * 22000; // ₱22,000 per unit
    const electricityCost = electricityUsage * 3500; // ₱3,500 per unit
    const trashFee = 52000; // Fixed ₱52,000

    console.log('Calculation:', { waterCost, electricityCost, baseRent, trashFee });
    
    const total = waterCost + electricityCost + baseRent + trashFee;
    console.log('Total:', total);
    setCalculatedBill(total);
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
      
      console.log('Submitting reading:', submissionData);
      await submitMutation.mutateAsync(submissionData);
      
      // Reset form after successful submission
      form.resetFields();
      setWaterPhotoUrl('');
      setElectricityPhotoUrl('');
      setCalculatedBill(0);
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
        <Card title="Select Room" size="small">
          <Select
            placeholder="Choose a room"
            className="w-full"
            value={selectedRoomId}
            onChange={handleRoomChange}
          >
            {availableRooms?.map((room) => (
              <Option key={room.id} value={room.id}>
                Room {room.roomNumber} - Floor {room.floor}
              </Option>
            ))}
          </Select>
        </Card>

        {selectedRoomId && (
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
                {calculatedBill > 0 && (
                  <Card className="bg-blue-50 border-blue-200" size="small">
                    <div className="text-center">
                      <CalculatorOutlined className="text-2xl text-blue-500 mb-2" />
                      <Statistic
                        title="Calculated Monthly Bill"
                        value={calculatedBill}
                        precision={0}
                        prefix="₱"
                        valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      />
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