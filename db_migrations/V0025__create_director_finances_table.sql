CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.director_finances (
    id SERIAL PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    expenses DECIMAL(12, 2) DEFAULT 0,
    issued_funds DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_start, period_end)
);

CREATE INDEX idx_director_finances_period ON t_p35405502_model_agency_website.director_finances(period_start, period_end);