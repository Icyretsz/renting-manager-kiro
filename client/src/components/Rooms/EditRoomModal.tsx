import React, { useEffect, useState } from 'react';
import { Modal, Form, InputNumber, Select, Button, message, Divider, List, Input, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { EditRoomModalProps, Tenant } from '@/types';
import { useUpdateRoomMutation, roomKeys } from '@/hooks/useRooms';
import { useCreateTenantMutation, useDeleteTenantMutation } from '@/hooks/useTenants';
import { useQueryClient } from '@tanstack/react-query';

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  room,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [tenantForm] = Form.useForm();
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  const queryClient = useQueryClient();
  const updateRoomMutation = useUpdateRoomMutation();
  const createTenantMutation = useCreateTenantMutation();
  const deleteTenantMutation = useDeleteTenantMutation();

  useEffect(() => {
    if (room && visible) {
      form.setFieldsValue({
        roomNumber: room.roomNumber,
        floor: room.floor,
        baseRent: Number(room.baseRent),
        maxTenants: room.maxTenants,
      });
      setTenants(room.tenants || []);
    }
  }, [room, visible, form]);

  const handleSubmit = async (values: any) => {
    if (!room) return;

    try {
      await updateRoomMutation.mutateAsync({
        roomId: room.id,
        data: {
          roomNumber: values.roomNumber,
          floor: values.floor,
          baseRent: values.baseRent,
          maxTenants: values.maxTenants,
        },
      });
      
      message.success('Room updated successfully');
      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error('Failed to update room');
      console.error('Update room error:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    tenantForm.resetFields();
    setShowAddTenant(false);
    setTenants([]);
    onCancel();
  };

  const handleAddTenant = async (values: any) => {
    if (!room) return;

    try {
      const newTenant = await createTenantMutation.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        roomId: room.id,
        isActive: true,
        moveInDate: new Date(),
      });
      
      if (newTenant) {
        setTenants(prev => [...prev, newTenant]);
        // Invalidate room queries to update occupancy count
        queryClient.invalidateQueries({ queryKey: roomKeys.all });
        message.success('Tenant added successfully');
        tenantForm.resetFields();
        setShowAddTenant(false);
      }
    } catch (error) {
      message.error('Failed to add tenant');
      console.error('Add tenant error:', error);
    }
  };

  const handleRemoveTenant = async (tenantId: string) => {
    try {
      await deleteTenantMutation.mutateAsync(tenantId);
      setTenants(prev => prev.filter(t => t.id !== tenantId));
      // Invalidate room queries to update occupancy count
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      message.success('Tenant removed successfully');
    } catch (error) {
      message.error('Failed to remove tenant');
      console.error('Remove tenant error:', error);
    }
  };

  return (
    <Modal
      title={`Edit Room ${room?.roomNumber}`}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      width={800}
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Form.Item
          name="roomNumber"
          label="Room Number"
          rules={[
            { required: true, message: 'Please enter room number' },
            { type: 'number', min: 1, message: 'Room number must be positive' },
          ]}
        >
          <InputNumber
            className="w-full"
            placeholder="Enter room number"
            min={1}
          />
        </Form.Item>

        <Form.Item
          name="floor"
          label="Floor"
          rules={[{ required: true, message: 'Please select floor' }]}
        >
          <Select placeholder="Select floor">
            <Select.Option value={1}>Floor 1</Select.Option>
            <Select.Option value={2}>Floor 2</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="baseRent"
          label="Base Rent (VNĐ)"
          rules={[
            { required: true, message: 'Please enter base rent' },
            { type: 'number', min: 0, message: 'Base rent must be non-negative' },
          ]}
        >
          <InputNumber
            className="w-full"
            placeholder="Enter base rent"
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
          />
        </Form.Item>

        <Form.Item
          name="maxTenants"
          label="Maximum Tenants"
          rules={[
            { required: true, message: 'Please enter maximum tenants' },
            { type: 'number', min: 1, message: 'Maximum tenants must be at least 1' },
          ]}
        >
          <InputNumber
            className="w-full"
            placeholder="Enter maximum tenants"
            min={1}
          />
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end gap-2">
          <Button onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={updateRoomMutation.isPending}
          >
            Update Room
          </Button>
        </Form.Item>
      </Form>

      <Divider />

      {/* Tenant Management Section */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium">Tenants ({tenants.length}/{form.getFieldValue('maxTenants') || room?.maxTenants})</h4>
          {tenants.length < (form.getFieldValue('maxTenants') || room?.maxTenants || 0) && (
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={() => setShowAddTenant(true)}
              size="small"
            >
              Add Tenant
            </Button>
          )}
        </div>

        {/* Add Tenant Form */}
        {showAddTenant && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <Form
              form={tenantForm}
              layout="vertical"
              onFinish={handleAddTenant}
              size="small"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="name"
                  label="Name"
                  rules={[{ required: true, message: 'Please enter tenant name' }]}
                >
                  <Input placeholder="Enter tenant name" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input placeholder="Enter email (optional)" />
                </Form.Item>
              </div>
              <Form.Item
                name="phone"
                label="Phone"
              >
                <Input placeholder="Enter phone number (optional)" />
              </Form.Item>
              <div className="flex justify-end gap-2">
                <Button size="small" onClick={() => {
                  setShowAddTenant(false);
                  tenantForm.resetFields();
                }}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="small"
                  loading={createTenantMutation.isPending}
                >
                  Add Tenant
                </Button>
              </div>
            </Form>
          </div>
        )}

        {/* Tenants List */}
        <List
          dataSource={tenants}
          locale={{ emptyText: 'No tenants in this room' }}
          renderItem={(tenant) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="delete"
                  title="Remove tenant"
                  description="Are you sure you want to remove this tenant?"
                  onConfirm={() => handleRemoveTenant(tenant.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    size="small"
                    loading={deleteTenantMutation.isPending}
                  />
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                avatar={<UserOutlined className="text-gray-400" />}
                title={tenant.name}
                description={
                  <Space direction="vertical" size="small">
                    {tenant.email && <span className="text-sm text-gray-600">{tenant.email}</span>}
                    {tenant.phone && <span className="text-sm text-gray-600">{tenant.phone}</span>}
                    {tenant.moveInDate && (
                      <span className="text-xs text-gray-500">
                        Moved in: {new Date(tenant.moveInDate).toLocaleDateString()}
                      </span>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
};