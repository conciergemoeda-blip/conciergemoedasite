-- ==========================================
-- CREATE ANALYTICS EVENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_type TEXT NOT NULL, -- 'PAGE_VIEW' or 'PROPERTY_VIEW'
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE, -- NULL for general pages
  path TEXT -- e.g., '/' or '/property/123'
);

-- RLS Policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Public can Insert (Anyone visiting the site can generate an event)
CREATE POLICY "Public Insert Event" 
ON public.analytics_events FOR INSERT 
WITH CHECK (true);

-- Only authenticated users (Admins) can Read
CREATE POLICY "Admins Read Events" 
ON public.analytics_events FOR SELECT 
USING (auth.role() = 'authenticated');
