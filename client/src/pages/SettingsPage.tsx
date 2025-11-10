import React, { useState } from 'react';
import { Card, Table, Button, Form, Input, Modal, Typography, Space, message, Popconfirm, InputNumber } from 'antd';
import {
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import {
  useSettingsQuery,
  useUpdateSettingMutation,
  useUpsertSettingMutation,
  useDeleteSettingMutation,
  useInitializeSettingsMutation
} from '@/hooks/useSettings';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { NotificationSettings } from '@/components/Notifications';
import { Setting } from '@/types';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: settings, isLoading } = useSettingsQuery();
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const updateMutation = useUpdateSettingMutation();
  const upsertMutation = useUpsertSettingMutation();
  const deleteMutation = useDeleteSettingMutation();
  const initializeMutation = useInitializeSettingsMutation();

  if (!isAdmin()) {
    return (
      <PageErrorBoundary>
        <div className="text-center py-8">
          <Text>Access denied. Admin privileges required.</Text>
        </div>
      </PageErrorBoundary>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  const handleEdit = (record: Setting) => {
    form.setFieldsValue({
      key: record.key,
      value: Number(record.value),
      description: record.description
    });
    setEditingKey(record.key);
    setIsCreating(false);
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    form.resetFields();
    setEditingKey('');
    setIsCreating(true);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (isCreating) {
        await upsertMutation.mutateAsync({
          key: values.key,
          value: values.value,
          description: values.description
        });
        message.success('Setting created successfully');
      } else {
        await updateMutation.mutateAsync({
          key: editingKey,
          value: values.value
        });
        message.success('Setting updated successfully');
      }

      setIsModalVisible(false);
      setEditingKey('');
    } catch (error) {
      message.error('Failed to save setting');
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteMutation.mutateAsync(key);
      message.success('Setting deleted successfully');
    } catch (error) {
      message.error('Failed to delete setting');
    }
  };

  const handleInitialize = async () => {
    try {
      await initializeMutation.mutateAsync();
      message.success('Default settings initialized successfully');
    } catch (error) {
      message.error('Failed to initialize settings');
    }
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      render: (text: string) => <Text strong>{text}</Text>,
      responsive: ['md'] as any
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: string | number) => (
        <Text>{new Intl.NumberFormat('vi-VN').format(Number(value))} VND</Text>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text type="secondary">{text || 'No description'}</Text>,
      responsive: ['lg'] as any
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
      responsive: ['lg'] as any
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Setting) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            <span className="hidden sm:inline">Edit</span>
          </Button>
          {!['trash_fee', 'electricity_rate', 'water_rate'].includes(record.key) && (
            <Popconfirm
              title="Are you sure you want to delete this setting?"
              onConfirm={() => handleDelete(record.key)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              >
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  // Mobile card view for settings
  const renderMobileCard = (setting: Setting) => (
    <Card
      key={setting.key}
      className="mb-3"
      size="small"
    >
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Text strong className="block">{setting.key}</Text>
            <Text className="text-lg font-semibold text-blue-600">
              {new Intl.NumberFormat('vi-VN').format(Number(setting.value))} VND
            </Text>
          </div>
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(setting)}
              size="small"
            />
            {!['trash_fee', 'electricity_rate', 'water_rate'].includes(setting.key) && (
              <Popconfirm
                title="Delete this setting?"
                onConfirm={() => handleDelete(setting.key)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Popconfirm>
            )}
          </Space>
        </div>
        {setting.description && (
          <Text type="secondary" className="text-xs block">
            {setting.description}
          </Text>
        )}
        <Text type="secondary" className="text-xs block">
          Updated: {new Date(setting.updatedAt).toLocaleDateString('vi-VN')}
        </Text>
      </div>
    </Card>
  );

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <Title level={3} className="mb-1 text-xl sm:text-2xl">System Settings</Title>
            <Text className="text-gray-600 text-sm">Manage application-wide settings and pricing</Text>
          </div>
          <Space className="flex-wrap">
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleInitialize}
              loading={initializeMutation.isPending}
              size="middle"
            >
              <span className="hidden sm:inline">Initialize Defaults</span>
              <span className="sm:hidden">Initialize</span>
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="middle"
            >
              <span className="hidden sm:inline">Add Setting</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Space>
        </div>

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Settings Table - Desktop */}
        <Card className="hidden md:block">
          <Table
            columns={columns}
            dataSource={settings}
            rowKey="key"
            pagination={false}
            loading={isLoading}
            scroll={{ x: 'max-content' }}
          />
        </Card>

        {/* Settings Cards - Mobile */}
        <div className="md:hidden">
          {isLoading ? (
            <LoadingSpinner message="Loading settings..." />
          ) : (
            settings?.map(renderMobileCard)
          )}
        </div>

        {/* Edit/Create Modal */}
        <Modal
          title={isCreating ? 'Create Setting' : 'Edit Setting'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          confirmLoading={updateMutation.isPending || upsertMutation.isPending}
          width={window.innerWidth < 640 ? '90%' : 520}
          centered
        >
          <Form
            form={form}
            layout="vertical"
            name="settingForm"
          >
            <Form.Item
              name="key"
              label="Setting Key"
              rules={[
                { required: true, message: 'Please enter setting key' },
                { pattern: /^[a-z_]+$/, message: 'Key must contain only lowercase letters and underscores' }
              ]}
            >
              <Input
                placeholder="e.g., water_rate"
                disabled={!isCreating}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="value"
              label="Value (VND)"
              rules={[
                { required: true, message: 'Please enter value' },
                { type: 'number', min: 0, message: 'Value must be a positive number' }
              ]}
            >
              <InputNumber
                placeholder="e.g., 25000"
                addonAfter="VND"
                size="large"
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>

            {isCreating && (
              <Form.Item
                name="description"
                label="Description"
              >
                <Input.TextArea
                  placeholder="Brief description of this setting"
                  rows={3}
                  size="large"
                />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <SettingOutlined className="text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <Text className="text-xs sm:text-sm font-medium text-blue-800 block">
                Settings Information
              </Text>
              <div className="text-xs text-blue-700 mt-1">
                These settings control pricing and fees across the entire application. Changes will affect all future calculations and billing. Protected settings (trash_fee, electricity_rate, water_rate) cannot be deleted but can be modified.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageErrorBoundary>
  );
};