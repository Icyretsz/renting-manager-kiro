import React, { useEffect, useState } from 'react';
import { Modal, Form, InputNumber, Select, Button, message, Divider, List, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { EditRoomModalProps, Tenant } from '@/types';
import { useUpdateRoomMutation } from '@/hooks/useRooms';

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  room,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  const updateRoomMutation = useUpdateRoomMutation();

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
    setTenants([]);
    onCancel();
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
        </div>

        {/* Tenants List */}
        <List
          dataSource={tenants}
          locale={{ emptyText: 'No tenants in this room' }}
          renderItem={(tenant) => (
            <List.Item>
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