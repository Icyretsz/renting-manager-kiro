import { Card, Typography, Row, Col, Statistic } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { UserRoomsPage } from './UserRoomsPage';
import FinancialDashboardPage from './FinancialDashboardPage';

const { Title, Paragraph } = Typography;

export const DashboardPage = () => {
  const { user, isAdmin } = useAuth();

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Welcome Section */}
        <div className="mb-6">
          <Title level={3} className="mb-1">
            Welcome, {user?.name?.split(' ')[0]}
          </Title>
          <Paragraph className="text-gray-600 mb-0">
            {isAdmin() ? 'Administrator' : 'User'} • {user?.email}
          </Paragraph>
        </div>

        {!isAdmin() && <UserRoomsPage />}

        {/* Admin Features */}
        {isAdmin() && (
          <>
            {/* Quick Stats */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Total Rooms"
                    value={18}
                    prefix={<HomeOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="This Month"
                    value="Nov 2024"
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
            <Card title="Admin Features" extra={<DollarOutlined />}>
              <Paragraph className="mb-3">
                As an admin, you have access to:
              </Paragraph>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <HomeOutlined className="mr-2 text-blue-500" />
                  Room & tenant management
                </li>
                <li className="flex items-center">
                  <FileTextOutlined className="mr-2 text-green-500" />
                  Reading approvals
                </li>
                <li className="flex items-center">
                  <DollarOutlined className="mr-2 text-orange-500" />
                  Financial reports
                </li>
              </ul>
            </Card>

            {/* System Status */}
            <Card title="System Status">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Authentication</span>
                  <span className="text-green-600 font-medium">✅ Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">API Connection</span>
                  <span className="text-green-600 font-medium">✅ Ready</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Role Access</span>
                  <span className="text-green-600 font-medium">✅ Enabled</span>
                </div>
              </div>
            </Card>
            
            <FinancialDashboardPage />

            </>)}
      </div>
    </PageErrorBoundary>
  );
};