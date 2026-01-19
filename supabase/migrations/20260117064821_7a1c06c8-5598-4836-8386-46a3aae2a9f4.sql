-- Add brand_id column to phones table
ALTER TABLE public.phones
ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;