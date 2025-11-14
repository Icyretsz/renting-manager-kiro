import React from 'react';
import { Tag } from 'antd';
import { WifiOutlined, SyncOutlined, DisconnectOutlined } from '@ant-design/icons';
import { ConnectionStatusProps } from '@/types';

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  isPolling 
}) => {
  if (isConnected) {
    return (
      <Tag icon={<WifiOutlined />} color="success" style={{ fontSize: '12px' }}>
        Connected
      </Tag>
    );
  }
  
  if (isPolling) {
    return (
      <Tag icon={<SyncOutlined spin />} color="processing" style={{ fontSize: '12px' }}>
        Checking...
      </Tag>
    );
  }
  
  return (
    <Tag icon={<DisconnectOutlined />} color="default" style={{ fontSize: '12px' }}>
      Offline
    </Tag>
  );
};
