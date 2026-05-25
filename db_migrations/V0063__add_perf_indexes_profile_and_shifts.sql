-- Индексы для ускорения функций profile и shift-progress

-- 1. Функциональный индекс по LOWER(email) — используется в profile.get_profile (LOWER(email) = %s)
CREATE INDEX IF NOT EXISTS idx_users_lower_email
  ON t_p35405502_model_agency_website.users (LOWER(email));

-- 2. Индекс по date для диапазонных запросов в model_finances (period_start..period_end)
CREATE INDEX IF NOT EXISTS idx_model_finances_date
  ON t_p35405502_model_agency_website.model_finances (date);

-- 3. Индекс для поиска по оператору + дате (LOWER(operator_name))
CREATE INDEX IF NOT EXISTS idx_model_finances_operator_date
  ON t_p35405502_model_agency_website.model_finances (LOWER(operator_name), date)
  WHERE has_shift = true;
