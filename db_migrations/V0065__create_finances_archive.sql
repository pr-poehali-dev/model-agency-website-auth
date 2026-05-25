CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.model_finances_archive (
    archive_id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    snapshot_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id INTEGER NOT NULL,
    model_id INTEGER NOT NULL,
    date DATE NOT NULL,
    cb_tokens NUMERIC(10,2),
    sp_tokens NUMERIC(10,2),
    soda_tokens NUMERIC(10,2),
    cb_income NUMERIC(10,2),
    sp_income NUMERIC(10,2),
    soda_income NUMERIC(10,2),
    operator_name VARCHAR(255),
    has_shift BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    transfers NUMERIC(10,2),
    stripchat_tokens NUMERIC(10,2),
    cb_online NUMERIC(10,2),
    sp_online NUMERIC(10,2),
    soda_online NUMERIC(10,2),
    cam4_tokens NUMERIC(10,2),
    cam4_income NUMERIC(10,2)
);

CREATE INDEX IF NOT EXISTS idx_mfa_snapshot_date ON t_p35405502_model_agency_website.model_finances_archive (snapshot_date);
CREATE INDEX IF NOT EXISTS idx_mfa_model_date ON t_p35405502_model_agency_website.model_finances_archive (model_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mfa_snapshot_finance ON t_p35405502_model_agency_website.model_finances_archive (snapshot_date, id);