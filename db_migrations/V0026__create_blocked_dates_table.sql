-- Таблица для хранения заблокированных дат, когда нельзя вводить токены
CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.blocked_dates (
    id SERIAL PRIMARY KEY,
    blocked_date DATE NOT NULL UNIQUE,
    reason TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по дате
CREATE INDEX idx_blocked_dates_date ON t_p35405502_model_agency_website.blocked_dates(blocked_date);

-- Комментарии
COMMENT ON TABLE t_p35405502_model_agency_website.blocked_dates IS 'Заблокированные даты для ввода токенов';
COMMENT ON COLUMN t_p35405502_model_agency_website.blocked_dates.blocked_date IS 'Дата, когда нельзя вводить токены';
COMMENT ON COLUMN t_p35405502_model_agency_website.blocked_dates.reason IS 'Причина блокировки';
COMMENT ON COLUMN t_p35405502_model_agency_website.blocked_dates.created_by IS 'Email директора, который заблокировал дату';