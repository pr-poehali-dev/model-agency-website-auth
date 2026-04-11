ALTER TABLE t_p35405502_model_agency_website.model_pairs
    ADD COLUMN IF NOT EXISTS model_percentage NUMERIC(5,2) DEFAULT 17.5,
    ADD COLUMN IF NOT EXISTS operator_percentage NUMERIC(5,2) DEFAULT 15.0,
    ADD COLUMN IF NOT EXISTS producer_percentage NUMERIC(5,2) DEFAULT 10.0,
    ADD COLUMN IF NOT EXISTS operator_email VARCHAR(255) DEFAULT NULL;