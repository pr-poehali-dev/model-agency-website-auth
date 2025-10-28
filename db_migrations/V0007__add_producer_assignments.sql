-- Таблица для назначений продюсерам от директора
CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.producer_assignments (
    id SERIAL PRIMARY KEY,
    producer_email VARCHAR(255) NOT NULL,
    model_id INTEGER,
    operator_email VARCHAR(255),
    assigned_by VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN ('model', 'operator'))
);

CREATE INDEX idx_producer_email ON t_p35405502_model_agency_website.producer_assignments(producer_email);
CREATE INDEX idx_assignment_type ON t_p35405502_model_agency_website.producer_assignments(assignment_type);