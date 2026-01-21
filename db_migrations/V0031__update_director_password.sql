-- Обновление пароля для директора Dir@mba.com на password123
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCO.odAp7zeIvH1EYiDNZ2/g.VGA5Gx2uS'
WHERE email = 'Dir@mba.com';