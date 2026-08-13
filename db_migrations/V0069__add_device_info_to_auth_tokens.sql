ALTER TABLE t_p35405502_model_agency_website.auth_tokens
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64),
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS device VARCHAR(64),
    ADD COLUMN IF NOT EXISTS browser VARCHAR(64),
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_auth_tokens_active
    ON t_p35405502_model_agency_website.auth_tokens(is_active, expires_at);
