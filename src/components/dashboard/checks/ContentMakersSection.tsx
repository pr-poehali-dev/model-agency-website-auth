import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Employee } from './types';

interface ContentMakersSectionProps {
  contentMakers: Employee[];
}

const ContentMakersSection = ({ contentMakers }: ContentMakersSectionProps) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="UserCircle" size={24} className="text-accent" />
        <h3 className="text-2xl font-serif font-bold">Контент-мейкеры</h3>
      </div>
      
      {contentMakers.map((employee, index) => {
        const dates = Array.from({ length: 16 }, (_, i) => `${16 + i}.10`);
        
        return (
          <Card key={index} className="mb-6 overflow-hidden">
            <div className="p-4 bg-purple-500/20 border-b">
              <h4 className="text-xl font-bold">{employee.name}</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-semibold min-w-[140px] sticky left-0 bg-muted/50">Настоящий период</th>
                    {dates.map((date) => (
                      <th key={date} className="p-2 text-center font-semibold min-w-[60px]">{date}</th>
                    ))}
                    <th className="p-2 text-center font-semibold min-w-[80px] bg-accent/10">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium sticky left-0 bg-background">Online CB</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center">
                        <div className="h-8 bg-muted/20 rounded"></div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold bg-accent/5">0</td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30 bg-red-500/5">
                    <td className="p-2 font-medium sticky left-0 bg-red-500/5">Chaturbate</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center">
                        <div className="h-8 bg-red-500/10 rounded"></div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold bg-red-500/10">0</td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium sticky left-0 bg-background">Online SP</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center">
                        <div className="h-8 bg-muted/20 rounded"></div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold bg-accent/5">Tokens</td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30 bg-purple-500/5">
                    <td className="p-2 font-medium sticky left-0 bg-purple-500/5">Stripchat</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center">
                        <div className="h-8 bg-purple-500/10 rounded"></div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold bg-purple-500/10">0</td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium sticky left-0 bg-background">Online Soda</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center">
                        <div className="h-8 bg-muted/20 rounded"></div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold bg-accent/5">Tokens</td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30 bg-blue-500/5">
                    <td className="p-2 font-medium sticky left-0 bg-blue-500/5">CamSoda</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center">
                        <div className="h-8 bg-blue-500/10 rounded"></div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold bg-blue-500/10">0</td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30 bg-pink-500/5">
                    <td className="p-2 font-medium sticky left-0 bg-pink-500/5">Cam4</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center">
                        <div className="h-8 bg-pink-500/10 rounded"></div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold bg-pink-500/10">0.0</td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium sticky left-0 bg-background">Переводы</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center">
                        <div className="h-8 bg-muted/20 rounded"></div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold bg-accent/5">0</td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium sticky left-0 bg-background">Оператор (Имя)</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center text-xs text-muted-foreground">Имя</td>
                    ))}
                    <td className="p-2 text-center"></td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium sticky left-0 bg-background">Смены</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center">
                        <input type="checkbox" className="w-4 h-4" />
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold bg-accent/5">0</td>
                  </tr>
                  
                  <tr className="border-b hover:bg-muted/30 bg-green-500/10">
                    <td className="p-2 font-bold sticky left-0 bg-green-500/10">Income</td>
                    {dates.map((date) => (
                      <td key={date} className="p-2 text-center font-semibold text-green-600">$0.00</td>
                    ))}
                    <td className="p-2 text-center font-bold text-lg text-green-600 bg-green-500/20">$0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ContentMakersSection;
