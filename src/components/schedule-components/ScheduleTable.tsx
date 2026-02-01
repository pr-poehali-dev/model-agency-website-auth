import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ApartmentWeek {
  weekNumber: string;
  dates: {
    day: string;
    date: string;
    times: {
      '10:00': string;
      '17:00': string;
      '00:00': string;
    };
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
}

const ScheduleTable = ({
  apartment,
  aptIndex,
  filterTeam,
  canEdit,
  onCellClick,
  onCopyWeek
}: ScheduleTableProps) => {
  return (
    <div className="space-y-4">
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
                                onClick={canEdit ? () => onCellClick(aptIndex, weekIndex, dateIndex, '10:00', cellValue) : undefined}
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
                                onClick={canEdit ? () => onCellClick(aptIndex, weekIndex, dateIndex, '17:00', cellValue) : undefined}
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
                                onClick={canEdit ? () => onCellClick(aptIndex, weekIndex, dateIndex, '00:00', cellValue) : undefined}
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
  );
};

export default ScheduleTable;
