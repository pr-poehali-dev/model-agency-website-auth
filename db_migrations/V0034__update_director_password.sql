-- Update password for Dir@mba.com
-- New password: sajfnink1JAShjfasjnkiahsj
-- Bcrypt hash generated with cost factor 12

UPDATE t_p35405502_model_agency_website.users 
SET password_hash = '$2b$12$X8qZVH0rJVNQxPILKf9eKO8YzHwCQJ3KmXmEYvGKZF4R5PwN6QzSy',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'Dir@mba.com';