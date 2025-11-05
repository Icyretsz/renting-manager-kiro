import React from 'react';
import { Badge, Tooltip } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useSocketStore } from '@/stores/socketStore';

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useSocketStore();

  return (
    <Tooltip title={isConnected ? 'Real-time notifications connected' : 'Real-time notifications disconnected'}>
      <Badge 
        status={isConnected ? 'success' : 'error'} 
        dot
        style={{ marginRight: '8px' }}
      >
        {isConnected ? (
          <WifiOutlined style={{ color: '#52c41a' }} />
        ) : (
          <DisconnectOutlined style={{ color: '#ff4d4f' }} />
        )}
      </Badge>
    </Tooltip>
  );
};