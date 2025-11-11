import React, { useState } from 'react';
import { Card, Button, Modal, QRCode, Alert, Typography, Row, Col, Divider, Pagination, Tag } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { 
  useBillingRecordsQuery, 
  useBillingRecordQuery, 
  useFreshQRCodeQuery,
  useFinancialSummaryQuery,
  useExportFinancialDataMutation,
  billingKeys
} from '@/hooks/useBilling';
import { useBillingStatusPolling } from '@/hooks/useBillingStatusPolling';
import { BillingRecord } from '@/types';
import dayjs from 'dayjs';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { RefreshButton } from '@/components/Common/RefreshButton';
import {
  FinancialSummaryCard,
  BillingFilters,
  BillingRecordCard,
  PaymentSuccessModal
} from '@/components/Billing';

const { Title, Text } = Typography;

const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [qrCodeModalVisible, setQrCodeModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [paidRecord, setPaidRecord] = useState<BillingRecord | null>(null);

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const { data: billingData, isLoading: billingLoading } = useBillingRecordsQuery(filters, page, pageSize);
  const { data: selectedRecordDetails } = useBillingRecordQuery(selectedRecord?.id || '');
  const { data: financialSummary } = useFinancialSummaryQuery();
  
  // Mutations
  const exportDataMutation = useExportFinancialDataMutation();
  
  // Fresh QR code query (only when modal is visible and record is unpaid)
  const { data: freshQRData, isLoading: qrLoading, error: qrError } = useFreshQRCodeQuery(
    selectedRecord?.id || '',
    qrCodeModalVisible && selectedRecord?.paymentStatus === 'UNPAID'
  );

  // Hybrid approach: WebSocket + Polling for payment status
  useBillingStatusPolling({
    billingRecordId: selectedRecord?.id || null,
    enabled: qrCodeModalVisible,
    onPaymentSuccess: () => {
      // Close QR modal and show success modal
      setPaidRecord(selectedRecord);
      setQrCodeModalVisible(false);
      setSuccessModalVisible(true);
    },
    interval: 3000, // Poll every 3 seconds as fallback
    useWebSocket: true, // Enable WebSocket for instant updates
  });

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
  const getPaymentStatusColor = (status: string): "success" | "error" | "warning" | "default" => {
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

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '24px' }} className="flex justify-between items-start">
        <div>
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
        <RefreshButton
          queryKeys={[billingKeys.all]}
          tooltip="Refresh billing data"
        />
      </div>

      {/* Financial Summary (Admin only) */}
      {isAdmin && financialSummary && (
        <FinancialSummaryCard
          summary={financialSummary}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Filters */}
      <BillingFilters
        isAdmin={isAdmin}
        onStatusChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
        onRoomChange={(value) => setFilters(prev => ({ ...prev, roomId: value }))}
        onFloorChange={(value) => setFilters(prev => ({ ...prev, floor: value }))}
        onMonthChange={(date) => {
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
        onExport={handleExportData}
        exportLoading={exportDataMutation.isPending}
      />

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
            
            {billingData.data.map(record => (
              <BillingRecordCard
                key={record.id}
                record={record}
                isAdmin={isAdmin}
                onViewDetails={handleViewDetails}
                onGenerateQRCode={handleGenerateQRCode}
                getPaymentStatusColor={getPaymentStatusColor}
                formatCurrency={formatCurrency}
                getMonthName={getMonthName}
              />
            ))}
            
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
          <Button 
            key="close" 
            onClick={() => {
              setQrCodeModalVisible(false);
              setSelectedRecord(null);
            }}
          >
            Close
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
              ) : qrError ? (
                <Alert
                  message="Failed to generate QR code"
                  description={`Error: ${qrError instanceof Error ? qrError.message : 'Unknown error'}. Please try again or contact support.`}
                  type="error"
                  showIcon
                />
              ) : freshQRData && 'qrCode' in freshQRData ? (
                <div>
                  <div className='flex justify-center items-center'>
                    <QRCode value={freshQRData.qrCode} size={200} />
                  </div>
                  <Alert
                    message="Waiting for payment..."
                    description="We'll automatically detect when your payment is complete. You can switch to your banking app safely."
                    type="info"
                    showIcon
                    style={{ marginTop: '16px' }}
                  />
                </div>
              ) : (
                <Alert
                  message="QR Code not available"
                  description="Unable to generate QR code. Please check if the bill is still unpaid and try again."
                  type="warning"
                  showIcon
                />
              )}
            </div>
            
            <Text type="secondary">
              Scan the QR code with your banking app to complete payment.
            </Text>
          </div>
        )}
      </Modal>

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        open={successModalVisible}
        billingRecord={paidRecord}
        onClose={() => {
          setSuccessModalVisible(false);
          setPaidRecord(null);
          setSelectedRecord(null);
        }}
        formatCurrency={formatCurrency}
        getMonthName={getMonthName}
      />
    </div>
  );
};

export default BillingPage;