-- Messages table for product inquiries between buyer and seller
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_thread ON public.messages (product_id, buyer_id, created_at);
CREATE INDEX idx_messages_seller ON public.messages (seller_id, created_at DESC);
CREATE INDEX idx_messages_buyer ON public.messages (buyer_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread participants can view"
ON public.messages FOR SELECT TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Participants can send"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
);

CREATE POLICY "Recipient can mark read"
ON public.messages FOR UPDATE TO authenticated
USING ((auth.uid() = buyer_id OR auth.uid() = seller_id) AND auth.uid() <> sender_id)
WITH CHECK ((auth.uid() = buyer_id OR auth.uid() = seller_id) AND auth.uid() <> sender_id);

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;