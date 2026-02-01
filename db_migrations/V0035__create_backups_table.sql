-- Создание таблицы для хранения бэкапов
CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    backup_data TEXT NOT NULL,
    tables_count INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индекса для быстрого поиска по дате
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
