import React, { useState } from 'react';
import { Card, Button, Modal, QRCode, Alert, Typography, Row, Col, Divider, Pagination, Tag } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import { useUserProfile } from '@/hooks/useUserProfile';
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
import { useTranslationHelpers } from '@/hooks/useTranslationHelpers';

const { Title, Text } = Typography;

const BillingPage: React.FC = () => {
  const { data: user } = useUserProfile();
  const { t, getMonthName, formatCurrency, getPaymentStatus, getPaymentStatusColor } = useTranslationHelpers();
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
        title: t('billing.paymentAlreadyCompleted'),
        content: t('billing.billAlreadyPaid'),
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

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '24px' }} className="flex justify-between items-start">
        <div>
          <Title level={2}>
            {isAdmin ? t('billing.title') : t('billing.titleUser')}
          </Title>
          <Text type="secondary">
            {isAdmin 
              ? t('billing.subtitle')
              : t('billing.subtitleUser')
            }
          </Text>
        </div>
        <RefreshButton
          queryKeys={[billingKeys.all]}
          tooltip={t('common.refreshData')}
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
              <LoadingSpinner message={t('billing.loadingBillingRecords')}/>
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">{t('billing.loadingBillingRecords')}</Text>
              </div>
            </div>
          </Card>
        ) : billingData?.data && billingData.data.length > 0 ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                {t('billing.showing', { 
                  start: ((page - 1) * pageSize) + 1, 
                  end: Math.min(page * pageSize, billingData.pagination?.total || 0), 
                  total: billingData.pagination?.total || 0 
                })}
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
                showTotal={(total, range) => t('billing.showing', { start: range[0], end: range[1], total })}

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
              <Text type="secondary">{t('billing.noBillingRecords')}</Text>
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('billing.adjustFilters')}
                </Text>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bill Details Modal */}
      <Modal
        title={t('billing.billDetails', { room: selectedRecord?.room?.roomNumber })}
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          setSelectedRecord(null);
        }}
        footer={[
          <Button key="close" onClick={() => setPaymentModalVisible(false)}>
            {t('common.close')}
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
              {t('billing.payNow')}
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedRecordDetails && (
          <div>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Text strong>{t('billing.period')}:</Text>
                <br />
                <Text>{selectedRecordDetails.month}/{selectedRecordDetails.year}</Text>
              </Col>
              <Col span={12}>
                <Text strong>{t('billing.paymentStatus')}:</Text>
                <br />
                <Tag color={getPaymentStatusColor(selectedRecordDetails.paymentStatus)}>
                  {getPaymentStatus(selectedRecordDetails.paymentStatus)}
                </Tag>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>{t('billing.usageDetails')}</Title>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Text>{t('billing.waterUsage')}: {parseFloat(selectedRecordDetails.waterUsage.toString()).toFixed(1)} m³</Text>
                <br />
                <Text>{t('billing.cost')}: {formatCurrency(selectedRecordDetails.waterCost)}</Text>
              </Col>
              <Col span={12}>
                <Text>{t('billing.electricityUsage')}: {parseFloat(selectedRecordDetails.electricityUsage.toString()).toFixed(1)} kWh</Text>
                <br />
                <Text>{t('billing.cost')}: {formatCurrency(selectedRecordDetails.electricityCost)}</Text>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>{t('billing.billBreakdown')}</Title>
            <div style={{ marginBottom: '16px' }}>
              <Row justify="space-between">
                <Text>{t('billing.baseRent')}:</Text>
                <Text>{formatCurrency(selectedRecordDetails.baseRent)}</Text>
              </Row>
              <Row justify="space-between">
                <Text>{t('billing.waterCost')}:</Text>
                <Text>{formatCurrency(selectedRecordDetails.waterCost)}</Text>
              </Row>
              <Row justify="space-between">
                <Text>{t('billing.electricityCost')}:</Text>
                <Text>{formatCurrency(selectedRecordDetails.electricityCost)}</Text>
              </Row>
              <Row justify="space-between">
                <Text>{t('billing.trashFee')}:</Text>
                <Text>{formatCurrency(selectedRecordDetails.trashFee)}</Text>
              </Row>
              <Divider />
              <Row justify="space-between">
                <Text strong style={{ fontSize: '16px' }}>{t('billing.totalAmount')}:</Text>
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  {formatCurrency(selectedRecordDetails.totalAmount)}
                </Text>
              </Row>
            </div>

            {selectedRecordDetails.paymentDate && (
              <Alert
                message={t('billing.paymentCompleted', { date: dayjs(selectedRecordDetails.paymentDate).format('MMMM DD, YYYY') })}
                type="success"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>

      {/* QR Code Payment Modal */}
      <Modal
        title={t('billing.payBill', { room: selectedRecord?.room?.roomNumber })}
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
            {t('common.close')}
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
              {t('billing.monthBill', { month: selectedRecord.month, year: selectedRecord.year })}
            </Text>
            
            <div style={{ margin: '24px 0' }}>
              {qrLoading ? (
                <LoadingSpinner message={t('billing.loadingQRCode')}/>
              ) : qrError ? (
                <Alert
                  message={t('billing.failedToGenerateQR')}
                  description={t('billing.qrCodeError', { error: qrError instanceof Error ? qrError.message : 'Unknown error' })}
                  type="error"
                  showIcon
                />
              ) : freshQRData && 'qrCode' in freshQRData ? (
                <div>
                  <div className='flex justify-center items-center'>
                    <QRCode value={freshQRData.qrCode} size={200} />
                  </div>
                  <Alert
                    message={t('billing.waitingForPayment')}
                    description={t('billing.autoDetectPayment')}
                    type="info"
                    showIcon
                    style={{ marginTop: '16px' }}
                  />
                </div>
              ) : (
                <Alert
                  message={t('billing.qrCodeNotAvailable')}
                  description={t('billing.checkBillStatus')}
                  type="warning"
                  showIcon
                />
              )}
            </div>
            
            <Text type="secondary">
              {t('billing.scanQRCode')}
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