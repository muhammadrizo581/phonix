-- Add UPDATE policy for messages (sender can update their own messages)
CREATE POLICY "Users can update their own sent messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);