import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import ScheduleTable from './schedule/ScheduleTable';
import EditShiftDialog from './schedule/EditShiftDialog';
import WeekNavigation from './schedule/WeekNavigation';
import { TeamMember, Team, ScheduleTabProps, EditCellData, ScheduleData } from './schedule/types';
import { SCHEDULE_API_URL, USERS_API_URL, ASSIGNMENTS_API_URL, defaultSchedule } from './schedule/constants';
import { getWeekDates } from './schedule/utils';

const ScheduleTab = ({ userRole, userPermissions }: ScheduleTabProps) => {
  const [scheduleData, setScheduleData] = useState<ScheduleData>(defaultSchedule);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState<EditCellData | null>(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const { toast } = useToast();

  const canEdit = userRole === 'producer' || userRole === 'director' || 
    userPermissions?.includes('edit_schedule') || 
    userPermissions?.includes('manage_all');

  useEffect(() => {
    loadTeamMembers();
    loadTeams();
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const response = await fetch(SCHEDULE_API_URL);
      const data = await response.json();
      
      console.log('Schedule API response:', data);
      
      if (Object.keys(data).length === 0) {
        console.log('Empty schedule, initializing with default data...');
        await initializeSchedule();
        setScheduleData(defaultSchedule);
      } else {
        const hasCorrectApartments = Object.values(data).some((aptData: any) => 
          aptData.name === 'Командорская 5/3' || aptData.name === 'Бочарникова 4 к2'
        );
        
        if (!hasCorrectApartments) {
          console.log('Old test data found, reinitializing with correct apartments...');
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
          
          console.log('Loaded schedule:', newSchedule);
          setScheduleData(newSchedule);
        }
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить расписание',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeSchedule = async () => {
    try {
      const apartments = defaultSchedule.apartments.map(apt => ({
        name: apt.name,
        address: apt.address,
        shifts: apt.shifts,
        weeks: apt.weeks.reduce((acc, week) => {
          acc[week.weekNumber] = week.dates;
          return acc;
        }, {} as Record<string, any>)
      }));

      for (const apt of apartments) {
        await fetch(SCHEDULE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apt)
        });
      }

      console.log('Schedule initialized successfully');
    } catch (error) {
      console.error('Failed to initialize schedule:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await fetch(USERS_API_URL);
      const data = await response.json();
      const members = Object.values(data).map((user: any) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      }));
      setTeamMembers(members as TeamMember[]);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await fetch(ASSIGNMENTS_API_URL);
      const data = await response.json();
      
      const teamsList = Object.values(data).map((assignment: any) => ({
        operatorEmail: assignment.operatorEmail,
        operatorName: assignment.operatorName,
        modelEmail: assignment.modelEmail,
        modelName: assignment.modelName,
        displayName: `${assignment.operatorName} - ${assignment.modelName}`,
      }));
      
      setTeams(teamsList as Team[]);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const handleCellClick = (aptIndex: number, weekIndex: number, dateIndex: number, time: string, currentValue: string) => {
    setEditCell({ aptIndex, weekIndex, dateIndex, time, currentValue });
    setSelectedTeam(currentValue);
    setIsEditDialogOpen(true);
  };

  const handleCellChange = (aptIndex: number, weekIndex: number, dateIndex: number, time: string, value: string) => {
    const newSchedule = JSON.parse(JSON.stringify(scheduleData));
    newSchedule.apartments[aptIndex].weeks[weekIndex].dates[dateIndex].times[time] = value;
    setScheduleData(newSchedule);
  };

  const handleSaveEdit = async () => {
    if (!editCell) return;

    const { aptIndex, weekIndex, dateIndex, time } = editCell;
    const newSchedule = JSON.parse(JSON.stringify(scheduleData));
    newSchedule.apartments[aptIndex].weeks[weekIndex].dates[dateIndex].times[time] = selectedTeam;
    
    setScheduleData(newSchedule);
    setIsEditDialogOpen(false);
    setEditCell(null);

    try {
      const apt = newSchedule.apartments[aptIndex];
      const weekData = apt.weeks[weekIndex];
      
      await fetch(SCHEDULE_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: apt.name,
          address: apt.address,
          weekNumber: weekData.weekNumber,
          dates: weekData.dates
        })
      });

      toast({
        title: 'Успешно',
        description: 'Расписание обновлено',
      });
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(scheduleData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schedule.json';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Успешно',
      description: 'Расписание экспортировано',
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        setScheduleData(importedData);

        for (const apt of importedData.apartments) {
          for (const week of apt.weeks) {
            await fetch(SCHEDULE_API_URL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: apt.name,
                address: apt.address,
                weekNumber: week.weekNumber,
                dates: week.dates
              })
            });
          }
        }

        toast({
          title: 'Успешно',
          description: 'Расписание импортировано',
        });
      } catch (error) {
        console.error('Import failed:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось импортировать расписание',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearSchedule = async () => {
    if (!confirm('Вы уверены, что хотите очистить все расписание?')) return;

    const clearedSchedule = JSON.parse(JSON.stringify(defaultSchedule));
    setScheduleData(clearedSchedule);

    try {
      for (const apt of clearedSchedule.apartments) {
        for (const week of apt.weeks) {
          await fetch(SCHEDULE_API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: apt.name,
              address: apt.address,
              weekNumber: week.weekNumber,
              dates: week.dates
            })
          });
        }
      }

      toast({
        title: 'Успешно',
        description: 'Расписание очищено',
      });
    } catch (error) {
      console.error('Failed to clear schedule:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось очистить расписание',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Расписание смен</h2>
        {canEdit && (
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Icon name="Download" size={16} className="mr-2" />
              Экспорт
            </Button>
            <label>
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Icon name="Upload" size={16} className="mr-2" />
                  Импорт
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <Button onClick={handleClearSchedule} variant="destructive" size="sm">
              <Icon name="Trash2" size={16} className="mr-2" />
              Очистить
            </Button>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Фильтр по команде</label>
            <Input
              placeholder="Введите имя оператора или модели..."
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <WeekNavigation
        currentWeekOffset={currentWeekOffset}
        onPrevWeek={() => setCurrentWeekOffset(prev => prev - 1)}
        onNextWeek={() => setCurrentWeekOffset(prev => prev + 1)}
        onCurrentWeek={() => setCurrentWeekOffset(0)}
      />

      <div className="space-y-6">
        {scheduleData.apartments.map((apartment, aptIndex) => (
          <ScheduleTable
            key={aptIndex}
            apartment={apartment}
            aptIndex={aptIndex}
            filterTeam={filterTeam}
            canEdit={canEdit}
            onCellClick={handleCellClick}
            onCellChange={handleCellChange}
          />
        ))}
      </div>

      <EditShiftDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditCell(null);
        }}
        editCell={editCell}
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamChange={setSelectedTeam}
        onSave={handleSaveEdit}
      />

      <ScheduleHistory />
    </div>
  );
};

export default ScheduleTab;
