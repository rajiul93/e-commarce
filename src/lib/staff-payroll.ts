import type { StaffPayrollBonusType } from '@/types';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatPayrollMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`;
}

export function calcBasePay(
  monthlySalary: number,
  presentDays: number,
  workingDaysInMonth: number,
): number {
  if (workingDaysInMonth <= 0) return 0;
  return Math.round((monthlySalary / workingDaysInMonth) * presentDays);
}

export function calcBonusAmount(
  calculatedPay: number,
  bonusType?: StaffPayrollBonusType | '',
  bonusValue?: number,
): number {
  if (!bonusType || bonusValue == null || bonusValue <= 0) return 0;
  if (bonusType === 'fixed') return Math.round(bonusValue);
  return Math.round((calculatedPay * bonusValue) / 100);
}

export function calcTotalPay(
  monthlySalary: number,
  presentDays: number,
  workingDaysInMonth: number,
  bonusType?: StaffPayrollBonusType | '',
  bonusValue?: number,
): { basePay: number; bonusAmount: number; totalPay: number } {
  const basePay = calcBasePay(monthlySalary, presentDays, workingDaysInMonth);
  const bonusAmount = calcBonusAmount(basePay, bonusType, bonusValue);
  return { basePay, bonusAmount, totalPay: basePay + bonusAmount };
}
