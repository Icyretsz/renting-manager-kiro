import React, { useState } from 'react';
import { Card, Button, Tag, Modal, QRCode, Alert, Select, DatePicker, Typography, Statistic, Row, Col, Divider, Avatar, Pagination } from 'antd';
import { EyeOutlined, QrcodeOutlined, DownloadOutlined, DollarOutlined, HomeOutlined, CalendarOutlined, DropboxOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { 
  useBillingRecordsQuery, 
  useBillingRecordQuery, 
  useGeneratePaymentLinkMutation, 
  useFreshQRCodeQuery,
  useFinancialSummaryQuery,
  useExportFinancialDataMutation 
} from '@/hooks/useBilling';
import { BillingRecord } from '@/types';
import dayjs from 'dayjs';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

const { Title, Text } = Typography;
const { Option } = Select;

const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [qrCodeModalVisible, setQrCodeModalVisible] = useState(false);

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const { data: billingData, isLoading: billingLoading } = useBillingRecordsQuery(filters, page, pageSize);
  const { data: selectedRecordDetails } = useBillingRecordQuery(selectedRecord?.id || '');
  const { data: financialSummary } = useFinancialSummaryQuery();
  
  // Mutations
  const generatePaymentLinkMutation = useGeneratePaymentLinkMutation();
  const exportDataMutation = useExportFinancialDataMutation();
  
  // Fresh QR code query (only when modal is visible and record is unpaid)
  const { data: freshQRData, isLoading: qrLoading } = useFreshQRCodeQuery(
    selectedRecord?.id || '',
    qrCodeModalVisible && selectedRecord?.paymentStatus === 'UNPAID'
  );

  const isAdmin = user?.role === 'ADMIN';

  // Handle view bill details
  const handleViewDetails = (record: BillingRecord) => {
    setSelectedRecord(record);
    setPaymentModalVisible(true);
  };

  // Handle generate QR code for payment
  const handleGenerateQRCode = async (record: BillingRecord) => {
    if (record.paymentStatus === 'PAID') {
      Modal.info({
        title: 'Payment Already Completed',
        content: 'This bill has already been paid.',
      });
      return;
    }

    setSelectedRecord(record);
    setQrCodeModalVisible(true);
  };

  // Handle payment link generation
  const handleGeneratePaymentLink = async (billingRecordId: string) => {
    try {
      const paymentLink = await generatePaymentLinkMutation.mutateAsync(billingRecordId);
      
      // Open payment URL in new tab
      window.open(paymentLink.checkoutUrl, '_blank');
    } catch (error) {
      console.error('Failed to generate payment link:', error);
    }
  };

  // Handle export data
  const handleExportData = async () => {
    try {
      const blob = await exportDataMutation.mutateAsync(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `billing-report-${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'OVERDUE': return 'error';
      case 'UNPAID': return 'warning';
      default: return 'default';
    }
  };

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  // Get month name
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  // Render billing card for mobile-friendly view
  const renderBillingCard = (record: BillingRecord) => (
    <Card
      key={record.id}
      style={{ marginBottom: '16px' }}
      hoverable
      actions={[
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
          size="small"
        >
          Details
        </Button>,
        record.paymentStatus === 'UNPAID' ? (
          <Button
            type="text"
            icon={<QrcodeOutlined />}
            onClick={() => handleGenerateQRCode(record)}
            size="small"
            style={{ color: '#1890ff' }}
          >
            Pay Now
          </Button>
        ) : (
          <Button type="text" disabled size="small">
            Paid
          </Button>
        ),
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            icon={<HomeOutlined />}
            style={{ backgroundColor: '#1890ff', marginRight: '12px' }}
          />
          <div>
            <Text strong style={{ fontSize: '16px' }}>
              Room {record.room?.roomNumber}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Floor {record.room?.floor}
            </Text>
          </div>
        </div>
        <Tag color={getPaymentStatusColor(record.paymentStatus)} style={{ margin: 0 }}>
          {record.paymentStatus}
        </Tag>
      </div>

      <Row gutter={16} style={{ marginBottom: '12px' }}>
        <Col span={12}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <CalendarOutlined style={{ marginRight: '8px', color: '#666' }} />
            <Text style={{ fontSize: '14px' }}>
              {getMonthName(record.month)} {record.year}
            </Text>
          </div>
        </Col>
        <Col span={12}>
          <div style={{ textAlign: 'right' }}>
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              {formatCurrency(record.totalAmount)}
            </Text>
          </div>
        </Col>
      </Row>

      <Row gutter={8} style={{ marginBottom: '12px' }}>
        <Col span={12}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
            <DropboxOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
            <Text style={{ fontSize: '12px' }}>
              {parseFloat(record.waterUsage.toString()).toFixed(1)} units
            </Text>
          </div>
        </Col>
        <Col span={12}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
            <ThunderboltOutlined style={{ marginRight: '6px', color: '#faad14' }} />
            <Text style={{ fontSize: '12px' }}>
              {parseFloat(record.electricityUsage.toString()).toFixed(1)} units
            </Text>
          </div>
        </Col>
      </Row>

      {record.paymentDate && (
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Paid on {dayjs(record.paymentDate).format('MMM DD, YYYY')}
          </Text>
        </div>
      )}

      {isAdmin && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Created: {dayjs(record.createdAt).format('MMM DD, YYYY')}
          </Text>
        </div>
      )}
    </Card>
  );

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          {isAdmin ? 'Billing Management' : 'My Bills'}
        </Title>
        <Text type="secondary">
          {isAdmin 
            ? 'Manage billing records and payment status across all rooms' 
            : 'View your billing history and make payments'
          }
        </Text>
      </div>

      {/* Financial Summary (Admin only) */}
      {isAdmin && financialSummary && (
        <Card style={{ marginBottom: '24px' }}>
          <Title level={4}>Financial Overview</Title>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} md={6}>
              <Statistic
                title="Total Income"
                value={financialSummary.totalIncome}
                formatter={(value) => formatCurrency(value as number)}
                prefix={<DollarOutlined />}
              />
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Statistic
                title="Total Paid"
                value={financialSummary.totalPaid}
                formatter={(value) => formatCurrency(value as number)}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Statistic
                title="Total Unpaid"
                value={financialSummary.totalUnpaid}
                formatter={(value) => formatCurrency(value as number)}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Statistic
                title="Occupied Rooms"
                value={financialSummary.occupiedRooms}
                suffix={`/ ${financialSummary.roomCount}`}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Payment Status"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
            >
              <Option value="UNPAID">Unpaid</Option>
              <Option value="PAID">Paid</Option>
              <Option value="OVERDUE">Overdue</Option>
            </Select>
          </Col>
          
          {isAdmin && (
            <>
              <Col xs={12} sm={6} md={4}>
                <Select
                  placeholder="Room"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(value) => setFilters(prev => ({ ...prev, roomId: value }))}
                >
                  {Array.from({ length: 18 }, (_, i) => i + 1).map(roomNum => (
                    <Option key={roomNum} value={roomNum}>Room {roomNum}</Option>
                  ))}
                </Select>
              </Col>
              
              <Col xs={12} sm={6} md={4}>
                <Select
                  placeholder="Floor"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(value) => setFilters(prev => ({ ...prev, floor: value }))}
                >
                  <Option value={1}>Floor 1</Option>
                  <Option value={2}>Floor 2</Option>
                </Select>
              </Col>
            </>
          )}
          
          <Col xs={24} sm={12} md={6}>
            <DatePicker
              picker="month"
              placeholder="Select Month"
              style={{ width: '100%' }}
              onChange={(date) => {
                if (date) {
                  setFilters(prev => ({ 
                    ...prev, 
                    month: date.month() + 1, 
                    year: date.year() 
                  }));
                } else {
                  setFilters(prev => {
                    const { month, year, ...rest } = prev;
                    return rest;
                  });
                }
              }}
            />
          </Col>
          
          {isAdmin && (
            <Col xs={24} sm={12} md={4}>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportData}
                loading={exportDataMutation.isPending}
                style={{ width: '100%' }}
              >
                Export CSV
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Billing Records Cards */}
      <div>
        {billingLoading ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <LoadingSpinner message='Loading billing records...'/>
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">Loading billing records...</Text>
              </div>
            </div>
          </Card>
        ) : billingData?.data && billingData.data.length > 0 ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, billingData.pagination?.total || 0)} of {billingData.pagination?.total || 0} records
              </Text>
            </div>
            
            {billingData.data.map(renderBillingCard)}
            
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={billingData.pagination?.total || 0}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                onChange={(newPage, newPageSize) => {
                  setPage(newPage);
                  if (newPageSize !== pageSize) {
                    setPageSize(newPageSize);
                  }
                }}
                pageSizeOptions={['5', '10', '20', '50']}
              />
            </div>
          </>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">No billing records found</Text>
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Try adjusting your filters or check back later
                </Text>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bill Details Modal */}
      <Modal
        title={`Bill Details - Room ${selectedRecord?.room?.roomNumber}`}
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          setSelectedRecord(null);
        }}
        footer={[
          <Button key="close" onClick={() => setPaymentModalVisible(false)}>
            Close
          </Button>,
          selectedRecord?.paymentStatus === 'UNPAID' && (
            <Button
              key="pay"
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={() => {
                setPaymentModalVisible(false);
                handleGenerateQRCode(selectedRecord);
              }}
            >
              Pay Now
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedRecordDetails && (
          <div>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Text strong>Period:</Text>
                <br />
                <Text>{getMonthName(selectedRecordDetails.month)} {selectedRecordDetails.year}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Payment Status:</Text>
                <br />
                <Tag color={getPaymentStatusColor(selectedRecordDetails.paymentStatus)}>
                  {selectedRecordDetails.paymentStatus}
                </Tag>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Usage Details</Title>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Text>Water Usage: {parseFloat(selectedRecordDetails.waterUsage.toString()).toFixed(1)} units</Text>
                <br />
                <Text>Cost: {formatCurrency(selectedRecordDetails.waterCost)}</Text>
              </Col>
              <Col span={12}>
                <Text>Electricity Usage: {parseFloat(selectedRecordDetails.electricityUsage.toString()).toFixed(1)} units</Text>
                <br />
                <Text>Cost: {formatCurrency(selectedRecordDetails.electricityCost)}</Text>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Bill Breakdown</Title>
            <div style={{ marginBottom: '16px' }}>
              <Row justify="space-between">
                <Text>Base Rent:</Text>
                <Text>{formatCurrency(selectedRecordDetails.baseRent)}</Text>
              </Row>
              <Row justify="space-between">
                <Text>Water Cost:</Text>
                <Text>{formatCurrency(selectedRecordDetails.waterCost)}</Text>
              </Row>
              <Row justify="space-between">
                <Text>Electricity Cost:</Text>
                <Text>{formatCurrency(selectedRecordDetails.electricityCost)}</Text>
              </Row>
              <Row justify="space-between">
                <Text>Trash Fee:</Text>
                <Text>{formatCurrency(selectedRecordDetails.trashFee)}</Text>
              </Row>
              <Divider />
              <Row justify="space-between">
                <Text strong style={{ fontSize: '16px' }}>Total Amount:</Text>
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  {formatCurrency(selectedRecordDetails.totalAmount)}
                </Text>
              </Row>
            </div>

            {selectedRecordDetails.paymentDate && (
              <Alert
                message={`Payment completed on ${dayjs(selectedRecordDetails.paymentDate).format('MMMM DD, YYYY')}`}
                type="success"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>

      {/* QR Code Payment Modal */}
      <Modal
        title={`Pay Bill - Room ${selectedRecord?.room?.roomNumber}`}
        open={qrCodeModalVisible}
        onCancel={() => {
          setQrCodeModalVisible(false);
          setSelectedRecord(null);
        }}
        footer={[
          <Button key="close" onClick={() => setQrCodeModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="pay-online"
            type="primary"
            onClick={() => selectedRecord && handleGeneratePaymentLink(selectedRecord.id)}
            loading={generatePaymentLinkMutation.isPending}
          >
            Pay Online
          </Button>,
        ]}
        width={500}
      >
        {selectedRecord && (
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>
              {formatCurrency(selectedRecord.totalAmount)}
            </Title>
            <Text type="secondary">
              {getMonthName(selectedRecord.month)} {selectedRecord.year} Bill
            </Text>
            
            <div style={{ margin: '24px 0' }}>
              {qrLoading ? (
                <LoadingSpinner message='Loading payment QR code...'/>
              ) : freshQRData && 'qrCode' in freshQRData ? (
                <QRCode value={freshQRData.qrCode} size={200} />
              ) : (
                <Alert
                  message="QR Code not available"
                  description="Please use the 'Pay Online' button to proceed with payment."
                  type="info"
                />
              )}
            </div>
            
            <Text type="secondary">
              Scan the QR code with your banking app or click "Pay Online" to proceed with payment.
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillingPage;