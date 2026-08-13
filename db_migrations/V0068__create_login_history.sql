CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p35405502_model_agency_website.users(id),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    device VARCHAR(64),
    browser VARCHAR(64),
    success BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON t_p35405502_model_agency_website.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON t_p35405502_model_agency_website.login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_email ON t_p35405502_model_agency_website.login_history(email);
