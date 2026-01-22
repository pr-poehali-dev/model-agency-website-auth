-- Обновление прав доступа для всех ролей
UPDATE users SET permissions = '["view_home","view_models","view_finances","view_checks","view_schedule","view_dashboard","view_files","manage_users","manage_assignments","manage_producers","view_audit"]' WHERE role = 'director';
UPDATE users SET permissions = '["view_home","view_models","view_finances","view_checks","view_schedule","view_files","manage_assignments"]' WHERE role = 'producer';
UPDATE users SET permissions = '["view_home","view_models","view_schedule","view_files"]' WHERE role = 'operator';
UPDATE users SET permissions = '["view_home","view_models","view_schedule","view_files"]' WHERE role = 'solo_maker';
UPDATE users SET permissions = '["view_home","view_files"]' WHERE role = 'content_maker';