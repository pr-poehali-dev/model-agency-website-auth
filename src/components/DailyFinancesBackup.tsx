import { useEffect } from 'react';

const BACKUP_URL = 'https://functions.poehali.dev/fdc50076-fc3b-4243-aebc-dfeb4c16e1ff';
const STORAGE_KEY = 'lastFinancesBackupDate';

const DailyFinancesBackup = () => {
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) return;

    const today = new Date().toISOString().slice(0, 10);
    const lastRun = localStorage.getItem(STORAGE_KEY);
    if (lastRun === today) return;

    fetch(BACKUP_URL, { method: 'POST' })
      .then((res) => {
        if (res.ok) {
          localStorage.setItem(STORAGE_KEY, today);
        }
      })
      .catch((err) => {
        console.error('Daily finances backup failed', err);
      });
  }, []);

  return null;
};

export default DailyFinancesBackup;
