import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Upload, Divider, Alert, Modal, Image, UploadFile } from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { MeterReading, Room } from '@/types';
import { BillCalculationCard } from './BillCalculationCard';
import getBase64 from '@/utils/getBase64';

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

interface MeterReadingFormProps {
  form: any;
  previousReading: MeterReading | null;
  currentRoom: Room | null;
  waterPhotoUrl: string;
  electricityPhotoUrl: string;
  calculatedBill: {
    totalBill: number;
    electricityUsage: number;
    waterUsage: number;
    electricityBill: number;
    waterBill: number;
  };
  waterRate: number;
  electricityRate: number;
  trashFee: number;
  canEdit: boolean;
  canAdminOverride: boolean;
  canCreateNew: boolean;
  hasApprovedReading: boolean;
  hasPendingReading: boolean;
  selectedRoomId: number | null;
  uploadLoading: boolean;
  submitLoading: boolean;
  onPhotoUpload: (file: File, type: 'water' | 'electricity') => Promise<boolean>;
  onSubmit: (values: any) => Promise<void>;
  onValuesChange: () => void;
}

export const MeterReadingForm: React.FC<MeterReadingFormProps> = ({
  form,
  previousReading,
  currentRoom,
  waterPhotoUrl,
  electricityPhotoUrl,
  calculatedBill,
  waterRate,
  electricityRate,
  trashFee,
  canEdit,
  canAdminOverride,
  canCreateNew,
  hasApprovedReading,
  hasPendingReading,
  selectedRoomId,
  uploadLoading,
  submitLoading,
  onPhotoUpload,
  onSubmit,
  onValuesChange
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const getTitle = () => {
    if (canAdminOverride) return "Current Month Reading (Admin Override)";
    if (canEdit) return "Edit Current Month Reading";
    if (canCreateNew) return "Submit New Reading";
    return "Current Month Reading";
  };

  return (
    <>
      <Card title={getTitle()} size="small">
        {hasApprovedReading && !canAdminOverride ? (
          <Alert
            message="Reading Already Approved"
            description="An approved reading exists for this month and cannot be modified."
            type="success"
            showIcon
            className="mb-4"
          />
        ) : hasPendingReading && !canEdit && !canCreateNew ? (
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
          onFinish={onSubmit}
          onValuesChange={onValuesChange}
          disabled={!canEdit && !canAdminOverride && !canCreateNew}
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
              beforeUpload={(file) => onPhotoUpload(file, 'water')}
              listType='picture-card'
              onPreview={handlePreview}
              disabled={uploadLoading || !selectedRoomId}
            >
              <Button
                icon={<div className='flex flex-col justify-center items-center'>
                  <PlusOutlined />
                  Upload
                </div>}
                type='text'
                loading={uploadLoading}
                disabled={!selectedRoomId}
              />
            </Upload>
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
              beforeUpload={(file) => onPhotoUpload(file, 'electricity')}
              listType='picture-card'
              onPreview={handlePreview}
              showUploadList={{ previewIcon: true }}
              disabled={uploadLoading || !selectedRoomId}
            >
              <Button
                icon={<div className='flex flex-col justify-center items-center'>
                  <PlusOutlined />
                  Upload
                </div>}
                type='text'
                loading={uploadLoading}
                disabled={!selectedRoomId}
              />
            </Upload>
          </Form.Item>

          {/* Bill Calculation */}
          {calculatedBill.totalBill > 0 && (
            <BillCalculationCard
              calculatedBill={calculatedBill}
              waterRate={waterRate}
              electricityRate={electricityRate}
              trashFee={trashFee}
              baseRent={currentRoom ? Number(currentRoom.baseRent) : 0}
            />
          )}

          {/* Submit Button */}
          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              className="w-full"
              size="large"
              loading={submitLoading}
              disabled={
                (!canEdit && !canAdminOverride && !canCreateNew) ||
                !waterPhotoUrl ||
                uploadLoading ||
                !electricityPhotoUrl ||
                submitLoading
              }
            >
              {canAdminOverride
                ? 'Update Reading (Admin Override)'
                : canEdit
                  ? 'Update Reading'
                  : canCreateNew
                    ? 'Submit New Reading'
                    : 'Cannot Submit'
              }
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <Image alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};
