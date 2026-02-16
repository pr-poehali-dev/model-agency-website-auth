
UPDATE t_p35405502_model_agency_website.users 
SET permissions = REPLACE(permissions::text, ']', ',"view_tasks"]')
WHERE role IN ('director', 'producer', 'operator') 
  AND permissions IS NOT NULL 
  AND permissions::text NOT LIKE '%view_tasks%';
