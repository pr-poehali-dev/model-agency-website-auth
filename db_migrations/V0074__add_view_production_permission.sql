UPDATE t_p35405502_model_agency_website.users
SET permissions = (permissions::jsonb || '["view_production"]'::jsonb)::text
WHERE role IN ('director', 'producer')
  AND NOT (permissions::jsonb ? 'view_production');