import React from 'react';
import { Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

interface RefreshButtonProps {
  queryKeys: readonly (readonly (string | number | Record<string, any>)[])[];
  tooltip?: string;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'text' | 'link';
  className?: string;
  cooldownSeconds?: number;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  queryKeys,
  tooltip,
  size = 'middle',
  type = 'default',
  className = '',
  cooldownSeconds = 30,
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [cooldownRemaining, setCooldownRemaining] = React.useState(0);
  const cooldownTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const defaultTooltip = tooltip || t('common.refreshData');

  React.useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const handleRefresh = async () => {
    if (cooldownRemaining > 0) return;

    setLoading(true);
    try {
      // Invalidate all specified query keys
      await Promise.all(
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      );
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => {
        setLoading(false);
        // Start cooldown
        setCooldownRemaining(cooldownSeconds);
        
        // Start countdown timer
        cooldownTimerRef.current = setInterval(() => {
          setCooldownRemaining((prev) => {
            if (prev <= 1) {
              if (cooldownTimerRef.current) {
                clearInterval(cooldownTimerRef.current);
                cooldownTimerRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 500);
    }
  };

  const isDisabled = loading || cooldownRemaining > 0;
  const tooltipText = cooldownRemaining > 0
    ? t('common.pleaseWait', { seconds: cooldownRemaining })
    : defaultTooltip;

  return (
    <Tooltip title={tooltipText}>
      <Button
        icon={<ReloadOutlined spin={loading} />}
        onClick={handleRefresh}
        loading={loading}
        disabled={isDisabled}
        size={size}
        type={type}
        className={className}
      >
        {cooldownRemaining > 0 ? t('refresh.cooldown', { seconds: cooldownRemaining }) : t('refresh.button')}
      </Button>
    </Tooltip>
  );
};
