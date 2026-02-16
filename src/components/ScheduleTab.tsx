import { useState, useEffect, memo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import ScheduleHeader from './schedule-components/ScheduleHeader';
import ScheduleTable from './schedule-components/ScheduleTable';
import EditDialog from './schedule-components/EditDialog';
import EditShiftTimeDialog from './schedule-components/EditShiftTimeDialog';
import EditTimeSlotDialog from './schedule-components/EditTimeSlotDialog';
import AddApartmentDialog from './schedule-components/AddApartmentDialog';
import { Button } from '@/components/ui/button';
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

const emptySchedule = { apartments: [] as Array<{ name: string; address: string; shifts: { morning: string; day: string; night: string }; weeks: Array<{ weekNumber: string; timeLabels: string[]; dates: Array<{ day: string; date: string; times: Record<string, string> }> }> }> };

const ScheduleTab = ({ userRole, userPermissions }: ScheduleTabProps) => {
  const [scheduleData, setScheduleData] = useState(emptySchedule);
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
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [isEditShiftTimeDialogOpen, setIsEditShiftTimeDialogOpen] = useState(false);
  const [editShift, setEditShift] = useState<{
    aptIndex: number;
    shiftType: 'morning' | 'day' | 'night';
    shiftName: string;
    currentTime: string;
  } | null>(null);
  const [isEditTimeSlotDialogOpen, setIsEditTimeSlotDialogOpen] = useState(false);
  const [editTimeSlot, setEditTimeSlot] = useState<{
    aptIndex: number;
    weekIndex: number;
    oldTime: string;
  } | null>(null);
  const [isAddApartmentOpen, setIsAddApartmentOpen] = useState(false);
  const [addApartmentLoading, setAddApartmentLoading] = useState(false);
  const { toast } = useToast();
  
  const getWeekDates = (weekOffset: number) => {
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

  const canEdit = userRole === 'producer' || userRole === 'director' || 
    userPermissions?.includes('edit_schedule') || 
    userPermissions?.includes('manage_all');

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    loadTeamMembers();
    loadTeams(email);
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [currentWeekOffset]);

  const loadSchedule = async () => {
    try {
      const response = await authenticatedFetch(SCHEDULE_API_URL);
      const data = await response.json();
      const weekDates = getWeekDates(currentWeekOffset);
      const defLabels = ['10:00', '17:00', '00:00'];

      const apartments = Object.values(data).map((aptData: Record<string, unknown>) => {
        const name = aptData.name as string;
        const address = aptData.address as string;
        const locationsCount = (aptData.locations_count as number) || 2;
        const shifts = (aptData.shifts as Record<string, string>) || {
          morning: '10:00 - 16:00', day: '17:00 - 23:00', night: '00:00 - 06:00'
        };
        const ts = aptData.time_slots as Record<string, string> | undefined;
        const weeks = (aptData.weeks as Record<string, Array<Record<string, unknown>>>) || {};

        const locWeeks = [];
        for (let loc = 1; loc <= locationsCount; loc++) {
          const weekKey = `${loc} лк`;
          const locDates = weeks[weekKey] || [];
          const locTimeLabels = ts
            ? [ts[`loc${loc}_slot1`] || '10:00', ts[`loc${loc}_slot2`] || '17:00', ts[`loc${loc}_slot3`] || '00:00']
            : defLabels;

          const filteredDates = weekDates.map(wd => {
            const saved = locDates.find((d) => d.date === wd.date);
            if (saved) {
              const newTimes: Record<string, string> = {};
              const oldTimes = Object.values((saved.times as Record<string, string>) || {});
              locTimeLabels.forEach((label, idx) => { newTimes[label] = (oldTimes[idx] as string) || ''; });
              return { ...saved, day: wd.day, times: newTimes };
            }
            const emptyTimes: Record<string, string> = {};
            locTimeLabels.forEach(label => { emptyTimes[label] = ''; });
            return { ...wd, times: emptyTimes };
          });

          locWeeks.push({ weekNumber: weekKey, timeLabels: locTimeLabels, dates: filteredDates });
        }

        return { name, address, shifts, weeks: locWeeks };
      });

      setScheduleData({ apartments });
      setLoading(false);
    } catch (err) {
      console.error('Failed to load schedule', err);
      setLoading(false);
    }
  };

  const handleAddApartment = async (data: { name: string; address: string; locationsCount: number }) => {
    setAddApartmentLoading(true);
    try {
      const response = await authenticatedFetch(SCHEDULE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_apartment',
          apartment_name: data.name,
          apartment_address: data.address,
          locations_count: data.locationsCount
        })
      });
      const result = await response.json();
      if (response.status === 409) {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Квартира создана', description: `${data.name} — ${data.address}` });
      setIsAddApartmentOpen(false);
      loadSchedule();
    } catch (err) {
      console.error('Failed to create apartment', err);
      toast({ title: 'Ошибка', description: 'Не удалось создать квартиру', variant: 'destructive' });
    } finally {
      setAddApartmentLoading(false);
    }
  };

  const handleDeleteApartment = async (aptIndex: number) => {
    const apartment = scheduleData.apartments[aptIndex];
    if (!confirm(`Удалить квартиру "${apartment.name} — ${apartment.address}" и всё её расписание?`)) return;
    try {
      await authenticatedFetch(SCHEDULE_API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartment_name: apartment.name,
          apartment_address: apartment.address
        })
      });
      toast({ title: 'Квартира удалена', description: `${apartment.name} — ${apartment.address}` });
      loadSchedule();
    } catch (err) {
      console.error('Failed to delete apartment', err);
      toast({ title: 'Ошибка', description: 'Не удалось удалить квартиру', variant: 'destructive' });
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await authenticatedFetch(USERS_API_URL);
      const users = await response.json();
      const operators = users.filter((u: any) => u.role === 'operator' || u.role === 'content_maker' || u.role === 'solo_maker');
      setTeamMembers(operators);
    } catch (err) {
      console.error('Failed to load team members', err);
    }
  };

  const loadTeams = async (currentUserEmail: string) => {
    try {
      const [usersResponse, assignmentsResponse, producerAssignmentsResponse] = await Promise.all([
        authenticatedFetch(USERS_API_URL),
        authenticatedFetch(ASSIGNMENTS_API_URL),
        authenticatedFetch(`https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6?producer=${encodeURIComponent(currentUserEmail)}&type=model`)
      ]);
      
      const users = await usersResponse.json();
      const assignments = await assignmentsResponse.json();
      const producerModels = await producerAssignmentsResponse.json();
      
      console.log('Users loaded:', users);
      console.log('Assignments loaded:', assignments);
      console.log('Producer models:', producerModels);
      
      let filteredAssignments = assignments;
      if (userRole === 'producer' && producerModels.length > 0) {
        const producerModelEmails = producerModels.map((pm: any) => pm.modelEmail);
        console.log('Producer model emails:', producerModelEmails);
        filteredAssignments = assignments.filter((a: any) => 
          producerModelEmails.includes(a.modelEmail)
        );
        console.log('Filtered assignments for producer:', filteredAssignments);
      }
      
      const teamsData: Team[] = filteredAssignments
        .map((assignment: any) => {
          const operator = users.find((u: any) => u.email === assignment.operatorEmail);
          const model = users.find((u: any) => u.email === assignment.modelEmail);
          
          if (!operator || !model || !operator.isActive || !model.isActive) {
            return null;
          }
          
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
        .filter((team): team is Team => team !== null);
      
      console.log('Teams created:', teamsData);
      setTeams(teamsData);
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };

  const handleCopyWeek = async (aptIndex: number, weekIndex: number) => {
    const apartment = scheduleData.apartments[aptIndex];
    const sourceWeek = apartment.weeks[weekIndex];
    
    const nextWeekDates = getWeekDates(currentWeekOffset + 1);

    try {
      for (let dateIndex = 0; dateIndex < sourceWeek.dates.length; dateIndex++) {
        const sourceDate = sourceWeek.dates[dateIndex];
        const targetDate = nextWeekDates[dateIndex];
        
        for (const time of sourceWeek.timeLabels) {
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

  const handleEditShiftTime = (aptIndex: number, shiftType: 'morning' | 'day' | 'night') => {
    if (!canEdit) return;
    const apartment = scheduleData.apartments[aptIndex];
    const shiftNames = { morning: 'Утро', day: 'День', night: 'Ночь' };
    setEditShift({
      aptIndex,
      shiftType,
      shiftName: shiftNames[shiftType],
      currentTime: apartment.shifts[shiftType]
    });
    setIsEditShiftTimeDialogOpen(true);
  };

  const handleSaveShiftTime = async (newTime: string) => {
    if (!editShift) return;
    
    const apartment = scheduleData.apartments[editShift.aptIndex];
    
    try {
      await authenticatedFetch(SCHEDULE_API_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartment_name: apartment.name,
          apartment_address: apartment.address,
          update_type: 'shift_time',
          shift_type: editShift.shiftType,
          new_time: newTime
        })
      });
      
      const newSchedule = JSON.parse(JSON.stringify(scheduleData));
      newSchedule.apartments[editShift.aptIndex].shifts[editShift.shiftType] = newTime;
      setScheduleData(newSchedule);
      
      toast({
        title: 'Время смены обновлено',
        description: `${editShift.shiftName}: ${newTime}`,
      });
    } catch (err) {
      console.error('Save shift time error:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive'
      });
    } finally {
      setEditShift(null);
    }
  };

  const handleEditTimeSlot = (aptIndex: number, weekIndex: number, oldTime: string) => {
    if (!canEdit) return;
    setEditTimeSlot({ aptIndex, weekIndex, oldTime });
    setIsEditTimeSlotDialogOpen(true);
  };

  const handleSaveTimeSlot = async (newTime: string) => {
    if (!editTimeSlot) return;
    
    const apartment = scheduleData.apartments[editTimeSlot.aptIndex];
    const week = apartment.weeks[editTimeSlot.weekIndex];
    const oldTimeIndex = week.timeLabels.indexOf(editTimeSlot.oldTime);
    
    if (oldTimeIndex === -1) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось найти время для изменения',
        variant: 'destructive'
      });
      setEditTimeSlot(null);
      return;
    }
    
    const slotMapping = ['slot1', 'slot2', 'slot3'];
    const locPrefix = `loc${editTimeSlot.weekIndex + 1}`;
    
    try {
      await authenticatedFetch(SCHEDULE_API_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartment_name: apartment.name,
          apartment_address: apartment.address,
          update_type: 'time_label',
          slot_name: `${locPrefix}_${slotMapping[oldTimeIndex]}`,
          new_label: newTime
        })
      });
      
      const newSchedule = JSON.parse(JSON.stringify(scheduleData));
      newSchedule.apartments[editTimeSlot.aptIndex].weeks[editTimeSlot.weekIndex].timeLabels[oldTimeIndex] = newTime;
      setScheduleData(newSchedule);
      
      toast({
        title: 'Время смены изменено',
        description: `${editTimeSlot.oldTime} → ${newTime}`,
      });
    } catch (err) {
      console.error('Save time slot error:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive'
      });
    } finally {
      setEditTimeSlot(null);
    }
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
      const response = await authenticatedFetch(SCHEDULE_API_URL, {
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
      <ScheduleHeader
        currentWeekOffset={currentWeekOffset}
        onWeekOffsetChange={setCurrentWeekOffset}
        filterTeam={filterTeam}
        onFilterTeamChange={setFilterTeam}
        teams={teams}
        canEdit={canEdit}
      />

      {scheduleData.apartments.map((apartment, aptIndex) => (
        <ScheduleTable
          key={`${apartment.name}_${apartment.address}`}
          apartment={apartment}
          aptIndex={aptIndex}
          filterTeam={filterTeam}
          canEdit={canEdit}
          onCellClick={handleCellClick}
          onCopyWeek={handleCopyWeek}
          onEditShiftTime={handleEditShiftTime}
          onEditTimeSlot={handleEditTimeSlot}
          onDeleteApartment={userRole === 'director' ? handleDeleteApartment : undefined}
        />
      ))}

      {userRole === 'director' && (
        <Button
          onClick={() => setIsAddApartmentOpen(true)}
          className="w-full border-dashed border-2 bg-transparent hover:bg-accent/50 text-muted-foreground"
          variant="outline"
        >
          <Icon name="Plus" size={18} />
          <span className="ml-2">Добавить квартиру</span>
        </Button>
      )}

      <EditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        selectedTeam={selectedTeam}
        onSelectedTeamChange={setSelectedTeam}
        teams={teams}
        onSave={handleSaveCell}
      />

      {editShift && (
        <EditShiftTimeDialog
          isOpen={isEditShiftTimeDialogOpen}
          onClose={() => {
            setIsEditShiftTimeDialogOpen(false);
            setEditShift(null);
          }}
          shiftName={editShift.shiftName}
          currentTime={editShift.currentTime}
          onSave={handleSaveShiftTime}
        />
      )}

      {editTimeSlot && (
        <EditTimeSlotDialog
          isOpen={isEditTimeSlotDialogOpen}
          onClose={() => {
            setIsEditTimeSlotDialogOpen(false);
            setEditTimeSlot(null);
          }}
          currentTime={editTimeSlot.oldTime}
          onSave={handleSaveTimeSlot}
        />
      )}

      <AddApartmentDialog
        isOpen={isAddApartmentOpen}
        onClose={() => setIsAddApartmentOpen(false)}
        onSave={handleAddApartment}
        loading={addApartmentLoading}
      />
    </div>
  );
};

export default memo(ScheduleTab);