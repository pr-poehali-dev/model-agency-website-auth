ALTER TABLE t_p35405502_model_agency_website.user_achievements
ADD COLUMN IF NOT EXISTS seen_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_user_achievements_unseen
ON t_p35405502_model_agency_website.user_achievements(user_email)
WHERE seen_at IS NULL;