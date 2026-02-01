import { Period, getDatesInPeriod } from '@/utils/periodUtils';
import { DayData } from './types';

export const generateInitialData = (period: Period): DayData[] => {
  const dates = getDatesInPeriod(period);
  
  return dates.map(date => ({
    date,
    onlineCB: 0,
    chaturbate: 0,
    onlineSP: 0,
    stripchat: 0,
    camsoda: 0,
    transfers: 0,
    operator: '',
    isShift: false
  }));
};

export const formatDate = (dateStr: string) => {
  const [, month, day] = dateStr.split('-');
  return `${day}.${month}`;
};

export const calculateDailyIncome = (day: DayData): number => {
  return (day.onlineCB || 0) + (day.chaturbate || 0) + (day.onlineSP || 0) + (day.stripchat || 0) + (day.camsoda || 0) + (day.transfers || 0);
};

export const calculateTotalIncome = (data: DayData[]): number => {
  return data.reduce((sum, d) => sum + calculateDailyIncome(d), 0);
};

export const calculatePlatformSummary = (data: DayData[]) => {
  const totalOnlineCB = data.reduce((sum, d) => sum + (d.onlineCB || 0), 0);
  const totalChaturbate = data.reduce((sum, d) => sum + (d.chaturbate || 0), 0);
  const totalOnlineSP = data.reduce((sum, d) => sum + (d.onlineSP || 0), 0);
  const totalStripchat = data.reduce((sum, d) => sum + (d.stripchat || 0), 0);
  const totalCamsoda = data.reduce((sum, d) => sum + (d.camsoda || 0), 0);
  const totalTransfers = data.reduce((sum, d) => sum + (d.transfers || 0), 0);
  
  return [
    { platform: 'Online CB', amount: totalOnlineCB },
    { platform: 'Chaturbate', amount: totalChaturbate },
    { platform: 'Online SP', amount: totalOnlineSP },
    { platform: 'Stripchat', amount: totalStripchat },
    { platform: 'CamSoda', amount: totalCamsoda },
    { platform: 'Переводы', amount: totalTransfers },
  ];
};

export const API_URL = 'https://functions.poehali.dev/99ec6654-50ec-4d09-8bfc-cdc60c8fec1e';
export const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
export const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
export const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';