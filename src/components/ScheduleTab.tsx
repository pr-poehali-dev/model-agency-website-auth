import { useState, useEffect } from 'react';
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
import ScheduleHistory from './ScheduleHistory';
import GoogleCalendarSync from './GoogleCalendarSync';

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
  const { toast } = useToast();

  const canEdit = userRole === 'producer' || userRole === 'director';

  useEffect(() => {
    loadTeamMembers();
    loadTeams();
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const response = await fetch(SCHEDULE_API_URL);
      const data = await response.json();
      
      if (Object.keys(data).length === 0) {
        await initializeSchedule();
        setScheduleData(defaultSchedule);
      } else {
        const newSchedule = JSON.parse(JSON.stringify(defaultSchedule));
        
        Object.values(data).forEach((aptData: any) => {
          const apt = newSchedule.apartments.find(
            a => a.name === aptData.name && a.address === aptData.address
          );
          
          if (apt) {
            Object.entries(aptData.weeks).forEach(([weekNum, dates]: [string, any]) => {
              const week = apt.weeks.find(w => w.weekNumber === weekNum);
              if (week) {
                dates.forEach((dateData: any) => {
                  const dateEntry = week.dates.find(d => d.date === dateData.date);
                  if (dateEntry) {
                    dateEntry.times = dateData.times;
                  }
                });
              }
            });
          }
        });
        
        setScheduleData(newSchedule);
      }
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
      const operators = users.filter((u: any) => u.role === 'operator' || u.role === 'content_maker');
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
      
      console.log('Users loaded:', users.length);
      console.log('Assignments loaded:', assignments.length);
      console.log('Assignments:', assignments);
      
      const teamsData: Team[] = assignments.map((assignment: any) => {
        const operator = users.find((u: any) => u.email === assignment.operatorEmail);
        const model = users.find((u: any) => u.email === assignment.modelEmail);
        
        const operatorName = operator?.fullName || assignment.operatorEmail;
        const modelName = model?.fullName || assignment.modelEmail;
        
        return {
          operatorEmail: assignment.operatorEmail,
          operatorName,
          modelEmail: assignment.modelEmail,
          modelName,
          displayName: `${operatorName} / ${modelName}`
        };
      });
      
      console.log('Teams created:', teamsData);
      setTeams(teamsData);
    } catch (err) {
      console.error('Failed to load teams', err);
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

    try {
      await fetch(SCHEDULE_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartment_name: apartment.name,
          apartment_address: apartment.address,
          week_number: week.weekNumber,
          date: date.date,
          time_slot: editCell.time,
          value: selectedTeam
        })
      });

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Расписание</h2>
          <p className="text-muted-foreground">График работы по квартирам</p>
        </div>
        <div className="flex items-center gap-3">
          <GoogleCalendarSync />
          <ScheduleHistory />
          {canEdit && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Info" size={16} />
              <span className="hidden lg:inline">Нажмите на ячейку для редактирования</span>
            </div>
          )}
        </div>
      </div>

      {scheduleData.apartments.map((apartment, aptIndex) => (
        <div key={aptIndex} className="space-y-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
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
                  {apartment.weeks.map((week, weekIndex) => (
                    <tr key={weekIndex}>
                      <td colSpan={8} className="p-0">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-purple-900/20 dark:bg-purple-900/20">
                              <th className="p-2 text-left font-semibold text-foreground w-20">{week.weekNumber}</th>
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
                              {week.dates.map((date, dateIndex) => (
                                <td 
                                  key={dateIndex} 
                                  className={`p-2 text-center border-l border-border ${canEdit ? 'cursor-pointer hover:bg-blue-900/40 transition-colors' : ''}`}
                                  onClick={() => handleCellClick(aptIndex, weekIndex, dateIndex, '10:00', date.times['10:00'])}
                                >
                                  {date.times['10:00']}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-b border-border bg-orange-900/20 dark:bg-orange-900/20">
                              <td className="p-2 text-center font-medium">17:00</td>
                              {week.dates.map((date, dateIndex) => (
                                <td 
                                  key={dateIndex} 
                                  className={`p-2 text-center border-l border-border ${canEdit ? 'cursor-pointer hover:bg-orange-900/40 transition-colors' : ''}`}
                                  onClick={() => handleCellClick(aptIndex, weekIndex, dateIndex, '17:00', date.times['17:00'])}
                                >
                                  {date.times['17:00']}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-b border-border bg-slate-700/50 dark:bg-slate-700/50">
                              <td className="p-2 text-center font-medium">00:00</td>
                              {week.dates.map((date, dateIndex) => (
                                <td 
                                  key={dateIndex} 
                                  className={`p-2 text-center border-l border-border ${canEdit ? 'cursor-pointer hover:bg-slate-700/70 transition-colors' : ''}`}
                                  onClick={() => handleCellClick(aptIndex, weekIndex, dateIndex, '00:00', date.times['00:00'])}
                                >
                                  {date.times['00:00']}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ))}
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

export default ScheduleTab;