-- Create salary_adjustments table for storing advances, penalties, and expenses
CREATE TABLE IF NOT EXISTS salary_adjustments (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    advance DECIMAL(10, 2) DEFAULT 0,
    penalty DECIMAL(10, 2) DEFAULT 0,
    expenses DECIMAL(10, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    UNIQUE(email, period_start, period_end)
);

CREATE INDEX idx_salary_adjustments_email ON salary_adjustments(email);
CREATE INDEX idx_salary_adjustments_period ON salary_adjustments(period_start, period_end);