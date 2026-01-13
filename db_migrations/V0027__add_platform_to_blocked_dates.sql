-- Добавляем поле platform для выбора площадки блокировки
ALTER TABLE t_p35405502_model_agency_website.blocked_dates 
ADD COLUMN platform VARCHAR(20) DEFAULT 'all';

-- Удаляем старый уникальный индекс
ALTER TABLE t_p35405502_model_agency_website.blocked_dates 
DROP CONSTRAINT IF EXISTS blocked_dates_blocked_date_key;

-- Создаём новый составной уникальный индекс (дата + платформа)
CREATE UNIQUE INDEX idx_blocked_dates_unique 
ON t_p35405502_model_agency_website.blocked_dates(blocked_date, platform);

-- Комментарий
COMMENT ON COLUMN t_p35405502_model_agency_website.blocked_dates.platform IS 'Площадка блокировки: all, chaturbate, stripchat';