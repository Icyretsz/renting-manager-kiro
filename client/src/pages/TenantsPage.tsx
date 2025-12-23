import React, { useState } from 'react';
import { 
  Card, 
  List, 
  Avatar, 
  Button, 
  Typography, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTenantsQuery } from '@/hooks/useTenants';
import { useRoomsQuery } from '@/hooks/useRooms';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Tenant } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

export const TenantsPage: React.FC = () => {
  const { data: user } = useUserProfile();
  const isAdmin = () => user?.role === 'ADMIN';
  const { data: tenants, isLoading: tenantsLoading } = useTenantsQuery();
  const { data: rooms } = useRoomsQuery();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [form] = Form.useForm();

  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <Text type="danger">Access denied. Admin privileges required.</Text>
      </div>
    );
  }

  if (tenantsLoading) {
    return <LoadingSpinner message="Loading tenants..." />;
  }

  const handleAddTenant = () => {
    setEditingTenant(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    form.setFieldsValue({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      roomId: tenant.roomId,
      moveInDate: tenant.moveInDate ? new Date(tenant.moveInDate) : null,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (_values: any) => {
    try {
      // Here you would call the API to create/update tenant
      // console.log('Tenant data:', values);
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving tenant:', error);
    }
  };

  const getRoomNumber = (roomId: number) => {
    const room = rooms?.find(r => r.id === roomId);
    return room?.roomNumber || roomId;
  };

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Title level={3} className="mb-1">Tenants</Title>
            <Text className="text-gray-600">
              Manage tenant information and room assignments
            </Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddTenant}
            size="small"
          >
            Add Tenant
          </Button>
        </div>

        {/* Tenants List */}
        <Card>
          <List
            dataSource={tenants}
            renderItem={(tenant) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => handleEditTenant(tenant)}
                    size="small"
                  />,
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={<UserOutlined />} 
                      className="bg-blue-500"
                    />
                  }
                  title={
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{tenant.name}</span>
                      <Tag color={tenant.isActive ? 'green' : 'red'}>
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <HomeOutlined className="mr-1" />
                        Room {getRoomNumber(tenant.roomId)}
                      </div>
                      {tenant.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MailOutlined className="mr-1" />
                          {tenant.email}
                        </div>
                      )}
                      {tenant.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneOutlined className="mr-1" />
                          {tenant.phone}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        {/* Add/Edit Tenant Modal */}
        <Modal
          title={editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter tenant name' }]}
            >
              <Input placeholder="Enter full name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: 'email', message: 'Please enter valid email' }]}
            >
              <Input placeholder="Enter email address" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone Number"
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>

            <Form.Item
              name="roomId"
              label="Room Assignment"
              rules={[{ required: true, message: 'Please select a room' }]}
            >
              <Select placeholder="Select room">
                {rooms?.map((room) => (
                  <Option 
                    key={room.id} 
                    value={room.id}
                    disabled={room.occupancyCount >= room.maxTenants}
                  >
                    Room {room.roomNumber} - Floor {room.floor} 
                    ({room.occupancyCount}/{room.maxTenants})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="moveInDate"
              label="Move-in Date"
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Divider />

            <div className="flex justify-end space-x-2">
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTenant ? 'Update' : 'Add'} Tenant
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </PageErrorBoundary>
  );
};