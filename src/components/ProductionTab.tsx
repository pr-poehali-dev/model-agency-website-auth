import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { UserRole } from '@/lib/permissions';
import StaffTable from '@/components/production/StaffTable';
import PromoTable from '@/components/production/PromoTable';
import CashCountTable from '@/components/production/CashCountTable';
import PastAccountsTable from '@/components/production/PastAccountsTable';
import ProducerPicker, { type ProducerOption } from '@/components/production/ProducerPicker';
import { confirmLeave } from '@/components/production/unsavedGuard';

interface ProductionTabProps {
  userRole?: UserRole;
  userEmail?: string;
}

interface ProductionSection {
  id: string;
  label: string;
  icon: string;
  description: string;
  accent: string;
}

const SECTIONS: ProductionSection[] = [
  {
    id: 'staff',
    label: 'Штат',
    icon: 'Users',
    description: 'Состав команды: модели, операторы, контент-мейкеры',
    accent: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400',
  },
  {
    id: 'promo',
    label: 'Промо',
    icon: 'Megaphone',
    description: 'Продвижение и рекламные активности',
    accent: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
  },
  {
    id: 'equipment',
    label: 'Оборудование',
    icon: 'Video',
    description: 'Учёт техники: что свободно, что на руках',
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
  },
  {
    id: 'cash-count',
    label: 'Подсчёт купюр',
    icon: 'Banknote',
    description: 'Пересчёт наличных и сверка сумм',
    accent: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400',
  },
  {
    id: 'past-accounts',
    label: 'Прошлые аккаунты',
    icon: 'Archive',
    description: 'История ранее использованных аккаунтов',
    accent: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400',
  },
];

const ProductionTab = ({ userRole, userEmail }: ProductionTabProps) => {
  const isDirector = userRole === 'director';
  const [activeSection, setActiveSection] = useState<ProductionSection | null>(null);
  const [picked, setPicked] = useState<ProducerOption | null>(null);

  const owner = isDirector ? picked?.email || '' : userEmail || '';

  if (isDirector && !picked) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Продакшн</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Выбери, чей продакшн открыть
          </p>
        </div>
        <ProducerPicker directorEmail={userEmail || ''} onPick={setPicked} />
      </div>
    );
  }

  if (activeSection) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => confirmLeave() && setActiveSection(null)}>
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Продакшн
          </Button>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {activeSection.label}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{activeSection.description}</p>
        </div>

        {activeSection.id === 'staff' ? (
          <StaffTable owner={owner} />
        ) : activeSection.id === 'promo' ? (
          <PromoTable owner={owner} />
        ) : activeSection.id === 'cash-count' ? (
          <CashCountTable viewerEmail={owner} viewerRole={isDirector && picked ? 'producer' : userRole || ''} owner={owner} />
        ) : activeSection.id === 'past-accounts' ? (
          <PastAccountsTable owner={owner} />
        ) : (
        <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="rounded-full bg-primary/10 border border-primary/20 p-5 mb-4">
                <Icon name={activeSection.icon} size={36} className="text-primary" />
              </div>
              <p className="text-foreground font-medium mb-1">Подраздел в работе</p>
              <p className="text-sm text-muted-foreground max-w-md"></p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {isDirector && (
        <Button variant="ghost" size="sm" onClick={() => confirmLeave() && setPicked(null)}>
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Все продюсеры
        </Button>
      )}

      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Продакшн</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isDirector && picked
            ? `Раздел: ${picked.name}`
            : 'Производство контента по твоим сотрудникам'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section)}
            className={`group text-left rounded-xl border bg-gradient-to-br p-5 transition-all duration-200 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 ${section.accent}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="rounded-lg bg-background/40 border border-white/10 p-2.5">
                <Icon name={section.icon} size={22} />
              </div>
              <Icon
                name="ChevronRight"
                size={18}
                className="mt-1 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100"
              />
            </div>
            <div className="text-base font-semibold text-foreground">{section.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductionTab;