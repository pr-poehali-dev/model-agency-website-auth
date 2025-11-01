export interface DayData {
  date: string;
  cb: number;
  sp: number;
  soda: number;
  cam4: number;
  cbIncome: number;
  spIncome: number;
  sodaIncome: number;
  cam4Income: number;
  stripchatTokens: number;
  transfers: number;
  operator: string;
  shift: boolean;
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
