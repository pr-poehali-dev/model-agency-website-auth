CREATE TABLE t_p35405502_model_agency_website.model_pairs (
    id SERIAL PRIMARY KEY,
    model1_email VARCHAR(255) NOT NULL,
    model2_email VARCHAR(255) NOT NULL,
    pair_photo_url TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(model1_email, model2_email)
);