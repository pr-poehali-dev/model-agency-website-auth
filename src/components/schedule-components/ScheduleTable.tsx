import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ApartmentWeek {
  weekNumber: string;
  timeLabels: string[];
  dates: {
    day: string;
    date: string;
    times: Record<string, string>;
  }[];
}

interface Apartment {
  name: string;
  address: string;
  shifts: {
    morning: string;
    day: string;
    night: string;
  };
  weeks: ApartmentWeek[];
}

interface ScheduleTableProps {
  apartment: Apartment;
  aptIndex: number;
  filterTeam: string;
  canEdit: boolean;
  onCellClick: (aptIndex: number, weekIndex: number, dateIndex: number, time: string, currentValue: string) => void;
  onCopyWeek: (aptIndex: number, weekIndex: number) => void;
  onEditShiftTime?: (aptIndex: number, shiftType: 'morning' | 'day' | 'night') => void;
  onEditTimeSlot?: (aptIndex: number, weekIndex: number, oldTime: string) => void;
  onDeleteApartment?: (aptIndex: number) => void;
  onEditApartment?: (aptIndex: number) => void;
}

const rowStyles = [
  { bg: 'bg-blue-900/20 dark:bg-blue-900/20', hoverBg: 'hover:bg-blue-900/40', labelHover: 'hover:bg-blue-900/40' },
  { bg: 'bg-orange-900/20 dark:bg-orange-900/20', hoverBg: 'hover:bg-orange-900/40', labelHover: 'hover:bg-orange-900/40' },
  { bg: 'bg-slate-700/50 dark:bg-slate-700/50', hoverBg: 'hover:bg-slate-700/70', labelHover: 'hover:bg-slate-600' },
];

const ScheduleTable = ({
  apartment,
  aptIndex,
  filterTeam,
  canEdit,
  onCellClick,
  onCopyWeek,
  onEditShiftTime,
  onEditTimeSlot,
  onDeleteApartment,
  onEditApartment
}: ScheduleTableProps) => {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <table className="w-full text-xs sm:text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <td colSpan={8} className="p-3 font-bold text-foreground text-base bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span>{apartment.name}</span>
                    {(onEditApartment || onDeleteApartment) && (
                      <div className="flex items-center gap-1">
                        {onEditApartment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => onEditApartment(aptIndex)}
                            title="Редактировать квартиру"
                          >
                            <Icon name="Pencil" size={14} />
                          </Button>
                        )}
                        {onDeleteApartment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDeleteApartment(aptIndex)}
                            title="Удалить квартиру"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-semibold text-foreground bg-muted/20">{apartment.address}</td>
                <td 
                  className={`p-3 text-center bg-blue-900/30 dark:bg-blue-900/30 font-medium ${canEdit && onEditShiftTime ? 'cursor-pointer hover:bg-blue-900/50 transition-colors' : ''}`}
                  onClick={canEdit && onEditShiftTime ? () => onEditShiftTime(aptIndex, 'morning') : undefined}
                  title={canEdit && onEditShiftTime ? 'Нажмите для редактирования времени' : ''}
                >
                  Утро<br/>{apartment.shifts.morning}
                </td>
                <td 
                  className={`p-3 text-center bg-orange-900/30 dark:bg-orange-900/30 font-medium ${canEdit && onEditShiftTime ? 'cursor-pointer hover:bg-orange-900/50 transition-colors' : ''}`}
                  onClick={canEdit && onEditShiftTime ? () => onEditShiftTime(aptIndex, 'day') : undefined}
                  title={canEdit && onEditShiftTime ? 'Нажмите для редактирования времени' : ''}
                >
                  День<br/>{apartment.shifts.day}
                </td>
                <td 
                  className={`p-3 text-center bg-slate-700 dark:bg-slate-700 font-medium ${canEdit && onEditShiftTime ? 'cursor-pointer hover:bg-slate-600 transition-colors' : ''}`}
                  onClick={canEdit && onEditShiftTime ? () => onEditShiftTime(aptIndex, 'night') : undefined}
                  title={canEdit && onEditShiftTime ? 'Нажмите для редактирования времени' : ''}
                >
                  Ночь<br/>{apartment.shifts.night}
                </td>
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
                          <th className="p-2 text-left font-semibold text-foreground w-20">
                            <div className="flex items-center gap-2">
                              <span>Лок. {weekIndex + 1}</span>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => onCopyWeek(aptIndex, weekIndex)}
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
                        {week.timeLabels.map((timeLabel, timeIndex) => {
                          const style = rowStyles[timeIndex % rowStyles.length];
                          return (
                            <tr key={timeLabel} className={`border-b border-border ${style.bg}`}>
                              <td 
                                className={`p-2 text-center font-medium ${canEdit && onEditTimeSlot ? `cursor-pointer ${style.labelHover} transition-colors` : ''}`}
                                onClick={canEdit && onEditTimeSlot ? () => onEditTimeSlot(aptIndex, weekIndex, timeLabel) : undefined}
                                title={canEdit && onEditTimeSlot ? 'Нажмите для изменения времени' : ''}
                              >
                                {timeLabel}
                              </td>
                              {week.dates.map((date, dateIndex) => {
                                const cellValue = date.times[timeLabel];
                                const isFiltered = filterTeam && cellValue !== filterTeam;
                                const isOccupied = cellValue && cellValue.trim() !== '';
                                return (
                                  <td 
                                    key={dateIndex} 
                                    className={`p-2 text-center border-l border-border ${canEdit ? `cursor-pointer ${style.hoverBg} transition-colors` : ''} ${isFiltered ? 'opacity-20' : ''} ${isOccupied ? 'bg-green-500/10 font-semibold' : ''}`}
                                    onClick={canEdit ? () => onCellClick(aptIndex, weekIndex, dateIndex, timeLabel, cellValue) : undefined}
                                  >
                                    {cellValue}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
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
  );
};

export default ScheduleTable;