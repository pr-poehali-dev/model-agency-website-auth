-- Update model_id for existing assignments based on model_email
UPDATE t_p35405502_model_agency_website.operator_model_assignments oma
SET model_id = u.id
FROM t_p35405502_model_agency_website.users u
WHERE oma.model_email = u.email 
  AND u.role = 'content_maker'
  AND (oma.model_id = 0 OR oma.model_id IS NULL);