-- Обновление пароля директора Dir@mba.com на SHA256 хеш для password123
-- SHA256('password123') = ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
UPDATE users 
SET password_hash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
WHERE email = 'Dir@mba.com';