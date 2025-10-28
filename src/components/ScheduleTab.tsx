import { Card } from '@/components/ui/card';

const scheduleData = {
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
};

const ScheduleTab = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Расписание</h2>
        <p className="text-muted-foreground">График работы по квартирам</p>
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
                                <td key={dateIndex} className="p-2 text-center border-l border-border">{date.times['10:00']}</td>
                              ))}
                            </tr>
                            <tr className="border-b border-border bg-orange-900/20 dark:bg-orange-900/20">
                              <td className="p-2 text-center font-medium">17:00</td>
                              {week.dates.map((date, dateIndex) => (
                                <td key={dateIndex} className="p-2 text-center border-l border-border">{date.times['17:00']}</td>
                              ))}
                            </tr>
                            <tr className="border-b border-border bg-slate-700/50 dark:bg-slate-700/50">
                              <td className="p-2 text-center font-medium">00:00</td>
                              {week.dates.map((date, dateIndex) => (
                                <td key={dateIndex} className="p-2 text-center border-l border-border">{date.times['00:00']}</td>
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
    </div>
  );
};

export default ScheduleTab;
