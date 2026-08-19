CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.production_staff (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(20) NOT NULL,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    birth_date VARCHAR(20) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    telegram VARCHAR(100) NOT NULL DEFAULT '',
    google_account VARCHAR(255) NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_staff_kind
    ON t_p35405502_model_agency_website.production_staff (kind, sort_order, id);