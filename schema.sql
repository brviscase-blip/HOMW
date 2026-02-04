-- Script de configuração da base de dados no Supabase

-- 1. Criação da tabela (apenas se não existir)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Média',
  status TEXT DEFAULT 'Pendente',
  category TEXT,
  due_date DATE DEFAULT CURRENT_DATE,
  days JSONB, -- Array de strings ['Seg', 'Ter'...]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  icon TEXT DEFAULT 'List',
  icon_color TEXT DEFAULT '#0f172a',
  target_reps INTEGER DEFAULT 1,
  current_reps INTEGER DEFAULT 0,
  type TEXT NOT NULL, -- 'HABITO', 'COTIDIANO' ou 'TAREFA'
  history JSONB DEFAULT '{}' -- Objeto mapeando data para progresso
);

-- 2. Adição segura do campo time_window (se ele ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='time_window') THEN
        ALTER TABLE tasks ADD COLUMN time_window TEXT;
    END IF;
END $$;

-- 3. Habilitação de Realtime (Opcional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks;