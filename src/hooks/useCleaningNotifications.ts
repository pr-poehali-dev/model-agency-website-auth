import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const CLEANING_URL = 'https://functions.poehali.dev/763769d4-880c-4e9f-8350-9ef2c9551ec3';

interface PendingCleaning {
  id: number;
  cleaning_date: string;
  apartment_name: string;
  comment: string;
  is_general?: boolean;
  role_match?: 'operator' | 'producer';
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
  } catch {
    return iso;
  }
};

export const useCleaningNotifications = (userEmail: string, userRole: string | null) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!userEmail || !userRole) return;
    const allowedRoles = ['operator', 'content_maker', 'solo_maker', 'producer'];
    if (!allowedRoles.includes(userRole)) return;

    const showNotifications = async () => {
      try {
        const res = await fetch(
          `${CLEANING_URL}?pending_for=${encodeURIComponent(userEmail)}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const pending: PendingCleaning[] = data.pending || [];

        for (const item of pending) {
          const apt = item.apartment_name ? ` (${item.apartment_name})` : '';
          const isProducerMatch = item.role_match === 'producer' || userRole === 'producer';
          const title = item.is_general
            ? isProducerMatch
              ? 'Назначена генеральная уборка (вы — продюсер)'
              : 'Назначена генеральная уборка'
            : isProducerMatch
              ? 'Назначена уборка (вы — продюсер)'
              : 'Назначена уборка';
          toast({
            title,
            description: `${formatDate(item.cleaning_date)}${apt}${
              item.comment ? ` — ${item.comment}` : ''
            }`,
          });
          await fetch(CLEANING_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'mark_notified',
              id: item.id,
              email: userEmail,
            }),
          });
        }
      } catch (err) {
        console.error('Cleaning notifications failed', err);
      }
    };

    showNotifications();
  }, [userEmail, userRole, toast]);
};

export default useCleaningNotifications;