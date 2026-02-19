-- Add codigo identifier column to carrera table
alter table carrera add column if not exists codigo text;
