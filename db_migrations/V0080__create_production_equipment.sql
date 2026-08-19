CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.production_equipment (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT '',
    kind VARCHAR(100) NOT NULL DEFAULT '',
    serial_number VARCHAR(100) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'free',
    holder VARCHAR(255) NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    owner_email VARCHAR(255) NOT NULL DEFAULT '',
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_equipment_owner
    ON t_p35405502_model_agency_website.production_equipment (owner_email, sort_order, id);