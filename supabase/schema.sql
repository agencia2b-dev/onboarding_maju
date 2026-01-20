CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_info JSONB,
  target_audience TEXT,
  slogans TEXT,
  prior_experience TEXT,
  launch_event_date TEXT,
  visual_identity_files TEXT[],
  logo_preference TEXT,
  colors_typography TEXT,
  reference_links TEXT,
  expectations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (anon) - cuidado, melhor seria autenticado, mas para form público OK.
CREATE POLICY "Allow public inserts" ON briefings FOR INSERT WITH CHECK (true);

-- Política para permitir leitura apenas para admins (ou ninguém publicamente)
CREATE POLICY "Allow public read" ON briefings FOR SELECT USING (false);
