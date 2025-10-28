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

interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface ScheduleTabProps {
  userRole?: string;
  userPermissions?: string[];
}

const ScheduleTab = ({ userRole, userPermissions }: ScheduleTabProps) => {
  const [scheduleData, setScheduleData] = useState({
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
            weekLabel: 'Понедельник\n15.09.2025',
            dates: [
              { day: 'Понедельник', date: '15.09.2025', times: { '10:00': 'Лера', '17:00': 'Виктор/Вероника', '00:00': 'Миша/Карина' }},
              { day: 'Вторник', date: '16.09.2025', times: { '10:00': '', '17:00': '', '00:00': 'Миша/Карина' }},
              { day: 'Среда', date: '17.09.2025', times: { '10:00': 'Лера', '17:00': 'Виктор/Вероника', '00:00': 'Миша/Карина' }},
              { day: 'Четверг', date: '18.09.2025', times: { '10:00': 'Лера', '17:00': 'Виктор/Вероника', '00:00': 'Миша/Карина' }},
              { day: 'Пятница', date: '19.09.2025', times: { '10:00': 'Лера', '17:00': 'Виктор/Вероника', '00:00': 'Миша/Карина' }},
              { day: 'Суббота', date: '20.09.2025', times: { '10:00': 'Лера', '17:00': 'Виктор/Вероника', '00:00': 'Миша/Карина' }},
              { day: 'Воскрес.', date: '21.09.2025', times: { '10:00': 'Лера', '17:00': 'Виктор/Вероника', '00:00': 'Миша/Карина' }}
            ]
          },
          {
            weekNumber: '2 лк',
            weekLabel: 'Понедельник\n15.09.2025',
            dates: [
              { day: 'Понедельник', date: '15.09.2025', times: { '10:00': 'Лиза/Рави', '17:00': 'Даня/Кристина', '00:00': 'Марго/Женя' }},
              { day: 'Вторник', date: '16.09.2025', times: { '10:00': 'Лиза/Рави', '17:00': 'Даня/Кристина', '00:00': 'Марго/Женя' }},
              { day: 'Среда', date: '17.09.2025', times: { '10:00': 'Лиза/Рави', '17:00': 'Даня/Кристина', '00:00': 'Марго/Женя' }},
              { day: 'Четверг', date: '18.09.2025', times: { '10:00': 'Лиза/Рави', '17:00': 'Даня/Кристина', '00:00': 'Марго/Женя' }},
              { day: 'Пятница', date: '19.09.2025', times: { '10:00': 'Лиза/Рави', '17:00': 'Даня/Кристина', '00:00': 'Марго/Женя' }},
              { day: 'Суббота', date: '20.09.2025', times: { '10:00': 'Лиза/Рави', '17:00': 'Даня/Кристина', '00:00': 'Марго/Женя' }},
              { day: 'Воскрес.', date: '21.09.2025', times: { '10:00': 'Лиза/Рави', '17:00': 'Даня/Кристина', '00:00': 'Марго/Женя' }}
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
            weekLabel: 'Понедельник\n15.09.2025',
            dates: [
              { day: 'Понедельник', date: '15.09.2025', times: { '10:00': 'Андрей/Амрита', '17:00': 'Илья/Валерия', '00:00': 'Артем/Татьяна' }},
              { day: 'Вторник', date: '16.09.2025', times: { '10:00': 'Андрей/Амрита', '17:00': 'Илья/Валерия', '00:00': 'Артем/Татьяна' }},
              { day: 'Среда', date: '17.09.2025', times: { '10:00': 'Андрей/Амрита', '17:00': 'Илья/Валерия', '00:00': 'Артем/Татьяна' }},
              { day: 'Четверг', date: '18.09.2025', times: { '10:00': 'Андрей/Амрита', '17:00': '', '00:00': 'Артем/Татьяна' }},
              { day: 'Пятница', date: '19.09.2025', times: { '10:00': '', '17:00': 'Илья/Валерия', '00:00': 'Артем/Татьяна' }},
              { day: 'Суббота', date: '20.09.2025', times: { '10:00': 'Андрей/Амрита', '17:00': 'Илья/Валерия', '00:00': 'Артем/Татьяна' }},
              { day: 'Воскрес.', date: '21.09.2025', times: { '10:00': 'Андрей/Амрита', '17:00': 'Илья/Валерия', '00:00': 'Артем/Татьяна' }}
            ]
          },
          {
            weekNumber: '2 лк',
            weekLabel: 'Понедельник\n14.09.2025',
            dates: [
              { day: 'Понедельник', date: '14.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
              { day: 'Вторник', date: '15.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
              { day: 'Среда', date: '16.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
              { day: 'Четверг', date: '17.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
              { day: 'Пятница', date: '18.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
              { day: 'Суббота', date: '19.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }},
              { day: 'Воскрес.', date: '20.09.2025', times: { '10:00': '', '17:00': '', '00:00': '' }}
            ]
          }
        ]
      }
    ]
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
  }, []);

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066');
      const users = await response.json();
      const operators = users.filter((u: any) => u.role === 'operator' || u.role === 'content_maker');
      setTeamMembers(operators);
    } catch (err) {
      console.error('Failed to load team members', err);
    }
  };

  const handleCellClick = (aptIndex: number, weekIndex: number, dateIndex: number, time: string, currentValue: string) => {
    if (!canEdit) return;
    setEditCell({ aptIndex, weekIndex, dateIndex, time, currentValue });
    setSelectedTeam(currentValue);
    setIsEditDialogOpen(true);
  };

  const handleSaveCell = () => {
    if (!editCell) return;

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
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Расписание</h2>
          <p className="text-muted-foreground">График работы по квартирам</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Info" size={16} />
            <span>Нажмите на ячейку для редактирования</span>
          </div>
        )}
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
              <label className="text-sm font-medium mb-2 block">Команда (оператор/мейкер)</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите команду" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Пусто</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.fullName}>
                      {member.fullName}
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
                placeholder="Например: Иван/Мария"
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
