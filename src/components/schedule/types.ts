export interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface Team {
  operatorEmail: string;
  operatorName: string;
  modelEmail: string;
  modelName: string;
  displayName: string;
}

export interface ScheduleTabProps {
  userRole?: string;
  userPermissions?: string[];
}

export interface EditCellData {
  aptIndex: number;
  weekIndex: number;
  dateIndex: number;
  time: string;
  currentValue: string;
}

export interface DayData {
  day: string;
  date: string;
  times: Record<string, string>;
}

export interface WeekData {
  weekNumber: string;
  dates: DayData[];
}

export interface ApartmentData {
  name: string;
  address: string;
  shifts: {
    morning: string;
    day: string;
    night: string;
  };
  weeks: WeekData[];
}

export interface ScheduleData {
  apartments: ApartmentData[];
}
