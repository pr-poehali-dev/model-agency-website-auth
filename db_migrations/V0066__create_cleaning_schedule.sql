CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.cleaning_schedule (
    id SERIAL PRIMARY KEY,
    cleaning_date DATE NOT NULL,
    apartment_name VARCHAR(255) NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    operator_emails TEXT NOT NULL DEFAULT '',
    created_by_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notified_emails TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_cleaning_schedule_date
    ON t_p35405502_model_agency_website.cleaning_schedule (cleaning_date);
