-- ============================================================================
-- Kanwal Shoes Store - Supabase Database Schema & Initial Setup
-- ============================================================================
-- Paste this entire file into the Supabase SQL Editor and click "Run".
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ur TEXT,
  collection TEXT NOT NULL CHECK (collection IN ('women', 'men', 'kids')),
  type TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  sale_price INTEGER CHECK (sale_price IS NULL OR sale_price >= 0),
  colours JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes JSONB NOT NULL DEFAULT '{}'::jsonb,
  photos TEXT[] NOT NULL DEFAULT '{}'::text[],
  video_url TEXT,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for public queries
CREATE INDEX IF NOT EXISTS idx_products_public ON public.products (collection, hidden, created_at DESC);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  payment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  subtotal INTEGER NOT NULL,
  delivery INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admin can view all products" ON public.products;
DROP POLICY IF EXISTS "Admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Admin can update products" ON public.products;
DROP POLICY IF EXISTS "Admin can delete products" ON public.products;

DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can delete orders" ON public.orders;

-- Products Policies:
-- Anyone can view products that are not hidden
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (hidden = false);

-- Only authenticated admin can view hidden products as well
CREATE POLICY "Admin can view all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated admin can insert, update, or delete products
CREATE POLICY "Admin can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- Orders Policies:
-- Only authenticated admin can view, update, or delete orders
CREATE POLICY "Admin can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (true);

-- 5. ATOMIC CHECKOUT FUNCTION: place_order
-- Security Definer: Runs with elevated privileges to check stock, decrease stock,
-- and insert the order in a single atomic transaction. Prevents race conditions / overselling.
CREATE OR REPLACE FUNCTION public.place_order(
  p_customer JSONB,
  p_items JSONB,
  p_payment TEXT,
  p_subtotal INTEGER,
  p_delivery INTEGER,
  p_total INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_no TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_size TEXT;
  v_qty INTEGER;
  v_prod RECORD;
  v_current_sizes JSONB;
  v_current_stock INTEGER;
  v_new_sizes JSONB;
BEGIN
  -- Basic validation
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty';
  END IF;

  -- Lock and validate each product and size stock atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'pid')::UUID;
    v_size := v_item->>'size';
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 1);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity % for item', v_qty;
    END IF;

    -- Row-level lock FOR UPDATE
    SELECT id, name, sizes INTO v_prod
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is no longer available', v_product_id;
    END IF;

    v_current_sizes := v_prod.sizes;
    v_current_stock := COALESCE((v_current_sizes->>v_size)::INTEGER, 0);

    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Not enough stock for "%" (size %): requested %, available %',
        v_prod.name, v_size, v_qty, v_current_stock;
    END IF;

    -- Decrement stock in sizes JSON
    v_new_sizes := jsonb_set(
      v_current_sizes,
      ARRAY[v_size],
      to_jsonb(v_current_stock - v_qty)
    );

    UPDATE public.products
    SET sizes = v_new_sizes
    WHERE id = v_product_id;
  END LOOP;

  -- Generate human-friendly order number: KS-YYMMDD-XXXX
  v_order_no := 'KS-' || to_char(timezone('utc'::text, now()), 'YYMMDD') || '-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');

  -- Insert the order
  INSERT INTO public.orders (
    order_no,
    customer,
    items,
    payment,
    status,
    subtotal,
    delivery,
    total
  ) VALUES (
    v_order_no,
    p_customer,
    p_items,
    p_payment,
    'pending',
    p_subtotal,
    p_delivery,
    p_total
  );

  RETURN v_order_no;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(JSONB, JSONB, TEXT, INTEGER, INTEGER, INTEGER) TO anon, authenticated;

-- 6. ORDER CANCELLATION RESTOCK FUNCTION: cancel_order
-- Puts the items stock back when an order is cancelled by the admin.
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item JSONB;
  v_product_id UUID;
  v_size TEXT;
  v_qty INTEGER;
  v_prod RECORD;
  v_current_sizes JSONB;
  v_current_stock INTEGER;
  v_new_sizes JSONB;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN; -- Already cancelled, avoid duplicate restock
  END IF;

  -- Restock all items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
  LOOP
    BEGIN
      v_product_id := (v_item->>'pid')::UUID;
      v_size := v_item->>'size';
      v_qty := COALESCE((v_item->>'qty')::INTEGER, 1);

      SELECT id, sizes INTO v_prod
      FROM public.products
      WHERE id = v_product_id
      FOR UPDATE;

      IF FOUND THEN
        v_current_sizes := v_prod.sizes;
        v_current_stock := COALESCE((v_current_sizes->>v_size)::INTEGER, 0);
        v_new_sizes := jsonb_set(
          v_current_sizes,
          ARRAY[v_size],
          to_jsonb(v_current_stock + v_qty)
        );
        UPDATE public.products
        SET sizes = v_new_sizes
        WHERE id = v_product_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- In case product was deleted, continue with remaining items
      NULL;
    END;
  END LOOP;

  UPDATE public.orders
  SET status = 'cancelled'
  WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order(UUID) TO authenticated;

-- 7. STORAGE BUCKET: product-media
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
DROP POLICY IF EXISTS "Public can view product media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload product media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update product media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete product media" ON storage.objects;

CREATE POLICY "Public can view product media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-media');

CREATE POLICY "Admin can upload product media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-media');

CREATE POLICY "Admin can update product media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-media')
  WITH CHECK (bucket_id = 'product-media');

CREATE POLICY "Admin can delete product media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-media');

-- 8. SEED INITIAL SAMPLE PRODUCTS
-- Insert the 13 verified shoes with complete photos, colours, and size stock.
INSERT INTO public.products (id, name, name_ur, collection, type, price, sale_price, colours, sizes, photos, video_url, hidden)
VALUES
-- WOMEN COLLECTION (Sizes 35 - 42)
(
  '00000000-0000-0000-0000-000000000001',
  'Kanwal Ankle Boot',
  'کنول اینکل بوٹ',
  'women',
  'boot',
  5900,
  4900,
  '[{"n":"Mocha Brown","c":"#6B4A3A"},{"n":"Black","c":"#2D1B2E"}]'::jsonb,
  '{"35":4,"36":6,"37":8,"38":6,"39":5,"40":4,"41":2,"42":2}'::jsonb,
  ARRAY['images/women-boot.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000002',
  'Kanwal Cloud Walk Sneaker',
  'کنول کلاؤڈ واک اسنیکر',
  'women',
  'sneaker',
  4600,
  NULL,
  '[{"n":"Lilac Purple","c":"#9B7AD4"},{"n":"Soft Lavender","c":"#B7A3D6"},{"n":"Pure White","c":"#F5F3F4"}]'::jsonb,
  '{"35":5,"36":7,"37":9,"38":7,"39":4,"40":3,"41":2,"42":1}'::jsonb,
  ARRAY['images/women-sneaker.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000003',
  'Kanwal Pearl Flat Sandal',
  'کنول پرل فلیٹ سینڈل',
  'women',
  'sandal',
  3400,
  2800,
  '[{"n":"Dusty Rose","c":"#C47A8F"},{"n":"Champagne Pink","c":"#D8A5B2"}]'::jsonb,
  '{"35":3,"36":5,"37":7,"38":6,"39":4,"40":3,"41":2,"42":1}'::jsonb,
  ARRAY['images/women-sandal.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000004',
  'Kanwal Soft Ballet Loafer',
  'کنول سافٹ بیلے لوفر',
  'women',
  'loafer',
  3800,
  NULL,
  '[{"n":"Blush Pink","c":"#DE9BAE"},{"n":"Rose Nude","c":"#D9A98C"}]'::jsonb,
  '{"35":4,"36":6,"37":8,"38":5,"39":3,"40":3,"41":2,"42":1}'::jsonb,
  ARRAY['images/women-loafer.jpg'],
  NULL,
  false
),

-- MEN COLLECTION (Sizes 39 - 46)
(
  '00000000-0000-0000-0000-000000000007',
  'Kanwal Leather Ankle Boot',
  'کنول لیدر اینکل بوٹ',
  'men',
  'boot',
  6900,
  5900,
  '[{"n":"Mocha Brown","c":"#5C3A2A"},{"n":"Midnight Black","c":"#1F1B24"}]'::jsonb,
  '{"39":4,"40":6,"41":8,"42":7,"43":5,"44":4,"45":3,"46":2}'::jsonb,
  ARRAY['images/men-boot.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000008',
  'Kanwal Cross-Strap Slide Sandal',
  'کنول کراس اسٹریپ سینڈل',
  'men',
  'sandal',
  3400,
  NULL,
  '[{"n":"Classic Black","c":"#1F1B24"},{"n":"Charcoal Grey","c":"#4A4A52"}]'::jsonb,
  '{"39":5,"40":7,"41":9,"42":8,"43":6,"44":4,"45":2,"46":2}'::jsonb,
  ARRAY['images/men-sandal.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000009',
  'Kanwal Peshawari Chappal Sandal',
  'کنول پشاوری چپل سینڈل',
  'men',
  'sandal',
  3900,
  3400,
  '[{"n":"Navy & Brown","c":"#27395E"},{"n":"Rich Walnut","c":"#5C3A2A"}]'::jsonb,
  '{"39":4,"40":6,"41":8,"42":8,"43":5,"44":4,"45":3,"46":2}'::jsonb,
  ARRAY['images/men-chappal.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000010',
  'Kanwal Runner Sports Sneaker',
  'کنول رنر اسپورٹس اسنیکر',
  'men',
  'sneaker',
  4900,
  NULL,
  '[{"n":"Navy Blue","c":"#1F2B48"},{"n":"Steel Grey","c":"#6B7280"}]'::jsonb,
  '{"39":6,"40":8,"41":10,"42":8,"43":6,"44":4,"45":3,"46":2}'::jsonb,
  ARRAY['images/men-sneaker.jpg'],
  NULL,
  false
),

-- KIDS COLLECTION (Sizes 18 - 34)
(
  '00000000-0000-0000-0000-000000000013',
  'Kanwal Kids Aero Sport Sneaker',
  'کنول کڈز ایرو اسپورٹس اسنیکر',
  'kids',
  'sneaker',
  2600,
  NULL,
  '[{"n":"Royal Blue & Orange","c":"#274CB5"},{"n":"Neon Lime","c":"#A3D42C"}]'::jsonb,
  '{"18":3,"19":3,"20":4,"21":4,"22":5,"23":5,"24":6,"25":6,"26":5,"27":5,"28":4,"29":4,"30":3,"31":3,"32":2,"33":2,"34":2}'::jsonb,
  ARRAY['images/kids-sneaker.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000014',
  'Kanwal Kids Active Runner Sneaker',
  'کنول کڈز ایکٹو رنر اسنیکر',
  'kids',
  'sneaker',
  2500,
  2100,
  '[{"n":"Bright Blue & Green","c":"#3472C6"},{"n":"Sunset Orange","c":"#EA6B25"}]'::jsonb,
  '{"18":4,"19":4,"20":5,"21":5,"22":6,"23":6,"24":6,"25":5,"26":5,"27":4,"28":4,"29":3,"30":3,"31":3,"32":2,"33":2,"34":1}'::jsonb,
  ARRAY['images/kids-runner.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000015',
  'Kanwal Kids Floral Charm Sandal',
  'کنول کڈز فلورل سینڈل',
  'kids',
  'sandal',
  2200,
  NULL,
  '[{"n":"Soft Blush & Gold","c":"#E2A4B8"},{"n":"Rose Pink","c":"#D58A9F"}]'::jsonb,
  '{"18":3,"19":3,"20":4,"21":4,"22":5,"23":5,"24":5,"25":4,"26":4,"27":3,"28":3,"29":2,"30":2,"31":2,"32":1,"33":1,"34":1}'::jsonb,
  ARRAY['images/kids-floral-sandal.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000016',
  'Kanwal Kids Caged Fisherman Sandal',
  'کنول کڈز کیجڈ لیدر سینڈل',
  'kids',
  'sandal',
  2400,
  1950,
  '[{"n":"Navy & Tan Brown","c":"#2C3E60"},{"n":"Walnut Brown","c":"#8A5A36"}]'::jsonb,
  '{"18":4,"19":4,"20":5,"21":5,"22":5,"23":6,"24":6,"25":5,"26":4,"27":4,"28":3,"29":3,"30":2,"31":2,"32":2,"33":1,"34":1}'::jsonb,
  ARRAY['images/kids-caged-sandal.jpg'],
  NULL,
  false
),
(
  '00000000-0000-0000-0000-000000000017',
  'Kanwal Kids Double Buckle Slide Sandal',
  'کنول کڈز ڈبل بکل سلائیڈ سینڈل',
  'kids',
  'sandal',
  2100,
  NULL,
  '[{"n":"Rich Walnut Leather","c":"#533325"},{"n":"Mocha Brown","c":"#6E4532"}]'::jsonb,
  '{"18":3,"19":4,"20":4,"21":5,"22":5,"23":5,"24":5,"25":4,"26":4,"27":3,"28":3,"29":2,"30":2,"31":2,"32":2,"33":1,"34":1}'::jsonb,
  ARRAY['images/kids-buckle-slide.jpg'],
  NULL,
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ur = EXCLUDED.name_ur,
  collection = EXCLUDED.collection,
  type = EXCLUDED.type,
  price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price,
  colours = EXCLUDED.colours,
  sizes = EXCLUDED.sizes,
  photos = EXCLUDED.photos,
  hidden = EXCLUDED.hidden;
