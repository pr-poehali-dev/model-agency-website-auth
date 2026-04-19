CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.producer_income_plans (
  id SERIAL PRIMARY KEY,
  producer_email VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  plan_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  set_by_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(producer_email, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_producer_plans_lookup
  ON t_p35405502_model_agency_website.producer_income_plans(producer_email, period_start, period_end);
