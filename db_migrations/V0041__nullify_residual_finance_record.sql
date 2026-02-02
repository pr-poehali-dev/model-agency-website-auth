-- Nullify the residual finance record from old system
-- Set all values to 0 for the problematic record

UPDATE t_p35405502_model_agency_website.model_finances 
SET 
  cb_tokens = 0,
  sp_tokens = 0,
  soda_tokens = 0,
  stripchat_tokens = 0,
  cam4_tokens = 0,
  cb_income = 0,
  sp_income = 0,
  soda_income = 0,
  cam4_income = 0,
  transfers = 0,
  operator_name = ''
WHERE model_id = 50 AND date = '2026-02-01';