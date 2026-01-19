-- Create storage bucket for phone images
INSERT INTO storage.buckets (id, name, public) VALUES ('phone-images', 'phone-images', true);

-- RLS policies for phone-images bucket
CREATE POLICY "Anyone can view phone images"
ON storage.objects FOR SELECT
USING (bucket_id = 'phone-images');

CREATE POLICY "Authenticated users can upload phone images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'phone-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own phone images"
ON storage.objects FOR DELETE
USING (bucket_id = 'phone-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create phone_images table for multiple images per phone
CREATE TABLE public.phone_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_id UUID NOT NULL REFERENCES public.phones(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view phone images
CREATE POLICY "Phone images are viewable by everyone"
ON public.phone_images FOR SELECT
USING (true);

-- Only phone owner can insert images
CREATE POLICY "Phone owners can insert images"
ON public.phone_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.phones 
    WHERE phones.id = phone_id AND phones.owner_id = auth.uid()
  )
);

-- Only phone owner can delete images
CREATE POLICY "Phone owners can delete images"
ON public.phone_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.phones 
    WHERE phones.id = phone_id AND phones.owner_id = auth.uid()
  )
);

-- Add DELETE policy for messages (sender can delete their own messages)
CREATE POLICY "Users can delete their own sent messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- Add image_urls column to messages for chat images
ALTER TABLE public.messages ADD COLUMN image_urls TEXT[] DEFAULT NULL;