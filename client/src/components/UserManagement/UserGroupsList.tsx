import React from 'react';
import { Collapse, Avatar, Typography, CollapseProps } from 'antd';
import { UserOutlined, HomeOutlined } from '@ant-design/icons';
import { UserWithTenant } from '@/hooks/useUserManagement';
import { UserCard } from './UserCard';

const { Text } = Typography;

interface UserGroupsListProps {
  users: UserWithTenant[];
  onEdit: (user: UserWithTenant) => void;
  onDelete: (userId: string) => void;
  onLink: (user: UserWithTenant) => void;
  onUnlink: (user: UserWithTenant) => void;
}

export const UserGroupsList: React.FC<UserGroupsListProps> = ({
  users,
  onEdit,
  onDelete,
  onLink,
  onUnlink
}) => {
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

  const groupedUsers = groupUsersByRoom();
  const items: CollapseProps['items'] = [];

  // Admin users
  if (groupedUsers['admin']?.length > 0) {
    items.push({
      key: 'admin',
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#ff4d4f', marginRight: '8px' }} size="small" />
          <Text strong>Admin Users ({groupedUsers['admin'].length})</Text>
        </div>
      ),
      children: groupedUsers['admin'].map(user => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
          onLink={onLink}
          onUnlink={onUnlink}
        />
      ))
    });
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
      
      items.push({
        key: roomKey,
        label: (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<HomeOutlined />} style={{ backgroundColor: '#52c41a', marginRight: '8px' }} size="small" />
            <Text strong>Room {roomNumber} ({roomUsers.length} user{roomUsers.length !== 1 ? 's' : ''})</Text>
          </div>
        ),
        children: roomUsers.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            onLink={onLink}
            onUnlink={onUnlink}
          />
        ))
      });
    });

  // Unlinked users
  if (groupedUsers['unlinked']?.length > 0) {
    items.push({
      key: 'unlinked',
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#d9d9d9', marginRight: '8px' }} size="small" />
          <Text strong>Unlinked Users ({groupedUsers['unlinked'].length})</Text>
        </div>
      ),
      children: groupedUsers['unlinked'].map(user => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
          onLink={onLink}
          onUnlink={onUnlink}
        />
      ))
    });
  }

  return (
    <Collapse items={items} defaultActiveKey={['admin', 'unlinked']} ghost />
  );
};
