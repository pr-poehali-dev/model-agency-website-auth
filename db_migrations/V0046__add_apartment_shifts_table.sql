-- Создание таблицы для хранения настроек смен квартир
CREATE TABLE IF NOT EXISTS t_p35405502_model_agency_website.apartment_shifts (
    id SERIAL PRIMARY KEY,
    apartment_name VARCHAR(255) NOT NULL,
    apartment_address VARCHAR(255) NOT NULL,
    shift_morning VARCHAR(50) DEFAULT '10:00 - 16:00',
    shift_day VARCHAR(50) DEFAULT '17:00 - 23:00',
    shift_night VARCHAR(50) DEFAULT '00:00 - 06:00',
    time_slot_1 VARCHAR(10) DEFAULT '10:00',
    time_slot_2 VARCHAR(10) DEFAULT '17:00',
    time_slot_3 VARCHAR(10) DEFAULT '00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(apartment_name, apartment_address)
);

-- Вставляем дефолтные значения для существующих квартир
INSERT INTO t_p35405502_model_agency_website.apartment_shifts 
    (apartment_name, apartment_address, shift_morning, shift_day, shift_night, time_slot_1, time_slot_2, time_slot_3)
VALUES 
    ('Командорская 5/3', '42 КВАРТИРА', '10:00 - 16:00', '17:00 - 23:00', '00:00 - 06:00', '10:00', '17:00', '00:00'),
    ('Бочарникова 4 к2', '188 КВАРТИРА', '10:00 - 16:00', '17:00 - 23:00', '00:00 - 06:00', '10:00', '17:00', '00:00')
ON CONFLICT (apartment_name, apartment_address) DO NOTHING;
