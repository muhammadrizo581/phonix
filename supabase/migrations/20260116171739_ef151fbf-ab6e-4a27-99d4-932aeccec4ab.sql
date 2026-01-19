-- Add city, storage, and condition columns to phone_requests
ALTER TABLE public.phone_requests 
ADD COLUMN city public.uzbekistan_city,
ADD COLUMN storage public.phone_storage,
ADD COLUMN condition public.phone_condition;