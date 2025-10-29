-- Create table for storing model financial data
CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.model_finances (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL,
    date DATE NOT NULL,
    cb_tokens INTEGER DEFAULT 0,
    sp_online INTEGER DEFAULT 0,
    soda_tokens INTEGER DEFAULT 0,
    cam4_tokens NUMERIC(10,2) DEFAULT 0,
    cb_income NUMERIC(10,2) DEFAULT 0,
    sp_income NUMERIC(10,2) DEFAULT 0,
    soda_income NUMERIC(10,2) DEFAULT 0,
    cam4_income NUMERIC(10,2) DEFAULT 0,
    stripchat_tokens INTEGER DEFAULT 0,
    operator_name VARCHAR(255),
    has_shift BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, date)
);

-- Create index for faster queries
CREATE INDEX idx_model_finances_model_date ON t_p35405502_model_agency_website.model_finances(model_id, date);

COMMENT ON TABLE t_p35405502_model_agency_website.model_finances IS 'Financial statistics for models across different platforms';