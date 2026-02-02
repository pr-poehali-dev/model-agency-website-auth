-- Fix records where income exists but tokens are 0 or NULL
-- Calculate tokens back from income (income / 0.05 = tokens)

UPDATE t_p35405502_model_agency_website.model_finances
SET 
  cb_tokens = CASE 
    WHEN (cb_tokens = 0 OR cb_tokens IS NULL) AND cb_income > 0 
    THEN cb_income / 0.05 
    ELSE cb_tokens 
  END,
  sp_tokens = CASE 
    WHEN (sp_tokens = 0 OR sp_tokens IS NULL) AND sp_income > 0 
    THEN sp_income / 0.05 
    ELSE sp_tokens 
  END,
  soda_tokens = CASE 
    WHEN (soda_tokens = 0 OR soda_tokens IS NULL) AND soda_income > 0 
    THEN soda_income / 0.05 
    ELSE soda_tokens 
  END
WHERE 
  ((cb_tokens = 0 OR cb_tokens IS NULL) AND cb_income > 0)
  OR ((sp_tokens = 0 OR sp_tokens IS NULL) AND sp_income > 0)
  OR ((soda_tokens = 0 OR soda_tokens IS NULL) AND soda_income > 0);