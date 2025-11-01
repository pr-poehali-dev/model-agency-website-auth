export const getWeekDates = (weekOffset: number) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + diff);
  
  monday.setDate(monday.getDate() + (weekOffset * 7));
  
  const dates = [];
  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскрес.'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push({
      day: dayNames[i],
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    });
  }
  
  return dates;
};

export const getCurrentWeekNumber = () => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDaysOfYear = (today.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};
