ALTER TABLE t_p35405502_model_agency_website.production_staff
    ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE t_p35405502_model_agency_website.production_promo
    ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE t_p35405502_model_agency_website.production_cash
    ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE t_p35405502_model_agency_website.production_past_persons
    ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255) NOT NULL DEFAULT '';

UPDATE t_p35405502_model_agency_website.production_staff
    SET owner_email = 'dir@mba.com' WHERE owner_email = '';
UPDATE t_p35405502_model_agency_website.production_promo
    SET owner_email = 'dir@mba.com' WHERE owner_email = '';
UPDATE t_p35405502_model_agency_website.production_cash
    SET owner_email = 'dir@mba.com' WHERE owner_email = '';
UPDATE t_p35405502_model_agency_website.production_past_persons
    SET owner_email = 'dir@mba.com' WHERE owner_email = '';

CREATE INDEX IF NOT EXISTS idx_production_staff_owner
    ON t_p35405502_model_agency_website.production_staff (owner_email);
CREATE INDEX IF NOT EXISTS idx_production_promo_owner
    ON t_p35405502_model_agency_website.production_promo (owner_email);
CREATE INDEX IF NOT EXISTS idx_production_cash_owner
    ON t_p35405502_model_agency_website.production_cash (owner_email);
CREATE INDEX IF NOT EXISTS idx_production_past_persons_owner
    ON t_p35405502_model_agency_website.production_past_persons (owner_email);