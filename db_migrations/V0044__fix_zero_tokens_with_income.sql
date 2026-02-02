-- Fix remaining records where tokens are 0 but income exists
-- This happens when user edited income directly in old interface
-- Calculate tokens from income: tokens = income / 0.05

UPDATE t_p35405502_model_agency_website.model_finances 
SET 
  cb_tokens = CASE WHEN cb_tokens = 0 AND cb_income > 0 THEN ROUND(cb_income / 0.05) ELSE cb_tokens END,
  sp_tokens = CASE WHEN sp_tokens = 0 AND sp_income > 0 THEN ROUND(sp_income / 0.05) ELSE sp_tokens END,
  soda_tokens = CASE WHEN soda_tokens = 0 AND soda_income > 0 THEN ROUND(soda_income / 0.05) ELSE soda_tokens END
WHERE (cb_tokens = 0 AND cb_income > 0) OR (sp_tokens = 0 AND sp_income > 0) OR (soda_tokens = 0 AND soda_income > 0);