import React, { useState } from 'react';
import { Card, Table, Button, Form, Input, Modal, Typography, Space, message, Popconfirm } from 'antd';
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
      render: (text: string) => <Text strong>{text}</Text>
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
      render: (text: string) => <Text type="secondary">{text || 'No description'}</Text>
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Setting) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
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
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Title level={3} className="mb-1">System Settings</Title>
            <Text className="text-gray-600">Manage application-wide settings and pricing</Text>
          </div>
          <Space>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleInitialize}
              loading={initializeMutation.isPending}
            >
              Initialize Defaults
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add Setting
            </Button>
          </Space>
        </div>

        {/* Settings Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={settings}
            rowKey="key"
            pagination={false}
            loading={isLoading}
          />
        </Card>

        {/* Edit/Create Modal */}
        <Modal
          title={isCreating ? 'Create Setting' : 'Edit Setting'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          confirmLoading={updateMutation.isPending || upsertMutation.isPending}
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
              <Input
                type="number"
                placeholder="e.g., 25000"
                addonAfter="VND"
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
                />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <SettingOutlined className="text-blue-500 mt-1" />
            <div>
              <Text className="text-sm font-medium text-blue-800">
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