import React from 'react';
import { Card, Statistic } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import { BillCalculationCardProps } from '@/types';
import { useTranslation } from 'react-i18next';

export const BillCalculationCard: React.FC<BillCalculationCardProps> = ({
  calculatedBill,
  waterRate,
  electricityRate,
  trashFee,
  baseRent
}) => {
  console.log(calculatedBill)
  const { t } = useTranslation();
  return (
    <Card className="bg-blue-50 border-blue-200" size="small">
      <div className="text-center">
        <CalculatorOutlined className="text-2xl text-blue-500 mb-2" />
        <Statistic
          title={`${t('billing.calculatedBill')}`}
          value={calculatedBill.totalBill}
          precision={0}
          suffix="VNĐ"
          valueStyle={{ color: '#1890ff', fontSize: '24px' }}
        />
        <div>{`${t('billing.electricityCost')}`}: {calculatedBill.electricityUsage} kWh x {electricityRate.toLocaleString()} = {calculatedBill.electricityBill.toLocaleString()} VNĐ</div>
        <div>{`${t('billing.waterCost')}`}: {calculatedBill.waterUsage} m³ x {waterRate.toLocaleString()} = {calculatedBill.waterBill.toLocaleString()} VNĐ</div>
        <div>{`${t('billing.trashFee')}`}: {trashFee.toLocaleString()} VNĐ</div>
        <div>{`${t('billing.baseRent')}`}: {baseRent ? baseRent.toLocaleString() : 'Loading...'} VNĐ</div>
      </div>
    </Card>
  );
};
