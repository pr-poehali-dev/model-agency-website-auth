-- Сначала обновляем существующие записи с ролью 'content' на 'content_maker'
UPDATE users SET role = 'content_maker' WHERE role = 'content';

-- Удаляем старый constraint на роли
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Добавляем новый constraint с правильными ролями
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('director', 'producer', 'operator', 'content_maker'));