-- Add operator_percentage column to operator_model_assignments table
-- Default is 20% for operator, which means producer gets 10% (30% - 20% = 10%)
ALTER TABLE t_p35405502_model_agency_website.operator_model_assignments 
ADD COLUMN operator_percentage INTEGER NOT NULL DEFAULT 20;

-- Add constraint to ensure operator_percentage is between 0 and 30
ALTER TABLE t_p35405502_model_agency_website.operator_model_assignments 
ADD CONSTRAINT operator_percentage_range CHECK (operator_percentage >= 0 AND operator_percentage <= 30);