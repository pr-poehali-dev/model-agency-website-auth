-- Add stripchat_tokens column for separate Stripchat token tracking
-- Remove cam4_tokens and cam4_income as they are not used in the interface

ALTER TABLE t_p35405502_model_agency_website.model_finances 
ADD COLUMN stripchat_tokens numeric(10,2) DEFAULT 0;