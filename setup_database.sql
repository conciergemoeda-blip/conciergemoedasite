-- ==========================================
-- 1. DROP TUDO (Reset Completo com CASCADE)
-- ==========================================

-- Safe Drop Policies for Properties
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'properties') THEN
        DROP POLICY IF EXISTS "Public Read" ON public.properties;
        DROP POLICY IF EXISTS "Auth Insert" ON public.properties;
        DROP POLICY IF EXISTS "Auth Update" ON public.properties;
        DROP POLICY IF EXISTS "Auth Delete" ON public.properties;
    END IF;
END $$;

-- Safe Drop Policies for Reviews
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        DROP POLICY IF EXISTS "Public Reviews Read" ON public.reviews;
        DROP POLICY IF EXISTS "Public Reviews Insert" ON public.reviews;
        DROP POLICY IF EXISTS "Auth Reviews Delete" ON public.reviews;
    END IF;
END $$;

-- Safe Drop Policies for Storage Objects (Storage schema always exists)
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Drop Tables (CASCADE garante que as dependências sumam)
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

CREATE TABLE public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Campos Básicos
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  price NUMERIC,
  weekend_price NUMERIC DEFAULT 0,
  cleaning_fee NUMERIC DEFAULT 0,
  min_stay INTEGER DEFAULT 1,
  
  -- Estatísticas e Capacidade
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0, -- Nota: Frontend mapeia 'reviews' para 'reviews_count'
  guests INTEGER DEFAULT 2,
  bedrooms INTEGER DEFAULT 1,
  beds INTEGER DEFAULT 1,
  baths INTEGER DEFAULT 1,
  
  -- Imagens e Features
  image_url TEXT, -- Snake case conforme PropertiesContext e mapeado para imageUrl
  gallery TEXT[], -- Array de URLs
  amenities TEXT[], -- Array de strings
  tags TEXT[], -- Array de strings ('Superhost', 'Novo', etc)
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true, -- Usado para pausar
  
  -- Contato e Dono (Flat Structure conforme propertyToDb)
  owner_id UUID, -- Link opcional para auth.users
  owner_phone TEXT,
  owner_name TEXT,
  owner_avatar_url TEXT,
  owner_bio TEXT,
  
  -- Geolocalização (Flat Structure)
  lat NUMERIC,
  lng NUMERIC
);

-- ==========================================
-- 3. STORAGE (BUCKETS)
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 4. CREATE SECONDARY TABLES (REVIEWS)
-- ==========================================

CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT
);

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) - TABLES
-- ==========================================

-- A) PROPERTIES
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Ver: Todos podem ver
CREATE POLICY "Public Read"
ON public.properties FOR SELECT
USING (true);

-- Criar: Apenas Autenticados
CREATE POLICY "Auth Insert"
ON public.properties FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Editar: Apenas Autenticados
CREATE POLICY "Auth Update"
ON public.properties FOR UPDATE
USING (auth.role() = 'authenticated');

-- Deletar: Apenas Autenticados
CREATE POLICY "Auth Delete"
ON public.properties FOR DELETE
USING (auth.role() = 'authenticated');

-- B) REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Ver: Todos podem ver reviews
CREATE POLICY "Public Reviews Read"
ON public.reviews FOR SELECT
USING (true);

-- Criar: Todos podem avaliar (Guest reviews)
CREATE POLICY "Public Reviews Insert"
ON public.reviews FOR INSERT
WITH CHECK (true);

-- Deletar: Apenas Autenticados (Moderador/Dono)
CREATE POLICY "Auth Reviews Delete"
ON public.reviews FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS) - STORAGE
-- ==========================================

-- Ver arquivos: Todos podem ver
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('avatars', 'property-images') );

-- Upload: Autenticados
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('avatars', 'property-images')
  AND auth.role() = 'authenticated'
);

-- Update: Autenticados
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('avatars', 'property-images')
  AND auth.role() = 'authenticated'
);

-- Delete: Autenticados
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('avatars', 'property-images')
  AND auth.role() = 'authenticated'
);
