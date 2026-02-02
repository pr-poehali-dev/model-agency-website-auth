interface UserManagementHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddUser: () => void;
  onCleanup: () => void;
  onClearFinances: () => void;
  loading: boolean;
  currentUserRole: string | null;
}

const UserManagementHeader = ({
  searchQuery,
  onSearchChange,
  onAddUser,
  onCleanup,
  onClearFinances,
  loading,
  currentUserRole
}: UserManagementHeaderProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Управление пользователями</h2>
        <p className="text-muted-foreground">Создавайте учетные записи и управляйте правами доступа</p>
      </div>
      
      <div className="flex items-center gap-2">
        {currentUserRole === 'director' && (
          <>
            <button
              onClick={onCleanup}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg border border-destructive/20 transition-colors disabled:opacity-50"
              title="Удалить назначения удалённых пользователей"
            >
              Очистить назначения
            </button>
            <button
              onClick={onClearFinances}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800 transition-colors disabled:opacity-50"
              title="Очистить все финансовые данные моделей"
            >
              Очистить финансы
            </button>
          </>
        )}
        <button
          onClick={onAddUser}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          Добавить пользователя
        </button>
        <div className="relative flex-1 lg:w-64">
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagementHeader;