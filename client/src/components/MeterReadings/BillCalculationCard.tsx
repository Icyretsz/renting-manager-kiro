import React from 'react';
import { Card, Statistic } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';

interface BillCalculationCardProps {
  calculatedBill: {
    totalBill: number;
    electricityUsage: number;
    waterUsage: number;
    electricityBill: number;
    waterBill: number;
  };
  waterRate: number;
  electricityRate: number;
  trashFee: number;
  baseRent: number;
}

export const BillCalculationCard: React.FC<BillCalculationCardProps> = ({
  calculatedBill,
  waterRate,
  electricityRate,
  trashFee,
  baseRent
}) => {
  return (
    <Card className="bg-blue-50 border-blue-200" size="small">
      <div className="text-center">
        <CalculatorOutlined className="text-2xl text-blue-500 mb-2" />
        <Statistic
          title="Calculated Monthly Bill"
          value={calculatedBill.totalBill}
          precision={0}
          suffix="VNĐ"
          valueStyle={{ color: '#1890ff', fontSize: '24px' }}
        />
        <div>Electricity: {calculatedBill.electricityUsage} kWh x {electricityRate.toLocaleString()} = {calculatedBill.electricityBill.toLocaleString()} VNĐ</div>
        <div>Water: {calculatedBill.waterUsage} m³ x {waterRate.toLocaleString()} = {calculatedBill.waterBill.toLocaleString()} VNĐ</div>
        <div>Trash fee: {trashFee.toLocaleString()} VNĐ</div>
        <div>Base rent: {baseRent ? baseRent.toLocaleString() : 'Loading...'} VNĐ</div>
        <div className="text-xs text-gray-600 mt-2">
          Including base rent, utilities, and trash fee
        </div>
      </div>
    </Card>
  );
};
