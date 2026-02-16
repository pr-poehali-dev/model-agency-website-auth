ALTER TABLE t_p35405502_model_agency_website.apartment_shifts 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) NOT NULL DEFAULT 'all';