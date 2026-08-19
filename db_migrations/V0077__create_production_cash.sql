CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.production_cash (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL DEFAULT '',
    n5000 INTEGER NOT NULL DEFAULT 0,
    n1000 INTEGER NOT NULL DEFAULT 0,
    n500 INTEGER NOT NULL DEFAULT 0,
    salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_cash_order
    ON t_p35405502_model_agency_website.production_cash (sort_order, id);