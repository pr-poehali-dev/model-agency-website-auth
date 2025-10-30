CREATE TABLE IF NOT EXISTS account_audit_log (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    changed_by_role VARCHAR(20) NOT NULL,
    old_login VARCHAR(255),
    new_login VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_account_audit_model ON account_audit_log(model_id);
CREATE INDEX idx_account_audit_date ON account_audit_log(changed_at DESC);