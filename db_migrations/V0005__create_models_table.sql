CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image TEXT,
    height VARCHAR(50),
    bust VARCHAR(50),
    waist VARCHAR(50),
    hips VARCHAR(50),
    experience VARCHAR(100),
    specialty VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);