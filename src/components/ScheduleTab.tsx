import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import Icon from '@/components/ui/icon';
import ScheduleHistory from './ScheduleHistory';
import { ScheduleTable } from './schedule/ScheduleTable';
import { WeekNavigation } from './schedule/WeekNavigation';
import { EditShiftDialog } from './schedule/EditShiftDialog';
import { useScheduleData, useTeamData, useScheduleActions } from './schedule/hooks';
import { getWeekDates } from './schedule/utils';
import { ScheduleTabProps, EditCellData } from './schedule/types';

const ScheduleTab = ({ userRole, userPermissions }: ScheduleTabProps) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [filterTeam, setFilterTeam] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [editCell, setEditCell] = useState<EditCellData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { scheduleData, setScheduleData, loading } = useScheduleData(currentWeekOffset);
  const { teams } = useTeamData();
  const { copyLocation, saveCell } = useScheduleActions(scheduleData, setScheduleData);

  const canEdit = userRole === 'producer' || userRole === 'director' || 
    userPermissions?.includes('edit_schedule') || 
    userPermissions?.includes('manage_all');

  const handleCellClick = (aptIndex: number, weekIndex: number, dateIndex: number, time: string, currentValue: string) => {
    if (!canEdit) return;
    setEditCell({ aptIndex, weekIndex, dateIndex, time, currentValue });
    setSelectedTeam(currentValue);
    setIsEditDialogOpen(true);
  };

  const handleSaveCell = async () => {
    if (!editCell) return;

    const success = await saveCell(
      editCell.aptIndex,
      editCell.weekIndex,
      editCell.dateIndex,
      editCell.time,
      selectedTeam
    );

    if (success) {
      setIsEditDialogOpen(false);
      setEditCell(null);
      setSelectedTeam('');
    }
  };

  const weekDates = getWeekDates(currentWeekOffset);
  const filteredSchedule = filterTeam
    ? {
        apartments: scheduleData.apartments.map(apt => ({
          ...apt,
          weeks: apt.weeks.map(week => ({
            ...week,
            dates: week.dates.map(date => ({
              ...date,
              times: Object.fromEntries(
                Object.entries(date.times).map(([time, value]) => [
                  time,
                  value === filterTeam ? value : ''
                ])
              )
            }))
          }))
        }))
      }
    : scheduleData;

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
          <WeekNavigation
            currentWeekOffset={currentWeekOffset}
            onPrevious={() => setCurrentWeekOffset(Math.max(-1, currentWeekOffset - 1))}
            onNext={() => setCurrentWeekOffset(Math.min(1, currentWeekOffset + 1))}
            weekDates={weekDates}
          />
          
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
          <ScheduleHistory />
        </div>
      </div>

      <div className="space-y-8">
        {filteredSchedule.apartments.map((apartment, aptIndex) => (
          <ScheduleTable
            key={`${apartment.name}-${apartment.address}`}
            apartment={apartment}
            aptIndex={aptIndex}
            canEdit={canEdit}
            onCellClick={handleCellClick}
            onCopyLocation={(sourceIdx, targetIdx) => copyLocation(aptIndex, sourceIdx, targetIdx)}
          />
        ))}
      </div>

      <EditShiftDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditCell(null);
          setSelectedTeam('');
        }}
        onSave={handleSaveCell}
        selectedTeam={selectedTeam}
        onTeamChange={setSelectedTeam}
        teams={teams}
        editCell={editCell}
        scheduleData={scheduleData}
      />
    </div>
  );
};

export default ScheduleTab;