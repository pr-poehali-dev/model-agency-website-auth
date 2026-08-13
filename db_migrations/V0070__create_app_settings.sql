CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.app_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO t_p35405502_model_agency_website.app_settings (key, value)
VALUES ('idle_timeout_minutes', '10')
ON CONFLICT (key) DO NOTHING;
