CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('director', 'producer', 'operator', 'content')),
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

INSERT INTO users (email, password_hash, role, full_name) VALUES
('director@mba-corp.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IKOZWmVTOjKvxeQEOFJGJLVDz7vOXS', 'director', 'Директор'),
('producer@mba-corp.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IKOZWmVTOjKvxeQEOFJGJLVDz7vOXS', 'producer', 'Продюссер'),
('operator@mba-corp.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IKOZWmVTOjKvxeQEOFJGJLVDz7vOXS', 'operator', 'Оператор'),
('content@mba-corp.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IKOZWmVTOjKvxeQEOFJGJLVDz7vOXS', 'content', 'Контент-мейкер')
ON CONFLICT (email) DO NOTHING;