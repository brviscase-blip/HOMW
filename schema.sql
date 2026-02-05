
-- SCRIPT DE REPARAÇÃO DEFINITIVO V3 - FOCO NO ERRO 23502
-- Execute este bloco completo no SQL Editor do Supabase

-- 1. Garante que a coluna 'description' não trave o sistema (Erro 23502)
-- Primeiro criamos se não existir, depois removemos a restrição de NOT NULL
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE demands ADD COLUMN description TEXT DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN 
        ALTER TABLE demands ALTER COLUMN description DROP NOT NULL;
        ALTER TABLE demands ALTER COLUMN description SET DEFAULT '';
    END;
END $$;

-- 2. Garante as outras colunas essenciais
DO $$ 
BEGIN 
    -- Título
    BEGIN
        ALTER TABLE demands ADD COLUMN title TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    
    -- Área
    BEGIN
        ALTER TABLE demands ADD COLUMN area_id UUID REFERENCES areas(id);
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    -- Prioridade
    BEGIN
        ALTER TABLE demands ADD COLUMN priority TEXT DEFAULT 'MEDIA';
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    -- Status
    BEGIN
        ALTER TABLE demands ADD COLUMN status TEXT DEFAULT 'A FAZER';
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    -- Prazo
    BEGIN
        ALTER TABLE demands ADD COLUMN due_date DATE;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    -- Display ID (Numeração amigável)
    BEGIN
        ALTER TABLE demands ADD COLUMN display_id SERIAL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- 3. FORÇAR REFRESH DO CACHE (Técnica de Renomeação)
-- Isso mata o erro PGRST204 e 23502 de cache fantasma
ALTER TABLE demands RENAME TO demands_fix_tmp;
ALTER TABLE demands_fix_tmp RENAME TO demands;

-- 4. Notificar o PostgREST para recarregar
NOTIFY pgrst, 'reload schema';
