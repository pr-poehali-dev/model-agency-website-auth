-- Таблица для связи операторов с моделями
CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.operator_model_assignments (
    id SERIAL PRIMARY KEY,
    operator_email VARCHAR(255) NOT NULL,
    model_id INTEGER NOT NULL,
    assigned_by VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operator_email ON t_p35405502_model_agency_website.operator_model_assignments(operator_email);
CREATE INDEX idx_model_id ON t_p35405502_model_agency_website.operator_model_assignments(model_id);