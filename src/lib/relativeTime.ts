export const parseUtcDate = (iso: string): Date => {
  let s = iso.replace(' ', 'T');
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z';
  return new Date(s);
};

export const formatRelativeTime = (iso: string): string => {
  try {
    const d = parseUtcDate(iso);
    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);

    if (sec < 0) return 'только что';
    if (sec < 60) return 'только что';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} ${pluralize(min, 'минуту', 'минуты', 'минут')} назад`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} ${pluralize(hr, 'час', 'часа', 'часов')} назад`;
    const day = Math.floor(hr / 24);
    if (day === 1) return 'вчера';
    if (day < 7) return `${day} ${pluralize(day, 'день', 'дня', 'дней')} назад`;
    if (day < 30) {
      const w = Math.floor(day / 7);
      return `${w} ${pluralize(w, 'неделю', 'недели', 'недель')} назад`;
    }
    if (day < 365) {
      const m = Math.floor(day / 30);
      return `${m} ${pluralize(m, 'месяц', 'месяца', 'месяцев')} назад`;
    }
    const y = Math.floor(day / 365);
    return `${y} ${pluralize(y, 'год', 'года', 'лет')} назад`;
  } catch {
    return '';
  }
};

const pluralize = (n: number, one: string, few: string, many: string): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
};
