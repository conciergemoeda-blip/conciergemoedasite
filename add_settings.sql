-- ==========================================
-- CONFIGURAÇÕES GLOBAIS DO SITE
-- ==========================================

-- 1. Criar a tabela
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança
DROP POLICY IF EXISTS "Public Read Settings" ON public.site_settings;
CREATE POLICY "Public Read Settings" 
ON public.site_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Auth Update Settings" ON public.site_settings;
CREATE POLICY "Auth Update Settings" 
ON public.site_settings FOR UPDATE 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Insert Settings" ON public.site_settings;
CREATE POLICY "Auth Insert Settings" 
ON public.site_settings FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 4. Inserir dados iniciais (se não existirem)
INSERT INTO public.site_settings (id, whatsapp, email)
VALUES ('main', '5531999999999', 'contato@conciergemoeda.com.br')
ON CONFLICT (id) DO NOTHING;
