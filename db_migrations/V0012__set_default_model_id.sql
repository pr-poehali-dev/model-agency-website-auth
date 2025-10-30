
-- Добавить дефолтное значение для model_id в operator_model_assignments
ALTER TABLE t_p35405502_model_agency_website.operator_model_assignments 
ALTER COLUMN model_id SET DEFAULT 0;
