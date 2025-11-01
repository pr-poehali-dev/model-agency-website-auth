import { useState, useEffect } from 'react';
import { SCHEDULE_API_URL, USERS_API_URL, ASSIGNMENTS_API_URL, defaultSchedule } from './constants';
import { getWeekDates } from './utils';
import { ScheduleData, TeamMember, Team } from './types';
import { useToast } from '@/hooks/use-toast';

export const useScheduleData = (currentWeekOffset: number) => {
  const [scheduleData, setScheduleData] = useState<ScheduleData>(defaultSchedule);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, [currentWeekOffset]);

  const loadSchedule = async () => {
    try {
      const response = await fetch(SCHEDULE_API_URL);
      const data = await response.json();
      
      console.log('Schedule API response:', data);
      
      const weekDates = getWeekDates(currentWeekOffset);
      const weekDateStrings = weekDates.map(wd => wd.date);
      
      console.log('Current week offset:', currentWeekOffset);
      console.log('Week dates:', weekDateStrings);
      
      const newSchedule = {
        apartments: defaultSchedule.apartments.map(apt => {
          const aptData: any = Object.values(data).find((a: any) => 
            a.name === apt.name && a.address === apt.address
          );
          
          console.log(`Processing ${apt.name}:`, aptData);
          
          if (!aptData?.weeks) {
            console.log(`No data for ${apt.name}, using empty schedule`);
            return {
              ...apt,
              weeks: [
                { weekNumber: '1 лк', dates: weekDates.map(wd => ({ ...wd, times: { '10:00': '', '17:00': '', '00:00': '' } })) },
                { weekNumber: '2 лк', dates: weekDates.map(wd => ({ ...wd, times: { '10:00': '', '17:00': '', '00:00': '' } })) }
              ]
            };
          }
          
          const loc1Dates = aptData.weeks['1 лк'] || [];
          const loc2Dates = aptData.weeks['2 лк'] || [];
          
          console.log(`${apt.name} - Location 1 dates:`, loc1Dates.map((d: any) => d.date));
          console.log(`${apt.name} - Location 2 dates:`, loc2Dates.map((d: any) => d.date));
          
          const loc1Filtered = weekDates.map(wd => {
            const savedDate = loc1Dates.find((d: any) => d.date === wd.date);
            return savedDate || { ...wd, times: { '10:00': '', '17:00': '', '00:00': '' } };
          });
          
          const loc2Filtered = weekDates.map(wd => {
            const savedDate = loc2Dates.find((d: any) => d.date === wd.date);
            return savedDate || { ...wd, times: { '10:00': '', '17:00': '', '00:00': '' } };
          });
          
          return {
            ...apt,
            weeks: [
              { weekNumber: '1 лк', dates: loc1Filtered },
              { weekNumber: '2 лк', dates: loc2Filtered }
            ]
          };
        })
      };
      
      console.log('Final schedule:', newSchedule);
      setScheduleData(newSchedule);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load schedule', err);
      setLoading(false);
    }
  };

  return { scheduleData, setScheduleData, loading, loadSchedule };
};

export const useTeamData = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    loadTeamMembers();
    loadTeams();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const response = await fetch(USERS_API_URL);
      const data = await response.json();
      setTeamMembers(data);
    } catch (err) {
      console.error('Failed to load team members', err);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await fetch(ASSIGNMENTS_API_URL);
      const data = await response.json();
      
      const uniqueTeams = new Map<string, Team>();
      
      data.forEach((assignment: any) => {
        const operatorName = assignment.operator_name || 'Не назначен';
        const modelName = assignment.model_name || 'Не назначен';
        const displayName = `${operatorName} / ${modelName}`;
        
        if (!uniqueTeams.has(displayName)) {
          uniqueTeams.set(displayName, {
            operatorEmail: assignment.operator_email || '',
            operatorName,
            modelEmail: assignment.model_email || '',
            modelName,
            displayName
          });
        }
      });
      
      setTeams(Array.from(uniqueTeams.values()));
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };

  return { teamMembers, teams, loadTeamMembers, loadTeams };
};

export const useScheduleActions = (
  scheduleData: ScheduleData,
  setScheduleData: (data: ScheduleData) => void
) => {
  const { toast } = useToast();

  const initializeSchedule = async () => {
    try {
      for (const apt of defaultSchedule.apartments) {
        for (const week of apt.weeks) {
          for (const date of week.dates) {
            await fetch(SCHEDULE_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apartment_name: apt.name,
                apartment_address: apt.address,
                week_number: week.weekNumber,
                date: date.date,
                day_name: date.day,
                time_10: date.times['10:00'],
                time_17: date.times['17:00'],
                time_00: date.times['00:00']
              })
            });
          }
        }
      }
      
      toast({
        title: 'Инициализировано',
        description: 'Расписание успешно создано',
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось инициализировать расписание',
        variant: 'destructive'
      });
    }
  };

  const copyLocation = async (aptIndex: number, sourceWeekIndex: number, targetWeekIndex: number) => {
    try {
      const apartment = scheduleData.apartments[aptIndex];
      const sourceWeek = apartment.weeks[sourceWeekIndex];
      const targetWeek = apartment.weeks[targetWeekIndex];

      for (let i = 0; i < sourceWeek.dates.length; i++) {
        const sourceDate = sourceWeek.dates[i];
        const targetDate = targetWeek.dates[i];

        for (const time of ['10:00', '17:00', '00:00']) {
          await fetch(SCHEDULE_API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apartment_name: apartment.name,
              apartment_address: apartment.address,
              week_number: targetWeek.weekNumber,
              date: targetDate.date,
              time_slot: time,
              value: sourceDate.times[time]
            })
          });
        }
      }

      const newSchedule = JSON.parse(JSON.stringify(scheduleData));
      newSchedule.apartments[aptIndex].weeks[targetWeekIndex].dates = sourceWeek.dates.map((date, idx) => ({
        ...date,
        times: { ...sourceWeek.dates[idx].times }
      }));
      
      setScheduleData(newSchedule);

      toast({
        title: 'Локация скопирована',
        description: `Расписание "${sourceWeek.weekNumber}" скопировано в "${targetWeek.weekNumber}"`,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать локацию',
        variant: 'destructive'
      });
    }
  };

  const saveCell = async (
    aptIndex: number,
    weekIndex: number,
    dateIndex: number,
    time: string,
    value: string
  ) => {
    const apartment = scheduleData.apartments[aptIndex];
    const week = apartment.weeks[weekIndex];
    const date = week.dates[dateIndex];

    try {
      await fetch(SCHEDULE_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartment_name: apartment.name,
          apartment_address: apartment.address,
          week_number: week.weekNumber,
          date: date.date,
          time_slot: time,
          value
        })
      });

      const newSchedule = JSON.parse(JSON.stringify(scheduleData));
      newSchedule.apartments[aptIndex].weeks[weekIndex].dates[dateIndex].times[time] = value;
      setScheduleData(newSchedule);

      toast({
        title: 'Сохранено',
        description: 'Расписание обновлено',
      });

      return true;
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive'
      });
      return false;
    }
  };

  return { initializeSchedule, copyLocation, saveCell };
};
