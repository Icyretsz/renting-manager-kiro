import { Button, Card, Typography } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Title level={2} className="mb-2">
            Rental Management System
          </Title>
          <Paragraph className="text-gray-600">
            Please sign in to access your account
          </Paragraph>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<LoginOutlined />}
          onClick={login}
          className="w-full"
        >
          Sign In with Auth0
        </Button>

        <div className="mt-6 text-center">
          <Paragraph className="text-sm text-gray-500">
            Secure authentication powered by Auth0
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};