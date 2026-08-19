CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.production_promo (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL DEFAULT '',
    password VARCHAR(255) NOT NULL DEFAULT '',
    sign_name VARCHAR(255) NOT NULL DEFAULT '',
    sign_date VARCHAR(20) NOT NULL DEFAULT '',
    model_name VARCHAR(255) NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_promo_order
    ON t_p35405502_model_agency_website.production_promo (sort_order, id);