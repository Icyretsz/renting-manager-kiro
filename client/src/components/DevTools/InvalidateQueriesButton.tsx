import React from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { InvalidateQueriesButtonProps } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

export const InvalidateQueriesButton: React.FC<InvalidateQueriesButtonProps> = ({ 
  className = '' 
}) => {
  const queryClient = useQueryClient();

  const handleInvalidateAll = () => {
    queryClient.invalidateQueries();
    console.log('All queries invalidated for testing loading spinners');
  };

  return (
    <Button
      type="primary"
      shape="circle"
      icon={<ReloadOutlined />}
      onClick={handleInvalidateAll}
      className={`fixed top-4 left-4 z-1000 shadow-lg hover:shadow-xl transition-shadow ${className}`}
      size="large"
      title="Invalidate All Queries (Dev Tool)"
      style={{
        backgroundColor: '#ff4d4f',
        borderColor: '#ff4d4f',
        width: '56px',
        height: '56px',
      }}
    />
  );
};