CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.schedule (
    id SERIAL PRIMARY KEY,
    apartment_name VARCHAR(255) NOT NULL,
    apartment_address VARCHAR(255) NOT NULL,
    week_number VARCHAR(50) NOT NULL,
    date VARCHAR(50) NOT NULL,
    day_name VARCHAR(50) NOT NULL,
    time_10 TEXT DEFAULT '',
    time_17 TEXT DEFAULT '',
    time_00 TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_apartment ON t_p35405502_model_agency_website.schedule(apartment_name, week_number, date);

COMMENT ON TABLE t_p35405502_model_agency_website.schedule IS 'Schedule for apartments with shifts';
