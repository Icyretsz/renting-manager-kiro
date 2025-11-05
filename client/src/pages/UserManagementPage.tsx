import React, { useState } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Tabs,
  Row,
  Col,
  Typography,
  Badge,
  DatePicker,
  Switch,
  Avatar,
  Collapse,
  Pagination
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LinkOutlined,
  DisconnectOutlined,
  UserOutlined,
  HomeOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useTenantsQuery, useCreateTenantMutation, useUpdateTenantMutation, useDeleteTenantMutation } from '@/hooks/useTenants';
import { useRoomsQuery } from '@/hooks/useRooms';
import { 
  useUsersQuery, 
  useCreateUserMutation, 
  useUpdateUserMutation, 
  useDeleteUserMutation,
  useLinkUserToTenantMutation,
  useUnlinkUserFromTenantMutation,

  UserWithTenant
} from '@/hooks/useUserManagement';
import { Tenant } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [tenantModalVisible, setTenantModalVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithTenant | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterRoom, setFilterRoom] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  const [userForm] = Form.useForm();
  const [tenantForm] = Form.useForm();
  const [linkForm] = Form.useForm();

  // Queries
  const { data: usersData, isLoading: usersLoading } = useUsersQuery(
    { search: searchText },
    userPage,
    userPageSize
  );
  const { data: tenants, isLoading: tenantsLoading } = useTenantsQuery();
  const { data: rooms } = useRoomsQuery();


  // Mutations
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const createTenantMutation = useCreateTenantMutation();
  const updateTenantMutation = useUpdateTenantMutation();
  const deleteTenantMutation = useDeleteTenantMutation();
  const linkUserToTenantMutation = useLinkUserToTenantMutation();
  const unlinkUserFromTenantMutation = useUnlinkUserFromTenantMutation();



  // Handle user operations
  const handleCreateUser = () => {
    setSelectedUser(null);
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleEditUser = (user: UserWithTenant) => {
    setSelectedUser(user);
    userForm.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setUserModalVisible(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      message.success('User deleted successfully');
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleUserSubmit = async (values: any) => {
    try {
      if (selectedUser) {
        await updateUserMutation.mutateAsync({
          userId: selectedUser.id,
          userData: values
        });
        message.success('User updated successfully');
      } else {
        await createUserMutation.mutateAsync({
          ...values,
          auth0Id: `auth0|${Date.now()}` // Generate temporary Auth0 ID
        });
        message.success('User created successfully');
      }
      setUserModalVisible(false);
      userForm.resetFields();
    } catch (error) {
      message.error('Failed to save user');
    }
  };

  // Handle tenant operations
  const handleCreateTenant = () => {
    setSelectedTenant(null);
    tenantForm.resetFields();
    setTenantModalVisible(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    tenantForm.setFieldsValue({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      roomId: tenant.roomId,
      moveInDate: tenant.moveInDate ? dayjs(tenant.moveInDate) : null,
      moveOutDate: tenant.moveOutDate ? dayjs(tenant.moveOutDate) : null,
      isActive: tenant.isActive
    });
    setTenantModalVisible(true);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      await deleteTenantMutation.mutateAsync(tenantId);
      message.success('Tenant deleted successfully');
    } catch (error) {
      message.error('Failed to delete tenant');
    }
  };

  const handleTenantSubmit = async (values: any) => {
    try {
      const tenantData = {
        ...values,
        moveInDate: values.moveInDate?.toDate(),
        moveOutDate: values.moveOutDate?.toDate()
      };

      if (selectedTenant) {
        await updateTenantMutation.mutateAsync({
          tenantId: selectedTenant.id,
          data: tenantData
        });
        message.success('Tenant updated successfully');
      } else {
        await createTenantMutation.mutateAsync(tenantData);
        message.success('Tenant created successfully');
      }
      setTenantModalVisible(false);
      tenantForm.resetFields();
    } catch (error) {
      message.error('Failed to save tenant');
    }
  };

  // Handle user-tenant linking
  const handleLinkUserTenant = (user: UserWithTenant) => {
    setSelectedUser(user);
    linkForm.setFieldsValue({
      userId: user.id,
      tenantId: user.tenant?.id
    });
    setLinkModalVisible(true);
  };

  const handleUnlinkUserTenant = async (user: UserWithTenant) => {
    try {
      if (user.tenant) {
        await unlinkUserFromTenantMutation.mutateAsync({
          userId: user.id,
          tenantId: user.tenant.id
        });
        message.success('User unlinked from tenant successfully');
      }
    } catch (error) {
      message.error('Failed to unlink user from tenant');
    }
  };

  const handleLinkSubmit = async (values: any) => {
    try {
      await linkUserToTenantMutation.mutateAsync({
        userId: values.userId,
        tenantId: values.tenantId
      });
      message.success('User linked to tenant successfully');
      setLinkModalVisible(false);
      linkForm.resetFields();
    } catch (error) {
      message.error('Failed to link user to tenant');
    }
  };

  // Get users from API data
  const users = usersData?.data || [];

  const filteredTenants = tenants?.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         (tenant.email && tenant.email.toLowerCase().includes(searchText.toLowerCase()));
    const matchesRoom = !filterRoom || tenant.roomId === filterRoom;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && tenant.isActive) ||
                         (filterStatus === 'inactive' && !tenant.isActive) ||
                         (filterStatus === 'linked' && tenant.userId) ||
                         (filterStatus === 'unlinked' && !tenant.userId);
    return matchesSearch && matchesRoom && matchesStatus;
  }) || [];

  // Get available tenants for linking (not already linked to another user)
  const availableTenantsForLinking = tenants?.filter(tenant => 
    !tenant.userId || tenant.userId === selectedUser?.id
  ) || [];

  // Group users by room
  const groupUsersByRoom = () => {
    const grouped: { [key: string]: UserWithTenant[] } = {
      'unlinked': [],
      'admin': []
    };

    users.forEach(user => {
      if (user.role === 'ADMIN') {
        grouped['admin'].push(user);
      } else if (user.tenant?.roomId) {
        const roomKey = `room-${user.tenant.roomId}`;
        if (!grouped[roomKey]) {
          grouped[roomKey] = [];
        }
        grouped[roomKey].push(user);
      } else {
        grouped['unlinked'].push(user);
      }
    });

    return grouped;
  };

  // Render user card
  const renderUserCard = (user: UserWithTenant) => (
    <Card
      key={user.id}
      size="small"
      style={{ marginBottom: '12px' }}
      actions={[
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEditUser(user)}
          size="small"
        >
          Edit
        </Button>,
        user.tenant ? (
          <Button
            type="text"
            icon={<DisconnectOutlined />}
            onClick={() => handleUnlinkUserTenant(user)}
            size="small"
            danger
          >
            Unlink
          </Button>
        ) : (
          <Button
            type="text"
            icon={<LinkOutlined />}
            onClick={() => handleLinkUserTenant(user)}
            size="small"
          >
            Link
          </Button>
        ),
        <Popconfirm
          title="Delete user?"
          onConfirm={() => handleDeleteUser(user.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
          >
            Delete
          </Button>
        </Popconfirm>,
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <Avatar
          icon={<UserOutlined />}
          style={{ 
            backgroundColor: user.role === 'ADMIN' ? '#ff4d4f' : '#1890ff',
            marginRight: '12px'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>{user.name}</Text>
            <Tag color={user.role === 'ADMIN' ? 'red' : 'blue'}>
              {user.role}
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <MailOutlined /> {user.email}
          </Text>
        </div>
      </div>

      {user.tenant && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: '#f6ffed', 
          borderRadius: '4px',
          border: '1px solid #b7eb8f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <HomeOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
            <Text style={{ fontSize: '12px', color: '#52c41a' }}>
              Linked to Room {user.tenant.roomId} ({user.tenant.name})
            </Text>
          </div>
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
        Created: {dayjs(user.createdAt).format('MMM DD, YYYY')}
      </div>
    </Card>
  );

  // Group tenants by room and status
  const groupTenantsByRoom = () => {
    const grouped: { [key: number]: { active: Tenant[], inactive: Tenant[] } } = {};
    
    filteredTenants.forEach(tenant => {
      if (!grouped[tenant.roomId]) {
        grouped[tenant.roomId] = { active: [], inactive: [] };
      }
      
      if (tenant.isActive) {
        grouped[tenant.roomId].active.push(tenant);
      } else {
        grouped[tenant.roomId].inactive.push(tenant);
      }
    });

    return grouped;
  };

  // Render tenant card
  const renderTenantCard = (tenant: Tenant) => (
    <Card
      key={tenant.id}
      size="small"
      style={{ marginBottom: '12px' }}
      actions={[
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEditTenant(tenant)}
          size="small"
        >
          Edit
        </Button>,
        <Popconfirm
          title="Delete tenant?"
          onConfirm={() => handleDeleteTenant(tenant.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
          >
            Delete
          </Button>
        </Popconfirm>,
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <Avatar
          icon={<UserOutlined />}
          style={{ 
            backgroundColor: tenant.isActive ? '#52c41a' : '#d9d9d9',
            marginRight: '12px'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>{tenant.name}</Text>
            <div>
              <Tag color={tenant.isActive ? 'success' : 'default'}>
                {tenant.isActive ? 'Active' : 'Inactive'}
              </Tag>
              {tenant.userId && (
                <Tag color="blue">
                  <UserOutlined /> Linked
                </Tag>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: '4px' }}>
            {tenant.email && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <MailOutlined /> {tenant.email}
                </Text>
              </div>
            )}
            {tenant.phone && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <PhoneOutlined /> {tenant.phone}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>

      {(tenant.moveInDate || tenant.moveOutDate) && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: '#f0f2f5', 
          borderRadius: '4px'
        }}>
          {tenant.moveInDate && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              Move In: {dayjs(tenant.moveInDate).format('MMM DD, YYYY')}
            </div>
          )}
          {tenant.moveOutDate && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              Move Out: {dayjs(tenant.moveOutDate).format('MMM DD, YYYY')}
            </div>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>User & Tenant Management</Title>
        <Text type="secondary">
          Manage user accounts, tenant information, and their relationships
        </Text>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Users" key="users">
            <Row gutter={[8, 8]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={16}>
                <Input
                  placeholder="Search users by name or email..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={handleCreateUser}
                  style={{ width: '100%' }}
                >
                  Add User
                </Button>
              </Col>
            </Row>

            {usersLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Loading users...</Text>
              </div>
            ) : users.length > 0 ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">
                    Showing {((userPage - 1) * userPageSize) + 1}-{Math.min(userPage * userPageSize, usersData?.pagination?.total || 0)} of {usersData?.pagination?.total || 0} users
                  </Text>
                </div>

                {(() => {
                  const groupedUsers = groupUsersByRoom();
                  const panels = [];

                  // Admin users
                  if (groupedUsers['admin']?.length > 0) {
                    panels.push(
                      <Panel 
                        header={
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#ff4d4f', marginRight: '8px' }} size="small" />
                            <Text strong>Admin Users ({groupedUsers['admin'].length})</Text>
                          </div>
                        } 
                        key="admin"
                      >
                        {groupedUsers['admin'].map(renderUserCard)}
                      </Panel>
                    );
                  }

                  // Users by room
                  Object.keys(groupedUsers)
                    .filter(key => key.startsWith('room-'))
                    .sort((a, b) => {
                      const roomA = parseInt(a.split('-')[1]);
                      const roomB = parseInt(b.split('-')[1]);
                      return roomA - roomB;
                    })
                    .forEach(roomKey => {
                      const roomNumber = roomKey.split('-')[1];
                      const roomUsers = groupedUsers[roomKey];
                      
                      panels.push(
                        <Panel 
                          header={
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar icon={<HomeOutlined />} style={{ backgroundColor: '#52c41a', marginRight: '8px' }} size="small" />
                              <Text strong>Room {roomNumber} ({roomUsers.length} user{roomUsers.length !== 1 ? 's' : ''})</Text>
                            </div>
                          } 
                          key={roomKey}
                        >
                          {roomUsers.map(renderUserCard)}
                        </Panel>
                      );
                    });

                  // Unlinked users
                  if (groupedUsers['unlinked']?.length > 0) {
                    panels.push(
                      <Panel 
                        header={
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#d9d9d9', marginRight: '8px' }} size="small" />
                            <Text strong>Unlinked Users ({groupedUsers['unlinked'].length})</Text>
                          </div>
                        } 
                        key="unlinked"
                      >
                        {groupedUsers['unlinked'].map(renderUserCard)}
                      </Panel>
                    );
                  }

                  return (
                    <Collapse defaultActiveKey={['admin', 'unlinked']} ghost>
                      {panels}
                    </Collapse>
                  );
                })()}

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <Pagination
                    current={userPage}
                    pageSize={userPageSize}
                    total={usersData?.pagination?.total || 0}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} users`}
                    onChange={(newPage, newPageSize) => {
                      setUserPage(newPage);
                      if (newPageSize !== userPageSize) {
                        setUserPageSize(newPageSize);
                      }
                    }}
                    pageSizeOptions={['5', '10', '20', '50']}
                  />
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">No users found</Text>
              </div>
            )}
        </TabPane>

        <TabPane tab="Tenants" key="tenants">
            <Row gutter={[8, 8]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={12}>
                <Input
                  placeholder="Search tenants..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Select
                  placeholder="Room"
                  style={{ width: '100%' }}
                  allowClear
                  value={filterRoom}
                  onChange={setFilterRoom}
                >
                  {Array.from({ length: 18 }, (_, i) => i + 1).map(roomNum => (
                    <Option key={roomNum} value={roomNum}>Room {roomNum}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={6}>
                <Select
                  placeholder="Status"
                  style={{ width: '100%' }}
                  allowClear
                  value={filterStatus}
                  onChange={setFilterStatus}
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="linked">Linked</Option>
                  <Option value="unlinked">Not Linked</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={8}>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={handleCreateTenant}
                  style={{ width: '100%' }}
                >
                  Add Tenant
                </Button>
              </Col>
            </Row>

            {tenantsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Loading tenants...</Text>
              </div>
            ) : filteredTenants.length > 0 ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">
                    {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''} found
                  </Text>
                </div>

                {(() => {
                  const groupedTenants = groupTenantsByRoom();
                  const roomNumbers = Object.keys(groupedTenants).map(Number).sort((a, b) => a - b);
                  
                  return (
                    <Collapse defaultActiveKey={roomNumbers.map(num => `room-${num}`)} ghost>
                      {roomNumbers.map(roomNumber => {
                        const roomData = groupedTenants[roomNumber];
                        const activeTenants = roomData.active;
                        const inactiveTenants = roomData.inactive;
                        const totalTenants = activeTenants.length + inactiveTenants.length;
                        const floor = Math.ceil(roomNumber / 9);
                        
                        return (
                          <Panel 
                            header={
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar icon={<HomeOutlined />} style={{ backgroundColor: '#1890ff', marginRight: '8px' }} size="small" />
                                  <Text strong>Room {roomNumber} - Floor {floor}</Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {activeTenants.length > 0 && (
                                    <Badge count={activeTenants.length} style={{ backgroundColor: '#52c41a' }} title="Active tenants" />
                                  )}
                                  {inactiveTenants.length > 0 && (
                                    <Badge count={inactiveTenants.length} style={{ backgroundColor: '#d9d9d9' }} title="Inactive tenants" />
                                  )}
                                </div>
                              </div>
                            } 
                            key={`room-${roomNumber}`}
                          >
                            {/* Active Tenants */}
                            {activeTenants.length > 0 && (
                              <div style={{ marginBottom: inactiveTenants.length > 0 ? '16px' : '0' }}>
                                <div style={{ 
                                  marginBottom: '8px', 
                                  padding: '4px 8px', 
                                  backgroundColor: '#f6ffed', 
                                  borderRadius: '4px',
                                  border: '1px solid #b7eb8f'
                                }}>
                                  <Text strong style={{ color: '#52c41a', fontSize: '12px' }}>
                                    Current Tenants ({activeTenants.length})
                                  </Text>
                                </div>
                                {activeTenants.map(renderTenantCard)}
                              </div>
                            )}

                            {/* Inactive Tenants - Collapsed by default */}
                            {inactiveTenants.length > 0 && (
                              <Collapse ghost size="small">
                                <Panel 
                                  header={
                                    <div style={{ 
                                      padding: '4px 8px', 
                                      backgroundColor: '#fff2e8', 
                                      borderRadius: '4px',
                                      border: '1px solid #ffbb96',
                                      margin: '-4px -8px'
                                    }}>
                                      <Text strong style={{ color: '#fa8c16', fontSize: '12px' }}>
                                        Moved Out ({inactiveTenants.length})
                                      </Text>
                                    </div>
                                  }
                                  key={`inactive-${roomNumber}`}
                                >
                                  {inactiveTenants.map(renderTenantCard)}
                                </Panel>
                              </Collapse>
                            )}

                            {/* Empty room message */}
                            {activeTenants.length === 0 && inactiveTenants.length === 0 && (
                              <div style={{ 
                                textAlign: 'center', 
                                padding: '20px 0', 
                                color: '#999',
                                fontStyle: 'italic'
                              }}>
                                No tenants in this room
                              </div>
                            )}
                          </Panel>
                        );
                      })}
                    </Collapse>
                  );
                })()}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">No tenants found</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Try adjusting your filters or add a new tenant
                  </Text>
                </div>
              </div>
            )}
        </TabPane>
      </Tabs>

      {/* User Modal */}
      <Modal
        title={selectedUser ? 'Edit User' : 'Create User'}
        open={userModalVisible}
        onCancel={() => {
          setUserModalVisible(false);
          userForm.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: '500px' }}
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleUserSubmit}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter the full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter the email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select role">
              <Option value="USER">User</Option>
              <Option value="ADMIN">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setUserModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {selectedUser ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Tenant Modal */}
      <Modal
        title={selectedTenant ? 'Edit Tenant' : 'Create Tenant'}
        open={tenantModalVisible}
        onCancel={() => {
          setTenantModalVisible(false);
          tenantForm.resetFields();
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: '600px' }}
      >
        <Form
          form={tenantForm}
          layout="vertical"
          onFinish={handleTenantSubmit}
        >
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter the full name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="roomId"
                label="Room"
                rules={[{ required: true, message: 'Please select a room' }]}
              >
                <Select placeholder="Select room">
                  {rooms?.map(room => (
                    <Option key={room.id} value={room.id}>
                      Room {room.roomNumber} (Floor {room.floor})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Phone"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="moveInDate"
                label="Move In Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="moveOutDate"
                label="Move Out Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setTenantModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createUserMutation.isPending || updateUserMutation.isPending || createTenantMutation.isPending || updateTenantMutation.isPending}
              >
                {selectedTenant ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Link User-Tenant Modal */}
      <Modal
        title="Link User to Tenant"
        open={linkModalVisible}
        onCancel={() => {
          setLinkModalVisible(false);
          linkForm.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: '500px' }}
      >
        <Form
          form={linkForm}
          layout="vertical"
          onFinish={handleLinkSubmit}
        >
          <Form.Item
            name="userId"
            label="User"
          >
            <Input disabled value={selectedUser?.name} />
          </Form.Item>

          <Form.Item
            name="tenantId"
            label="Tenant"
            rules={[{ required: true, message: 'Please select a tenant' }]}
          >
            <Select placeholder="Select tenant to link">
              {availableTenantsForLinking.map(tenant => (
                <Option key={tenant.id} value={tenant.id}>
                  {tenant.name} - Room {tenant.roomId}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setLinkModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={linkUserToTenantMutation.isPending}
              >
                Link
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;