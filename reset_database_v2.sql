-- ============================================================
-- ☢️ RESET COMPLETO DO BANCO DE DADOS - Concierge Moeda
-- ============================================================
-- CUIDADO: Isso vai APAGAR TODOS os imóveis cadastrados.
-- Use isso para limpar dados corrompidos/pesados e começar do zero.
-- ============================================================

-- 1. Derrubar Tabela Antiga (Limpeza Total)
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;

-- 2. Recriar Tabela Properties (Estrutura Otimizada)
CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    
    -- Dados Principais
    title text NOT NULL,
    description text,
    price numeric NOT NULL DEFAULT 0,
    location text NOT NULL,
    
    -- Mídia (Agora preparado para URLs leves)
    image_url text,
    gallery text[] DEFAULT '{}',
    
    -- Detalhes
    amenities text[] DEFAULT '{}',
    guests integer DEFAULT 2,
    bedrooms integer DEFAULT 1,
    beds integer DEFAULT 1,
    baths integer DEFAULT 1,
    
    -- Proprietário (Permite nulo para testes)
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_phone text,
    owner_name text DEFAULT 'Proprietário',
    owner_bio text,
    owner_avatar_url text,
    
    -- Geolocalização
    lat numeric DEFAULT 0,
    lng numeric DEFAULT 0,
    
    -- Metadados
    featured boolean DEFAULT false,
    active boolean DEFAULT true,
    rating numeric DEFAULT 5.0,
    reviews_count integer DEFAULT 0
);

-- 3. Recriar Tabela Reviews
CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    author_name text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. Permissões "Modo MVP" (Tudo Liberado para facilitar testes)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Liberar GERAL (Leitura, Escrita, Edição, Deleção)
CREATE POLICY "Liberar Geral Properties" ON public.properties FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Liberar Geral Reviews" ON public.reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Índices de Performance
CREATE INDEX idx_properties_created_at ON public.properties(created_at DESC);
CREATE INDEX idx_properties_active ON public.properties(active);

-- ============================================================
-- MENSAGEM DE SUCESSO
-- ============================================================
-- Se rodou até aqui sem erro, seu banco está NOVO em folha.
