import { Button, Card, Typography } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';

const { Title, Paragraph } = Typography;

export const LoginPage = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const { t } = useTranslation();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Title level={2} className="mb-2">
            {t('header.rentalManager')}
          </Title>
          <Paragraph className="text-gray-600">
            {t('auth.pleaseSignIn')}
          </Paragraph>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<LoginOutlined />}
          onClick={() => loginWithRedirect()}
          className="w-full"
        >
          {t('auth.signInWith')}
        </Button>

        <div className="mt-6 text-center">
          <Paragraph className="text-sm text-gray-500">
            {t('auth.secureAuth')}
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};
