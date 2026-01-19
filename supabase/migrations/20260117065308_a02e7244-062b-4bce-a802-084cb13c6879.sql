-- Add battery_health column to phones table (for iPhones only)
ALTER TABLE public.phones
ADD COLUMN battery_health INTEGER CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100));