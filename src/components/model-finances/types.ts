export interface DayData {
  date: string;
  onlineCB: number;
  chaturbate: number;
  onlineSP: number;
  stripchat: number;
  onlineSoda: number;
  camSoda: number;
  transfers: number;
  operator: string;
  isShift: boolean;
}

export interface ModelFinancesProps {
  modelId: number;
  modelName: string;
  currentUserEmail?: string;
  userRole?: string;
  onBack?: () => void;
}

export interface OperatorInfo {
  email: string;
  name: string;
}