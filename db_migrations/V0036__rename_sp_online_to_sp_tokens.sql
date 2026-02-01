-- Rename sp_online to sp_tokens for consistency
ALTER TABLE t_p35405502_model_agency_website.model_finances 
RENAME COLUMN sp_online TO sp_tokens;