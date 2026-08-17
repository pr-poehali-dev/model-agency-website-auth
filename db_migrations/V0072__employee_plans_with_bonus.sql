CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.employee_plans (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'income',
  plan_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus_amount NUMERIC(12,2) NOT NULL DEFAULT 5000,
  set_by_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_email, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_employee_plans_lookup
  ON t_p35405502_model_agency_website.employee_plans(user_email, period_start, period_end);

INSERT INTO t_p35405502_model_agency_website.employee_plans
  (user_email, user_role, period_start, period_end, plan_type, plan_amount, bonus_amount, set_by_email)
SELECT p.producer_email, 'producer', p.period_start, p.period_end, 'income', p.plan_amount, 5000, p.set_by_email
FROM t_p35405502_model_agency_website.producer_income_plans p
ON CONFLICT (user_email, period_start, period_end) DO NOTHING;
