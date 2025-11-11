import React, { useState } from 'react';
import { Form, message, Tabs, Typography, Pagination, TabsProps } from 'antd';
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
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import {
  UserFilters,
  TenantFilters,
  UserGroupsList,
  TenantGroupsList,
  UserModal,
  TenantModal,
  LinkUserTenantModal
} from '@/components/UserManagement';

const { Title, Text } = Typography;

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
      fingerprintId: tenant.fingerprintId,
      permanentAddress: tenant.permanentAddress,
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

  const items: TabsProps['items'] = [
    {
      key: 'users',
      label: 'Users',
      children: <div>
        <UserFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          onAddUser={handleCreateUser}
        />

        {usersLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LoadingSpinner message='Loading users...' />
          </div>
        ) : users.length > 0 ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                Showing {((userPage - 1) * userPageSize) + 1}-{Math.min(userPage * userPageSize, usersData?.pagination?.total || 0)} of {usersData?.pagination?.total || 0} users
              </Text>
            </div>

            <UserGroupsList
              users={users}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onLink={handleLinkUserTenant}
              onUnlink={handleUnlinkUserTenant}
            />

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
      </div>,
    },
    {
      key: 'tenants',
      label: 'Tenants',
      children: <div>
        <TenantFilters
          searchText={searchText}
          filterRoom={filterRoom}
          filterStatus={filterStatus}
          onSearchChange={setSearchText}
          onRoomChange={setFilterRoom}
          onStatusChange={setFilterStatus}
          onAddTenant={handleCreateTenant}
        />

        {tenantsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LoadingSpinner message='Loading tenants...' />
          </div>
        ) : filteredTenants.length > 0 ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''} found
              </Text>
            </div>

            <TenantGroupsList
              tenants={filteredTenants}
              onEdit={handleEditTenant}
              onDelete={handleDeleteTenant}
            />
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
      </div>,
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>User & Tenant Management</Title>
        <Text type="secondary">
          Manage user accounts, tenant information, and their relationships
        </Text>
      </div>

      <Tabs items={items} defaultActiveKey={activeTab} onChange={setActiveTab} />

      {/* User Modal */}
      <UserModal
        visible={userModalVisible}
        user={selectedUser}
        form={userForm}
        loading={createUserMutation.isPending || updateUserMutation.isPending}
        onClose={() => {
          setUserModalVisible(false);
          userForm.resetFields();
        }}
        onSubmit={handleUserSubmit}
      />

      {/* Tenant Modal */}
      <TenantModal
        visible={tenantModalVisible}
        tenant={selectedTenant}
        form={tenantForm}
        rooms={rooms}
        loading={createTenantMutation.isPending || updateTenantMutation.isPending}
        onClose={() => {
          setTenantModalVisible(false);
          tenantForm.resetFields();
        }}
        onSubmit={handleTenantSubmit}
      />

      {/* Link User-Tenant Modal */}
      <LinkUserTenantModal
        visible={linkModalVisible}
        user={selectedUser}
        availableTenants={availableTenantsForLinking}
        form={linkForm}
        loading={linkUserToTenantMutation.isPending}
        onClose={() => {
          setLinkModalVisible(false);
          linkForm.resetFields();
        }}
        onSubmit={handleLinkSubmit}
      />
    </div>
  );
};

export default UserManagementPage;