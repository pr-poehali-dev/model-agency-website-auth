ALTER TABLE t_p35405502_model_agency_website.schedule
ADD CONSTRAINT schedule_unique_entry UNIQUE (apartment_name, apartment_address, week_number, date);