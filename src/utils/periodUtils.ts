export interface Period {
  startDate: Date;
  endDate: Date;
  label: string;
}

export const getCurrentPeriod = (): Period => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (day <= 15) {
    return {
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month, 15),
      label: formatPeriodLabel(new Date(year, month, 1), new Date(year, month, 15))
    };
  } else {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      startDate: new Date(year, month, 16),
      endDate: new Date(year, month, lastDay),
      label: formatPeriodLabel(new Date(year, month, 16), new Date(year, month, lastDay))
    };
  }
};

export const getPreviousPeriod = (currentPeriod: Period): Period => {
  const startDay = currentPeriod.startDate.getDate();
  
  if (startDay === 1) {
    const prevMonth = new Date(currentPeriod.startDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const lastDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
    
    return {
      startDate: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 16),
      endDate: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), lastDay),
      label: formatPeriodLabel(
        new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 16),
        new Date(prevMonth.getFullYear(), prevMonth.getMonth(), lastDay)
      )
    };
  } else {
    const month = currentPeriod.startDate.getMonth();
    const year = currentPeriod.startDate.getFullYear();
    
    return {
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month, 15),
      label: formatPeriodLabel(new Date(year, month, 1), new Date(year, month, 15))
    };
  }
};

export const getNextPeriod = (currentPeriod: Period): Period => {
  const startDay = currentPeriod.startDate.getDate();
  
  if (startDay === 16) {
    const nextMonth = new Date(currentPeriod.startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return {
      startDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1),
      endDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15),
      label: formatPeriodLabel(
        new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1),
        new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15)
      )
    };
  } else {
    const month = currentPeriod.startDate.getMonth();
    const year = currentPeriod.startDate.getFullYear();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    return {
      startDate: new Date(year, month, 16),
      endDate: new Date(year, month, lastDay),
      label: formatPeriodLabel(new Date(year, month, 16), new Date(year, month, lastDay))
    };
  }
};

const formatPeriodLabel = (start: Date, end: Date): string => {
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  };
  
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const getDatesInPeriod = (period: Period): string[] => {
  const dates: string[] = [];
  const current = new Date(period.startDate);
  
  while (current <= period.endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};