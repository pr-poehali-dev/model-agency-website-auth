let pending = 0;

export const setPendingChanges = (count: number) => {
  pending = count;
};

export const getPendingChanges = () => pending;

export const confirmLeave = () => {
  if (pending === 0) return true;
  return window.confirm(
    `Есть несохранённые изменения (${pending}). Выйти без сохранения?`,
  );
};
