import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Select, 
  DatePicker, 
  Button, 
  Table, 
  Typography, 
  Space,
  Progress,
  Tag
} from 'antd';
import {
  DollarOutlined,
  LineChartOutlined,
  HomeOutlined,
  DownloadOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  useFinancialSummaryQuery, 
  useMonthlyFinancialReportQuery,
  useBillingRecordsQuery,
  useExportFinancialDataMutation,
  useYearlyTrendDataQuery
} from '@/hooks/useBilling';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const FinancialDashboardPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');

  // Queries
  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummaryQuery({
    month: viewType === 'monthly' ? selectedMonth : undefined,
    year: selectedYear
  });
  
  const { data: monthlyReport, isLoading: monthlyLoading } = useMonthlyFinancialReportQuery(
    selectedMonth, 
    selectedYear
  );
  
  const { data: recentBilling } = useBillingRecordsQuery(
    { year: selectedYear, month: viewType === 'monthly' ? selectedMonth : undefined },
    1,
    10
  );
  
  const { data: yearlyTrendData } = useYearlyTrendDataQuery(selectedYear);

  // Mutations
  const exportDataMutation = useExportFinancialDataMutation();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const filters = {
        year: selectedYear,
        ...(viewType === 'monthly' && { month: selectedMonth })
      };
      const blob = await exportDataMutation.mutateAsync(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${selectedYear}-${viewType === 'monthly' ? selectedMonth : 'full'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  // Prepare chart data
  const prepareMonthlyChartData = () => {
    if (!monthlyReport) return [];
    
    return monthlyReport.roomBreakdown.map(room => ({
      room: `Room ${room.roomNumber}`,
      floor: `Floor ${room.floor}`,
      totalAmount: room.totalAmount,
      waterCost: room.waterCost,
      electricityCost: room.electricityCost,
      baseRent: room.baseRent,
      trashFee: room.trashFee,
      paymentStatus: room.paymentStatus,
      waterUsage: room.waterUsage,
      electricityUsage: room.electricityUsage
    }));
  };

  // Prepare payment status data for pie chart
  const preparePaymentStatusData = () => {
    if (!financialSummary) return [];
    
    return [
      { name: 'Paid', value: financialSummary.totalPaid, color: '#52c41a' },
      { name: 'Unpaid', value: financialSummary.totalUnpaid, color: '#faad14' },
      { name: 'Overdue', value: financialSummary.totalOverdue, color: '#ff4d4f' }
    ].filter(item => item.value > 0);
  };

  const chartData = prepareMonthlyChartData();
  const paymentStatusData = preparePaymentStatusData();

  // Calculate occupancy rate
  const occupancyRate = financialSummary 
    ? (financialSummary.occupiedRooms / financialSummary.roomCount) * 100 
    : 0;

  // Calculate collection rate
  const collectionRate = financialSummary && financialSummary.totalIncome > 0
    ? (financialSummary.totalPaid / financialSummary.totalIncome) * 100
    : 0;

  // Recent billing table columns
  const recentBillingColumns = [
    {
      title: 'Room',
      key: 'room',
      render: (record: any) => `Room ${record.room?.roomNumber || record.roomId}`,
    },
    {
      title: 'Period',
      key: 'period',
      render: (record: any) => `${record.month}/${record.year}`,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'success' : status === 'OVERDUE' ? 'error' : 'warning'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Financial Dashboard</Title>
        <Text type="secondary">
          Comprehensive financial analytics and reporting for rental management
        </Text>
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Select
            value={viewType}
            onChange={setViewType}
            style={{ width: 120 }}
          >
            <Option value="monthly">Monthly</Option>
            <Option value="yearly">Yearly</Option>
          </Select>
          
          {viewType === 'monthly' && (
            <DatePicker
              picker="month"
              value={dayjs().month(selectedMonth - 1).year(selectedYear)}
              onChange={(date) => {
                if (date) {
                  setSelectedMonth(date.month() + 1);
                  setSelectedYear(date.year());
                }
              }}
            />
          )}
          
          {viewType === 'yearly' && (
            <DatePicker
              picker="year"
              value={dayjs().year(selectedYear)}
              onChange={(date) => {
                if (date) {
                  setSelectedYear(date.year());
                }
              }}
            />
          )}
          
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exportDataMutation.isPending}
          >
            Export Report
          </Button>
        </Space>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Income"
              value={financialSummary?.totalIncome || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<DollarOutlined />}
              loading={summaryLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Collection Rate"
              value={collectionRate}
              precision={1}
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: collectionRate >= 80 ? '#3f8600' : '#cf1322' }}
              loading={summaryLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Occupancy Rate"
              value={occupancyRate}
              precision={1}
              suffix="%"
              prefix={<HomeOutlined />}
              valueStyle={{ color: occupancyRate >= 80 ? '#3f8600' : '#faad14' }}
              loading={summaryLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average Room Income"
              value={financialSummary?.averageRoomIncome || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<PieChartOutlined />}
              loading={summaryLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Payment Status Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Payment Status Distribution" loading={summaryLoading}>
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Text type="secondary">No payment data available</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Collection Progress">
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Paid: {formatCurrency(financialSummary?.totalPaid || 0)}</Text>
              <Progress 
                percent={collectionRate} 
                strokeColor="#52c41a"
                style={{ marginTop: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Unpaid: {formatCurrency(financialSummary?.totalUnpaid || 0)}</Text>
              <Progress 
                percent={financialSummary?.totalIncome ? (financialSummary.totalUnpaid / financialSummary.totalIncome) * 100 : 0}
                strokeColor="#faad14"
                style={{ marginTop: '8px' }}
              />
            </div>
            <div>
              <Text strong>Overdue: {formatCurrency(financialSummary?.totalOverdue || 0)}</Text>
              <Progress 
                percent={financialSummary?.totalIncome ? (financialSummary.totalOverdue / financialSummary.totalIncome) * 100 : 0}
                strokeColor="#ff4d4f"
                style={{ marginTop: '8px' }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {viewType === 'monthly' && chartData.length > 0 && (
          <Col xs={24}>
            <Card title={`Room Revenue Breakdown - ${selectedMonth}/${selectedYear}`} loading={monthlyLoading}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="room" />
                  <YAxis tickFormatter={(value) => `₫${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="baseRent" stackId="a" fill="#8884d8" name="Base Rent" />
                  <Bar dataKey="waterCost" stackId="a" fill="#82ca9d" name="Water Cost" />
                  <Bar dataKey="electricityCost" stackId="a" fill="#ffc658" name="Electricity Cost" />
                  <Bar dataKey="trashFee" stackId="a" fill="#ff7300" name="Trash Fee" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}
        
        {viewType === 'yearly' && yearlyTrendData && (
          <Col xs={24}>
            <Card title={`Income Trend - ${selectedYear}`}>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={yearlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis tickFormatter={(value) => `₫${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Area type="monotone" dataKey="totalIncome" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Income" />
                  <Area type="monotone" dataKey="totalPaid" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Paid" />
                  <Area type="monotone" dataKey="totalUnpaid" stackId="3" stroke="#ffc658" fill="#ffc658" name="Unpaid" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}
      </Row>

      {/* Recent Billing Activity */}
      <Card title="Recent Billing Activity">
        <Table
          columns={recentBillingColumns}
          dataSource={recentBilling?.data || []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default FinancialDashboardPage;