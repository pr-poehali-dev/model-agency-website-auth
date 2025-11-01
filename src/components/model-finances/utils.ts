import { Period, getDatesInPeriod } from '@/utils/periodUtils';
import { DayData } from './types';

export const generateInitialData = (period: Period): DayData[] => {
  const dates = getDatesInPeriod(period);
  
  return dates.map(date => ({
    date,
    cb: 0,
    sp: 0,
    soda: 0,
    cam4: 0,
    cbIncome: 0,
    spIncome: 0,
    sodaIncome: 0,
    cam4Income: 0,
    stripchatTokens: 0,
    transfers: 0,
    operator: '',
    shift: false
  }));
};

export const formatDate = (dateStr: string) => {
  const [, month, day] = dateStr.split('-');
  return `${day}.${month}`;
};

export const calculateDailyIncome = (day: DayData): number => {
  return (day.cbIncome + day.spIncome + day.sodaIncome + day.cam4Income + day.transfers) * 0.6;
};

export const calculateTotalIncome = (data: DayData[]): number => {
  return data.reduce((sum, d) => sum + calculateDailyIncome(d), 0);
};

export const calculatePlatformSummary = (data: DayData[]) => {
  const totalCbIncome = data.reduce((sum, d) => sum + d.cbIncome, 0);
  const totalSpIncome = data.reduce((sum, d) => sum + d.spIncome, 0);
  const totalSodaIncome = data.reduce((sum, d) => sum + d.sodaIncome, 0);
  const totalCam4 = data.reduce((sum, d) => sum + d.cam4, 0);
  
  return [
    { platform: 'Chaturbate', tokens: totalCbIncome, income: totalCbIncome * 0.6 },
    { platform: 'Stripchat', tokens: totalSpIncome, income: totalSpIncome * 0.6 },
    { platform: 'CamSoda', tokens: totalSodaIncome, income: totalSodaIncome * 0.6 },
    { platform: 'Cam4', tokens: totalCam4, income: totalCam4 * 0.6 },
  ];
};

export const API_URL = 'https://functions.poehali.dev/99ec6654-50ec-4d09-8bfc-cdc60c8fec1e';
export const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
export const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
export const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
