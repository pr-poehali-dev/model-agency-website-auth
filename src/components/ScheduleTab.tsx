import { useState, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface Team {
  operatorEmail: string;
  operatorName: string;
  modelEmail: string;
  modelName: string;
  displayName: string;
}

interface ScheduleTabProps {
  userRole?: string;
  userPermissions?: string[];
}

const SCHEDULE_API_URL = 'https://functions.poehali.dev/c792d156-9cde-432c-9dbf-1f7374a94184';
const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';

const defaultSchedule = {
  apartments: [
    {
      name: 'Командорская 5/3',
      address: '42 КВАРТИРА',
      shifts: {
        morning: '10:00 - 16:00',
        day: '17:00 - 23:00',
        night: '00:00 - 06:00'
      },
      weeks: [
        {
          weekNumber: '1 лк',
          dates: [
            { day: 'Понедельник', date: '15.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Вторник', date: '16.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Среда', date: '17.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Четверг', date: '18.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Пятница', date: '19.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Суббота', date: '20.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Воскрес.', date: '21.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }}
          ]
        },
        {
          weekNumber: '2 лк',
          dates: [
            { day: 'Понедельник', date: '22.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Вторник', date: '23.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Среда', date: '24.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Четверг', date: '25.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Пятница', date: '26.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Суббота', date: '27.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Воскрес.', date: '28.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }}
          ]
        }
      ]
    },
    {
      name: 'Бочарникова 4 к2',
      address: '188 КВАРТИРА',
      shifts: {
        morning: '10:00 - 16:00',
        day: '17:00 - 23:00',
        night: '00:00 - 06:00'
      },
      weeks: [
        {
          weekNumber: '1 лк',
          dates: [
            { day: 'Понедельник', date: '15.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Вторник', date: '16.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Среда', date: '17.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Четверг', date: '18.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Пятница', date: '19.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Суббота', date: '20.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Воскрес.', date: '21.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }}
          ]
        },
        {
          weekNumber: '2 лк',
          dates: [
            { day: 'Понедельник', date: '22.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Вторник', date: '23.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Среда', date: '24.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Четверг', date: '25.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Пятница', date: '26.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Суббота', date: '27.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
            { day: 'Воскрес.', date: '28.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }}
          ]
        }
      ]
    }
  ]
};

const ScheduleTab = ({ userRole, userPermissions }: ScheduleTabProps) => {
  const [scheduleData, setScheduleData] = useState(defaultSchedule);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState<{
    aptIndex: number;
    weekIndex: number;
    dateIndex: number;
    time: string;
    currentValue: string;
  } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // Смещение недель от текущей
  const { toast } = useToast();
  
  // Функция для получения дат недели с учетом смещения
  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (воскр) - 6 (суб)
    const monday = new Date(today);
    
    // Находим понедельник текущей недели
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff);
    
    // Применяем смещение недель
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

  const canEdit = userRole === 'producer' || userRole === 'director' || 
    userPermissions?.includes('edit_schedule') || 
    userPermissions?.includes('manage_all');

  useEffect(() => {
    loadTeamMembers();
    loadTeams();
  }, []);

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
            return savedDate ? { ...savedDate, day: wd.day } : { ...wd, times: { '10:00': '', '17:00': '', '00:00': '' } };
          });
          
          const loc2Filtered = weekDates.map(wd => {
            const savedDate = loc2Dates.find((d: any) => d.date === wd.date);
            return savedDate ? { ...savedDate, day: wd.day } : { ...wd, times: { '10:00': '', '17:00': '', '00:00': '' } };
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
    } catch (err) {
      console.error('Failed to initialize schedule', err);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await fetch(USERS_API_URL);
      const users = await response.json();
      const operators = users.filter((u: any) => u.role === 'operator' || u.role === 'content_maker' || u.role === 'solo_maker');
      setTeamMembers(operators);
    } catch (err) {
      console.error('Failed to load team members', err);
    }
  };

  const loadTeams = async () => {
    try {
      const [usersResponse, assignmentsResponse] = await Promise.all([
        fetch(USERS_API_URL),
        fetch(ASSIGNMENTS_API_URL)
      ]);
      
      const users = await usersResponse.json();
      const assignments = await assignmentsResponse.json();
      
      console.log('Users loaded:', users);
      console.log('First user example:', users[0]);
      console.log('Assignments loaded:', assignments);
      console.log('First assignment example:', assignments[0]);
      
      const teamsData: Team[] = assignments
        .map((assignment: any) => {
          const operator = users.find((u: any) => u.email === assignment.operatorEmail);
          const model = users.find((u: any) => u.email === assignment.modelEmail);
          
          console.log('Processing assignment:', {
            operatorEmail: assignment.operatorEmail,
            modelEmail: assignment.modelEmail,
            operatorFound: operator,
            modelFound: model
          });
          
          // Пропускаем команды, где хотя бы один пользователь не найден или неактивен
          if (!operator || !model || !operator.isActive || !model.isActive) {
            console.log('Skipping team - user not found or inactive');
            return null;
          }
          
          // Берем только первое слово (имя) из fullName
          const operatorFirstName = operator.fullName.split(' ')[0];
          const modelFirstName = model.fullName.split(' ')[0];
          
          return {
            operatorEmail: assignment.operatorEmail,
            operatorName: operatorFirstName,
            modelEmail: assignment.modelEmail,
            modelName: modelFirstName,
            displayName: `${operatorFirstName} / ${modelFirstName}`
          };
        })
        .filter((team): team is Team => team !== null); // Убираем null значения
      
      console.log('Teams created:', teamsData);
      setTeams(teamsData);
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };

  const handleCopyWeek = async (aptIndex: number, weekIndex: number) => {
    const apartment = scheduleData.apartments[aptIndex];
    const sourceWeek = apartment.weeks[weekIndex];
    
    // Получаем даты для следующей недели
    const nextWeekDates = getWeekDates(currentWeekOffset + 1);

    try {
      for (let dateIndex = 0; dateIndex < sourceWeek.dates.length; dateIndex++) {
        const sourceDate = sourceWeek.dates[dateIndex];
        const targetDate = nextWeekDates[dateIndex];
        
        for (const time of ['10:00', '17:00', '00:00']) {
          await fetch(SCHEDULE_API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apartment_name: apartment.name,
              apartment_address: apartment.address,
              week_number: sourceWeek.weekNumber,
              date: targetDate.date,
              time_slot: time,
              value: sourceDate.times[time]
            })
          });
        }
      }

      toast({
        title: 'Расписание скопировано',
        description: `Локация "${sourceWeek.weekNumber}" скопирована на следующую неделю`,
      });
      
      // Переключаемся на следующую неделю чтобы показать результат
      setCurrentWeekOffset(currentWeekOffset + 1);
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать расписание',
        variant: 'destructive'
      });
    }
  };

  const handleCellClick = (aptIndex: number, weekIndex: number, dateIndex: number, time: string, currentValue: string) => {
    if (!canEdit) return;
    setEditCell({ aptIndex, weekIndex, dateIndex, time, currentValue });
    setSelectedTeam(currentValue);
    setIsEditDialogOpen(true);
  };

  const handleSaveCell = async () => {
    if (!editCell) return;

    const apartment = scheduleData.apartments[editCell.aptIndex];
    const week = apartment.weeks[editCell.weekIndex];
    const date = week.dates[editCell.dateIndex];

    const payload = {
      apartment_name: apartment.name,
      apartment_address: apartment.address,
      week_number: week.weekNumber,
      date: date.date,
      time_slot: editCell.time,
      value: selectedTeam
    };

    console.log('Saving cell:', payload);

    try {
      const response = await fetch(SCHEDULE_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('Save response:', result);

      const newSchedule = JSON.parse(JSON.stringify(scheduleData));
      newSchedule.apartments[editCell.aptIndex].weeks[editCell.weekIndex].dates[editCell.dateIndex].times[editCell.time] = selectedTeam;
      setScheduleData(newSchedule);

      toast({
        title: 'Сохранено',
        description: 'Расписание обновлено',
      });

      setIsEditDialogOpen(false);
      setEditCell(null);
      setSelectedTeam('');
    } catch (err) {
      console.error('Save error:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Расписание</h2>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Расписание</h2>
          <p className="text-muted-foreground">График работы по квартирам</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Переключение недель */}
          <div className="flex items-center gap-2 border border-border rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
              disabled={currentWeekOffset <= -1}
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[120px] text-center">
              {currentWeekOffset === 0 ? 'Эта неделя' : 
               currentWeekOffset === 1 ? 'След. неделя' :
               currentWeekOffset === -1 ? 'Прош. неделя' :
               currentWeekOffset > 0 ? `+${currentWeekOffset} нед.` : `${currentWeekOffset} нед.`}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
              disabled={currentWeekOffset >= 1}
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
          
          <Select value={filterTeam || "all"} onValueChange={(val) => setFilterTeam(val === "all" ? "" : val)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Все команды" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все команды</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.displayName} value={team.displayName}>
                  {team.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canEdit && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Info" size={16} />
              <span className="hidden lg:inline">Нажмите на ячейку</span>
            </div>
          )}
        </div>
      </div>

      {scheduleData.apartments.map((apartment, aptIndex) => (
        <div key={aptIndex} className="space-y-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <table className="w-full text-xs sm:text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-border">
                    <td colSpan={8} className="p-3 font-bold text-foreground text-base bg-muted/30">
                      {apartment.name}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3 font-semibold text-foreground bg-muted/20">{apartment.address}</td>
                    <td className="p-3 text-center bg-blue-900/30 dark:bg-blue-900/30 font-medium">Утро<br/>{apartment.shifts.morning}</td>
                    <td className="p-3 text-center bg-orange-900/30 dark:bg-orange-900/30 font-medium">День<br/>{apartment.shifts.day}</td>
                    <td className="p-3 text-center bg-slate-700 dark:bg-slate-700 font-medium">Ночь<br/>{apartment.shifts.night}</td>
                    <td className="p-3"></td>
                    <td className="p-3"></td>
                    <td className="p-3"></td>
                    <td className="p-3"></td>
                  </tr>
                </thead>
                <tbody>
                  {apartment.weeks.map((week, weekIndex) => {
                    return (
                    <tr key={weekIndex}>
                      <td colSpan={8} className="p-0">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-purple-900/20 dark:bg-purple-900/20">
                              <th className="p-2 text-left font-semibold text-foreground w-20">
                                <div className="flex items-center gap-2">
                                  <span>Лок. {weekIndex + 1}</span>
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleCopyWeek(aptIndex, weekIndex)}
                                      title="Скопировать локацию"
                                    >
                                      <Icon name="Copy" size={14} />
                                    </Button>
                                  )}
                                </div>
                              </th>
                              {week.dates.map((date, dateIndex) => (
                                <th key={dateIndex} className="p-2 text-center font-medium text-foreground border-l border-border">
                                  <div className="whitespace-nowrap">{date.day}</div>
                                  <div className="text-xs font-normal text-muted-foreground">{date.date}</div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-border bg-blue-900/20 dark:bg-blue-900/20">
                              <td className="p-2 text-center font-medium">10:00</td>
                              {week.dates.map((date, dateIndex) => {
                                const cellValue = date.times['10:00'];
                                const isFiltered = filterTeam && cellValue !== filterTeam;
                                const isOccupied = cellValue && cellValue.trim() !== '';
                                return (
                                  <td 
                                    key={dateIndex} 
                                    className={`p-2 text-center border-l border-border ${canEdit ? 'cursor-pointer hover:bg-blue-900/40 transition-colors' : ''} ${isFiltered ? 'opacity-20' : ''} ${isOccupied ? 'bg-green-500/10 font-semibold' : ''}`}
                                    onClick={canEdit ? () => handleCellClick(aptIndex, weekIndex, dateIndex, '10:00', cellValue) : undefined}
                                  >
                                    {cellValue}
                                  </td>
                                );
                              })}
                            </tr>
                            <tr className="border-b border-border bg-orange-900/20 dark:bg-orange-900/20">
                              <td className="p-2 text-center font-medium">17:00</td>
                              {week.dates.map((date, dateIndex) => {
                                const cellValue = date.times['17:00'];
                                const isFiltered = filterTeam && cellValue !== filterTeam;
                                const isOccupied = cellValue && cellValue.trim() !== '';
                                return (
                                  <td 
                                    key={dateIndex} 
                                    className={`p-2 text-center border-l border-border ${canEdit ? 'cursor-pointer hover:bg-orange-900/40 transition-colors' : ''} ${isFiltered ? 'opacity-20' : ''} ${isOccupied ? 'bg-green-500/10 font-semibold' : ''}`}
                                    onClick={canEdit ? () => handleCellClick(aptIndex, weekIndex, dateIndex, '17:00', cellValue) : undefined}
                                  >
                                    {cellValue}
                                  </td>
                                );
                              })}
                            </tr>
                            <tr className="border-b border-border bg-slate-700/50 dark:bg-slate-700/50">
                              <td className="p-2 text-center font-medium">00:00</td>
                              {week.dates.map((date, dateIndex) => {
                                const cellValue = date.times['00:00'];
                                const isFiltered = filterTeam && cellValue !== filterTeam;
                                const isOccupied = cellValue && cellValue.trim() !== '';
                                return (
                                  <td 
                                    key={dateIndex} 
                                    className={`p-2 text-center border-l border-border ${canEdit ? 'cursor-pointer hover:bg-slate-700/70 transition-colors' : ''} ${isFiltered ? 'opacity-20' : ''} ${isOccupied ? 'bg-green-500/10 font-semibold' : ''}`}
                                    onClick={canEdit ? () => handleCellClick(aptIndex, weekIndex, dateIndex, '00:00', cellValue) : undefined}
                                  >
                                    {cellValue}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ))}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать смену</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Команда (оператор/модель)</label>
              <Select value={selectedTeam || 'empty'} onValueChange={(val) => setSelectedTeam(val === 'empty' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите команду" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Пусто</SelectItem>
                  {teams.map((team, index) => (
                    <SelectItem key={index} value={team.displayName}>
                      {team.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Или введите вручную</label>
              <Input 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
                placeholder="Например: Иван / Мария"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveCell}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(ScheduleTab);