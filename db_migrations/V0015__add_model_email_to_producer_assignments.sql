
-- Добавляем model_email в producer_assignments
ALTER TABLE t_p35405502_model_agency_website.producer_assignments 
ADD COLUMN IF NOT EXISTS model_email VARCHAR(255);

-- Переносим существующие данные из model_id в model_email
UPDATE t_p35405502_model_agency_website.producer_assignments 
SET model_email = (
    SELECT email FROM t_p35405502_model_agency_website.users 
    WHERE id = producer_assignments.model_id
)
WHERE model_id IS NOT NULL AND model_email IS NULL;
