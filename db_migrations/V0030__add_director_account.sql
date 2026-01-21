-- Создание нового аккаунта директора Dir@mba.com с паролем password123
INSERT INTO users (email, password_hash, role, full_name, is_active, permissions) 
VALUES ('Dir@mba.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aqaaf6C6EXQU', 'director', 'Director MBA', true, '[]')
ON CONFLICT (email) DO NOTHING;