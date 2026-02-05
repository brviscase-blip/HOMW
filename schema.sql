
-- Script de configuração consolidado da base de dados no Supabase

-- 1. Tabela de Tarefas, Hábitos e Cotidiano
-- Gerencia o fluxo operacional diário e o histórico de execuções
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
  type TEXT NOT NULL, -- 'HABITO', 'COTIDIANO' ou 'TAREFA'
  history JSONB DEFAULT '{}',
  time_window TEXT -- Janela de horário (ex: '05', '14')
);

-- 2. Tabela de Áreas de Vida/Gestão
-- Agrupadores para a nova guia de Demandas (Ex: Pessoal, Trabalho, Empresa)
CREATE TABLE IF NOT EXISTS areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Demandas (Itens de Gestão por Área)
-- Itens diretos e objetivos vinculados a uma área específica
CREATE TABLE IF NOT EXISTS demands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'PENDENTE', -- 'PENDENTE' ou 'CONCLUIDA'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instrução: Execute este script no SQL Editor do seu projeto Supabase.
-- As tabelas são criadas apenas se não existirem (IF NOT EXISTS), 
-- preservando dados se executado repetidamente.
