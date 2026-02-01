-- Очистка некорректных данных: убираем income там, где нет токенов
-- Это старые записи, где сохранялись только доллары без токенов

UPDATE t_p35405502_model_agency_website.model_finances 
SET 
    cb_income = 0,
    sp_income = 0,
    soda_income = 0
WHERE 
    cb_tokens = 0 AND sp_tokens = 0 AND soda_tokens = 0
    AND (cb_income > 0 OR sp_income > 0 OR soda_income > 0);