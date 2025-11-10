import React from 'react';
import { Collapse, Avatar, Typography, Badge } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Tenant } from '@/types';
import { TenantCard } from './TenantCard';

const { Panel } = Collapse;
const { Text } = Typography;

interface TenantGroupsListProps {
  tenants: Tenant[];
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
}

export const TenantGroupsList: React.FC<TenantGroupsListProps> = ({
  tenants,
  onEdit,
  onDelete
}) => {
  const groupTenantsByRoom = () => {
    const grouped: { [key: number]: { active: Tenant[], inactive: Tenant[] } } = {};
    
    tenants.forEach(tenant => {
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

  const groupedTenants = groupTenantsByRoom();
  const roomNumbers = Object.keys(groupedTenants).map(Number).sort((a, b) => a - b);
  
  return (
    <Collapse defaultActiveKey={roomNumbers.map(num => `room-${num}`)} ghost>
      {roomNumbers.map(roomNumber => {
        const roomData = groupedTenants[roomNumber];
        const activeTenants = roomData.active;
        const inactiveTenants = roomData.inactive;
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
                {activeTenants.map(tenant => (
                  <TenantCard
                    key={tenant.id}
                    tenant={tenant}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
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
                  {inactiveTenants.map(tenant => (
                    <TenantCard
                      key={tenant.id}
                      tenant={tenant}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
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
};
