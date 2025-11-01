-- Удаляем старый constraint на роли
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Добавляем новый constraint с ролью solo_maker
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('director', 'producer', 'operator', 'solo_maker', 'content_maker'));