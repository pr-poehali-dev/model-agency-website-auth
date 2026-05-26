ALTER TABLE t_p35405502_model_agency_website.cleaning_schedule
    ADD COLUMN IF NOT EXISTS is_general BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS producer_emails TEXT NOT NULL DEFAULT '';
