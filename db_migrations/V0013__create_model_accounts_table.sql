-- Create model_accounts table for storing platform credentials
CREATE TABLE IF NOT EXISTS model_accounts (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    login VARCHAR(255),
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, platform)
);

-- Create index for faster lookups
CREATE INDEX idx_model_accounts_model_id ON model_accounts(model_id);

-- Insert sample data for existing models
INSERT INTO model_accounts (model_id, model_name, platform, login, password) VALUES
(1, 'Aria Chen', 'stripchat', 'aria_stripchat', 'pass123'),
(1, 'Aria Chen', 'chaturbate', 'aria_chaturbate', 'pass123'),
(1, 'Aria Chen', 'camsoda', 'aria_camsoda', 'pass123'),
(1, 'Aria Chen', 'cam4', 'aria_cam4', 'pass123'),
(1, 'Aria Chen', 'email', 'aria@example.com', 'emailpass123')
ON CONFLICT (model_id, platform) DO NOTHING;
