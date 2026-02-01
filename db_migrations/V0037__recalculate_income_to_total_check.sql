-- Пересчёт доходов: из "чека на продакшн" в "общий чек"
-- Старая формула: токены × 0.05 × 0.6 (чек на продакшн)
-- Новая формула: токены × 0.05 (общий чек)
-- Коэффициент пересчёта: Income / 0.6

UPDATE t_p35405502_model_agency_website.model_finances 
SET 
    cb_income = CASE 
        WHEN cb_tokens > 0 THEN cb_tokens * 0.05 
        WHEN cb_income > 0 THEN cb_income / 0.6 
        ELSE 0 
    END,
    sp_income = CASE 
        WHEN sp_tokens > 0 THEN sp_tokens * 0.05 
        WHEN sp_income > 0 THEN sp_income / 0.6 
        ELSE 0 
    END,
    soda_income = CASE 
        WHEN soda_tokens > 0 THEN soda_tokens * 0.05 
        WHEN soda_income > 0 THEN soda_income / 0.6 
        ELSE 0 
    END
WHERE cb_income > 0 OR sp_income > 0 OR soda_income > 0 OR cb_tokens > 0 OR sp_tokens > 0 OR soda_tokens > 0;