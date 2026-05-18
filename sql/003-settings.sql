-- Tabela de configuracoes da loja (single row, JSONB)
CREATE TABLE IF NOT EXISTS fp_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configuracoes padrao
INSERT INTO fp_settings (id, data) VALUES ('main', '{
  "social_proof": true,
  "auto_carousel": true,
  "urgency_badges": true,
  "urgency_threshold": 12,
  "impact_phrases": true,
  "welcome_discount": false,
  "welcome_code": "BEMVINDA",
  "welcome_pct": 10,
  "cart_recovery": true,
  "cart_recovery_hours": 1,
  "whatsapp_number": ""
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE fp_settings ENABLE ROW LEVEL SECURITY;

-- Leitura publica (a loja precisa ler as settings)
CREATE POLICY "fp_settings_read" ON fp_settings FOR SELECT USING (true);

-- Escrita apenas via anon key (admin verificado no client)
CREATE POLICY "fp_settings_write" ON fp_settings FOR UPDATE USING (true);
CREATE POLICY "fp_settings_insert" ON fp_settings FOR INSERT WITH CHECK (true);
