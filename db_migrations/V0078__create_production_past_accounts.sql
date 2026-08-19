CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.production_past_persons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.production_past_accounts (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL,
    platform VARCHAR(100) NOT NULL DEFAULT '',
    login VARCHAR(255) NOT NULL DEFAULT '',
    password VARCHAR(255) NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_past_accounts_person
    ON t_p35405502_model_agency_website.production_past_accounts (person_id, sort_order, id);