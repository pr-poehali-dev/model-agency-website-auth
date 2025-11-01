import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { ApartmentData, EditCellData } from './types';

interface ScheduleTableProps {
  apartment: ApartmentData;
  aptIndex: number;
  filterTeam: string;
  canEdit: boolean;
  onCellClick: (aptIndex: number, weekIndex: number, dateIndex: number, time: string, currentValue: string) => void;
  onCellChange: (aptIndex: number, weekIndex: number, dateIndex: number, time: string, value: string) => void;
}

const ScheduleTable = ({
  apartment,
  aptIndex,
  filterTeam,
  canEdit,
  onCellClick,
  onCellChange
}: ScheduleTableProps) => {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{apartment.name}</h3>
        <p className="text-sm text-muted-foreground">{apartment.address}</p>
      </div>

      <div className="space-y-6">
        {apartment.weeks.map((week, weekIndex) => (
          <div key={weekIndex}>
            <h4 className="font-medium mb-3">{week.weekNumber}</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-2 text-left text-sm font-medium">День</th>
                    <th className="border border-border p-2 text-left text-sm font-medium">Дата</th>
                    <th className="border border-border p-2 text-center text-sm font-medium">
                      {apartment.shifts.morning}
                    </th>
                    <th className="border border-border p-2 text-center text-sm font-medium">
                      {apartment.shifts.day}
                    </th>
                    <th className="border border-border p-2 text-center text-sm font-medium">
                      {apartment.shifts.night}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {week.dates.map((dateData, dateIndex) => {
                    const shouldShowRow = !filterTeam || 
                      Object.values(dateData.times).some(val => 
                        val.toLowerCase().includes(filterTeam.toLowerCase())
                      );

                    if (!shouldShowRow) return null;

                    return (
                      <tr key={dateIndex} className="hover:bg-muted/30 transition-colors">
                        <td className="border border-border p-2 text-sm">{dateData.day}</td>
                        <td className="border border-border p-2 text-sm">{dateData.date}</td>
                        {Object.entries(dateData.times).map(([time, value]) => (
                          <td 
                            key={time} 
                            className="border border-border p-1 text-center cursor-pointer hover:bg-accent/50"
                            onClick={() => canEdit && onCellClick(aptIndex, weekIndex, dateIndex, time, value)}
                          >
                            {canEdit ? (
                              <Input
                                value={value}
                                onChange={(e) => onCellChange(aptIndex, weekIndex, dateIndex, time, e.target.value)}
                                className="text-center text-sm h-8 cursor-pointer border-0 bg-background/50"
                                placeholder="-"
                                readOnly
                              />
                            ) : (
                              <span className="text-sm">{value || '-'}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ScheduleTable;