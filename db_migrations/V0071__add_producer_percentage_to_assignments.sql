ALTER TABLE t_p35405502_model_agency_website.producer_assignments
ADD COLUMN IF NOT EXISTS producer_percentage NUMERIC(5,2);

ALTER TABLE t_p35405502_model_agency_website.producer_assignments
ADD CONSTRAINT producer_percentage_range
CHECK (producer_percentage IS NULL OR (producer_percentage >= 0 AND producer_percentage <= 15));
