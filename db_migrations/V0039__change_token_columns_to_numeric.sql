-- Изменяем типы колонок токенов с integer на numeric для правильного сохранения значений
ALTER TABLE t_p35405502_model_agency_website.model_finances
  ALTER COLUMN cb_tokens TYPE numeric(10,2),
  ALTER COLUMN sp_tokens TYPE numeric(10,2),
  ALTER COLUMN soda_tokens TYPE numeric(10,2),
  ALTER COLUMN stripchat_tokens TYPE numeric(10,2);