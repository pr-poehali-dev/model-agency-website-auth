CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.earned_bonuses (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  reason VARCHAR(255),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_email, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_earned_bonuses_lookup
  ON t_p35405502_model_agency_website.earned_bonuses(user_email, period_start, period_end);
