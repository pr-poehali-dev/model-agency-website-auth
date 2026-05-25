CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.achievement_types (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(16) NOT NULL DEFAULT '🏆',
    color VARCHAR(64) NOT NULL DEFAULT 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    created_by VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.producer_allowed_achievements (
    achievement_type_id INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.user_achievements (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    achievement_type_id INTEGER NOT NULL,
    granted_by_email VARCHAR(255) NOT NULL,
    granted_by_name VARCHAR(255),
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_email ON t_p35405502_model_agency_website.user_achievements(user_email);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON t_p35405502_model_agency_website.user_achievements(achievement_type_id);

INSERT INTO t_p35405502_model_agency_website.achievement_types (title, description, emoji, color, created_by)
VALUES
    ('Лучший сотрудник месяца', 'Выдающийся вклад в работу команды', '🏆', 'from-amber-500/20 to-yellow-500/20 border-amber-500/30', 'system'),
    ('Перевыполнение плана', 'План выполнен более чем на 120%', '🚀', 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30', 'system'),
    ('10 смен подряд', 'Отработано 10 смен без пропусков', '🔥', 'from-orange-500/20 to-red-500/20 border-orange-500/30', 'system'),
    ('Командный игрок', 'Помощь коллегам и поддержка команды', '🤝', 'from-blue-500/20 to-cyan-500/20 border-blue-500/30', 'system');