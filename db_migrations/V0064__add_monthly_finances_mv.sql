CREATE MATERIALIZED VIEW IF NOT EXISTS t_p35405502_model_agency_website.mv_model_finances_monthly AS
SELECT
    DATE_TRUNC('month', date)::date AS month_start,
    SUM(cb_tokens) AS total_cb_tokens,
    SUM(stripchat_tokens) AS total_sp_tokens,
    SUM(soda_tokens) AS total_soda_tokens,
    SUM(cam4_tokens) AS total_cam4_tokens,
    SUM(cb_income) AS total_cb_income,
    SUM(sp_income) AS total_sp_income,
    SUM(soda_income) AS total_soda_income,
    SUM(cam4_income) AS total_cam4_income,
    SUM(transfers) AS total_transfers,
    SUM(cb_income + sp_income + soda_income + cam4_income) AS total_revenue,
    COUNT(DISTINCT CASE WHEN has_shift THEN id END) AS shift_count
FROM t_p35405502_model_agency_website.model_finances
GROUP BY DATE_TRUNC('month', date);

CREATE UNIQUE INDEX IF NOT EXISTS mv_model_finances_monthly_month_idx
ON t_p35405502_model_agency_website.mv_model_finances_monthly (month_start);