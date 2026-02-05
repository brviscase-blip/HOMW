
-- Script de configuração da base de dados no Supabase

-- 1. Criação da tabela de tarefas (Routines/Habits)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Média',
  status TEXT DEFAULT 'Pendente',
  category TEXT,
  due_date DATE DEFAULT CURRENT_DATE,
  days JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  icon TEXT DEFAULT 'List',
  icon_color TEXT DEFAULT '#0f172a',
  target_reps INTEGER DEFAULT 1,
  current_reps INTEGER DEFAULT 0,
  type TEXT NOT NULL,
  history JSONB DEFAULT '{}',
  time_window TEXT
);

-- 2. Nova Tabela: Áreas (Categorias para Demandas)
CREATE TABLE IF NOT EXISTS areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Nova Tabela: Demandas (Itens diretos de trabalho/vida)
CREATE TABLE IF NOT EXISTS demands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE ou CONCLUIDA
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitação de Realtime (Opcional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks, areas, demands;
