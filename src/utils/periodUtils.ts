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

// Функции для работы с недельными периодами (понедельник - воскресенье)
export const getCurrentWeek = (): Period => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
  
  // Рассчитываем начало недели (понедельник)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  
  // Рассчитываем конец недели (воскресенье)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    startDate: monday,
    endDate: sunday,
    label: formatPeriodLabel(monday, sunday)
  };
};

export const getPreviousWeek = (currentWeek: Period): Period => {
  const previousMonday = new Date(currentWeek.startDate);
  previousMonday.setDate(previousMonday.getDate() - 7);
  
  const previousSunday = new Date(previousMonday);
  previousSunday.setDate(previousMonday.getDate() + 6);
  
  return {
    startDate: previousMonday,
    endDate: previousSunday,
    label: formatPeriodLabel(previousMonday, previousSunday)
  };
};

export const getNextWeek = (currentWeek: Period): Period => {
  const nextMonday = new Date(currentWeek.startDate);
  nextMonday.setDate(nextMonday.getDate() + 7);
  
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  
  return {
    startDate: nextMonday,
    endDate: nextSunday,
    label: formatPeriodLabel(nextMonday, nextSunday)
  };
};

export const getWeeksBetween = (from: Period, to: Period): number => {
  const diffTime = to.startDate.getTime() - from.startDate.getTime();
  const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.abs(diffWeeks);
};