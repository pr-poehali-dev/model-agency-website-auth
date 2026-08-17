ALTER TABLE t_p35405502_model_agency_website.users
  ADD COLUMN IF NOT EXISTS joined_at DATE;

COMMENT ON COLUMN t_p35405502_model_agency_website.users.joined_at
  IS 'Дата прихода в компанию, задаётся вручную. Если пусто — используется created_at';
