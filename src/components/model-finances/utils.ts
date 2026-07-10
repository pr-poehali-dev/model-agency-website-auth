import { Period, getDatesInPeriod } from '@/utils/periodUtils';
import { API_URLS } from '@/lib/apiUrls';
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
    cam4: 0,
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
  return (day.onlineCB || 0) + (day.chaturbate || 0) + (day.onlineSP || 0) + (day.stripchat || 0) + (day.camsoda || 0) + (day.cam4 || 0) + (day.transfers || 0);
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
  const totalCam4 = data.reduce((sum, d) => sum + (d.cam4 || 0), 0);
  const totalTransfers = data.reduce((sum, d) => sum + (d.transfers || 0), 0);
  
  return [
    { platform: 'Online CB', amount: totalOnlineCB },
    { platform: 'Chaturbate', amount: totalChaturbate },
    { platform: 'Online SP', amount: totalOnlineSP },
    { platform: 'Stripchat', amount: totalStripchat },
    { platform: 'CamSoda', amount: totalCamsoda },
    { platform: 'Cam4', amount: totalCam4 },
    { platform: 'Переводы', amount: totalTransfers },
  ];
};

export const API_URL = API_URLS.saveFinances;
export const ASSIGNMENTS_API_URL = API_URLS.operatorAssignments;
export const USERS_API_URL = API_URLS.auth;
export const PRODUCER_API_URL = API_URLS.producerAssignments;