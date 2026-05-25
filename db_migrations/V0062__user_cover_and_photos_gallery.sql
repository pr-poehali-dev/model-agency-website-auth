ALTER TABLE t_p35405502_model_agency_website.users
ADD COLUMN IF NOT EXISTS cover_url TEXT;

CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.user_photos (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  photo_url TEXT NOT NULL,
  comment TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_photos_email ON t_p35405502_model_agency_website.user_photos(user_email);
CREATE INDEX IF NOT EXISTS idx_user_photos_position ON t_p35405502_model_agency_website.user_photos(user_email, position);