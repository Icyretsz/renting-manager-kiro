import { Card, Typography, Row, Col, Statistic } from 'antd';
import { HomeOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { PageErrorBoundary } from '@/components/ErrorBoundary/PageErrorBoundary';
import { UserRoomsPage } from './UserRoomsPage';
import FinancialDashboardPage from './FinancialDashboardPage';
import { CurfewQuickAccessCard } from '@/components/Curfew';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

export const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();

  const tenant = user?.tenant;

  return (
    <PageErrorBoundary>
      <div className="space-y-4">
        {/* Welcome Section */}
        <Title level={3} className="mb-4">
          {t('dashboard.welcomeBack', { name: user?.name?.split(' ')[0] })}
        </Title>

        {/* Curfew Quick Access Card - For frequent use */}
        {!isAdmin() && tenant && <CurfewQuickAccessCard tenant={tenant} />}

        {!isAdmin() && <UserRoomsPage />}

        {/* Admin Features */}
        {isAdmin() && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title={t('dashboard.totalRooms')}
                    value={18}
                    prefix={<HomeOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title={t('dashboard.thisMonth')}
                    value={`${new Date().getMonth() + 1}/${new Date().getFullYear()}`}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
            {/* <Card title={t('dashboard.adminFeatures')} extra={<DollarOutlined />}>
              <Paragraph className="mb-3">
                {t('dashboard.adminAccess')}
              </Paragraph>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <HomeOutlined className="mr-2 text-blue-500" />
                  {t('dashboard.roomTenantManagement')}
                </li>
                <li className="flex items-center">
                  <FileTextOutlined className="mr-2 text-green-500" />
                  {t('dashboard.readingApprovals')}
                </li>
                <li className="flex items-center">
                  <DollarOutlined className="mr-2 text-orange-500" />
                  {t('dashboard.financialReports')}
                </li>
              </ul>
            </Card>

            System Status
            <Card title={t('dashboard.systemStatus')}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('dashboard.authentication')}</span>
                  <span className="text-green-600 font-medium">✅ {t('common.active')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('dashboard.apiConnection')}</span>
                  <span className="text-green-600 font-medium">✅ {t('dashboard.ready')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('dashboard.roleAccess')}</span>
                  <span className="text-green-600 font-medium">✅ {t('dashboard.enabled')}</span>
                </div>
              </div>
            </Card> */}

            <FinancialDashboardPage />
          </>
        )}
      </div>
    </PageErrorBoundary>
  );
};