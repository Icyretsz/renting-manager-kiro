import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserProfile } from '@/hooks/useUserProfile';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { logout: auth0Logout } = useAuth0();

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <div className="space-x-4">
            <Button type="primary" onClick={handleGoBack}>
              Go Back
            </Button>
            <Button onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        }
      />
    </div>
  );
};