
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    assigned_to_email VARCHAR(255) NOT NULL,
    assigned_by_email VARCHAR(255) NOT NULL,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_email);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by_email);
CREATE INDEX idx_tasks_status ON tasks(status);
