import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Upload, Divider, Alert, Modal, Image, UploadFile } from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { MeterReadingFormProps } from '@/types';
import { BillCalculationCard } from './BillCalculationCard';
import getBase64 from '@/utils/getBase64';
import { useTranslation } from 'react-i18next';

const toNumber = (value: string | number): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const MeterReadingForm: React.FC<MeterReadingFormProps> = ({
  form,
  previousReading,
  currentRoom,
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
  onValuesChange,
  waterPhotoList,
  setWaterPhotoList,
  electricityPhotoList,
  setElectricityPhotoList
}) => {
  const { t } = useTranslation();
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

  const handleWaterChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setWaterPhotoList(fileList);
  };

  const handleElectricityChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setElectricityPhotoList(fileList);
  };

  const getTitle = () => {
    if (canAdminOverride) return t('meterReadings.currentMonthReadingAdminOverride');
    if (canEdit) return t('meterReadings.editCurrentMonthReading');
    if (canCreateNew) return t('meterReadings.submitNewReading');
    return t('meterReadings.currentMonthReading');
  };

  return (
    <>
      <Card title={getTitle()} size="small">
        {hasApprovedReading && !canAdminOverride ? (
          <Alert
            message={t('meterReadings.readingAlreadyApproved')}
            description={t('meterReadings.readingAlreadyApprovedDesc')}
            type="success"
            showIcon
            className="mb-4"
          />
        ) : hasPendingReading && !canEdit && !canCreateNew ? (
          <Alert
            message={t('meterReadings.readingPendingReview')}
            description={t('meterReadings.readingPendingReviewDesc')}
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
            label={t('meterReadings.waterMeterReading')}
            rules={[
              { required: true, message: t('meterReadings.pleaseEnterWaterReading') },
              {
                validator: (_, value) => {
                  if (previousReading && value < toNumber(previousReading.waterReading)) {
                    return Promise.reject(t('meterReadings.readingCannotBeLessThanPrevious'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              className="w-full"
              placeholder={t('meterReadings.enterWaterReading')}
              precision={1}
              min={0}
              step={0.1}
            />
          </Form.Item>

          {/* Water Photo Upload */}
          <Form.Item label={t('meterReadings.waterMeterPhoto')}>
            <Upload
              accept="image/*"
              beforeUpload={(file) => onPhotoUpload(file, 'water')}
              listType="picture"
              fileList={waterPhotoList}
              onChange={handleWaterChange}
              onPreview={handlePreview}
              disabled={uploadLoading || !selectedRoomId || (!canEdit && !canAdminOverride && !canCreateNew)}
              maxCount={1}
            >
              {waterPhotoList.length === 0 && (
                <Button
                  type="dashed"
                  className="h-[50px] w-full"
                  loading={uploadLoading}
                  disabled={uploadLoading || !selectedRoomId}
                >
                  <div className="flex flex-col justify-center items-center">
                    <PlusOutlined />
                    {t('meterReadings.upload')}
                  </div>
                </Button>
              )}
            </Upload>
          </Form.Item>

          <Divider />

          {/* Electricity Reading */}
          <Form.Item
            name="electricityReading"
            label={t('meterReadings.electricityMeterReading')}
            rules={[
              { required: true, message: t('meterReadings.pleaseEnterElectricityReading') },
              {
                validator: (_, value) => {
                  if (previousReading && value < toNumber(previousReading.electricityReading)) {
                    return Promise.reject(t('meterReadings.readingCannotBeLessThanPrevious'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              className="w-full"
              placeholder={t('meterReadings.enterElectricityReading')}
              precision={1}
              min={0}
              step={0.1}
            />
          </Form.Item>

          {/* Electricity Photo Upload */}
          <Form.Item label={t('meterReadings.electricityMeterPhoto')}>
            <Upload
              accept="image/*"
              beforeUpload={(file) => onPhotoUpload(file, 'electricity')}
              listType="picture"
              fileList={electricityPhotoList}
              onChange={handleElectricityChange}
              onPreview={handlePreview}
              disabled={uploadLoading || !selectedRoomId || (!canEdit && !canAdminOverride && !canCreateNew)}
              maxCount={1}
            >
              {electricityPhotoList.length === 0 && (
                <Button
                  type="dashed"
                  className="h-[50px] w-full"
                  loading={uploadLoading}
                  disabled={uploadLoading || !selectedRoomId}
                >
                  <div className="flex flex-col justify-center items-center">
                    <PlusOutlined />
                    {t('meterReadings.upload')}
                  </div>
                </Button>
              )}
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
                waterPhotoList.length === 0 ||
                electricityPhotoList.length === 0 ||
                uploadLoading ||
                submitLoading
              }
            >
              {canAdminOverride
                ? t('meterReadings.updateReadingAdminOverride')
                : canEdit
                  ? t('meterReadings.updateReading')
                  : canCreateNew
                    ? t('meterReadings.submitNewReading')
                    : t('meterReadings.cannotSubmit')
              }
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(''),
          }}
          src={previewImage}
        />
      )}
    </>
  );
};