-- Add online hours columns to model_finances table
ALTER TABLE t_p35405502_model_agency_website.model_finances
ADD COLUMN IF NOT EXISTS cb_online NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sp_online NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS soda_online NUMERIC(5,2) DEFAULT 0;