-- App roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Order statuses
CREATE TYPE public.payment_status AS ENUM (
  'pending_payment',
  'pending_payment_review',
  'approved',
  'rejected'
);
CREATE TYPE public.shipping_status AS ENUM (
  'not_shipped',
  'shipped',
  'delivered'
);

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
  receipt_image TEXT,
  notes TEXT,
  payment_status public.payment_status NOT NULL DEFAULT 'pending_payment',
  shipping_status public.shipping_status NOT NULL DEFAULT 'not_shipped',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller ON public.orders(seller_id);
CREATE INDEX idx_orders_payment ON public.orders(payment_status);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- View: buyer, seller, admin
CREATE POLICY "Order participants and admins can view"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- Insert: only buyer
CREATE POLICY "Buyers create their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Update: buyer/seller/admin (column-level enforcement done in app + via separate policies below)
CREATE POLICY "Buyer can update own order"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Seller can update own order"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admin can update any order"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Receipts storage (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false);

CREATE POLICY "Users upload their own receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users view their own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Users update their own receipts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );