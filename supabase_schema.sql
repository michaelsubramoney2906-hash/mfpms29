-- Supabase Database Initialization Script for NKANGALA / MZANSI Compliant PMS platform
-- Run this in the Supabase SQL Editor on your active instance, supporting high performance JSONB 500-page virtualization positioning mapping

-- Create 'chapters' table if not exists with high concurrency indexing
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    chapter_index INTEGER NOT NULL,
    content TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable index on document_id to keep queries under 2ms over high volume operations
CREATE INDEX IF NOT EXISTS idx_chapters_document_id ON chapters(document_id);

-- Create 'master_compiled_docs' table for virtual elements layout schemas containing absolute coordinates positioning
CREATE TABLE IF NOT EXISTS master_compiled_docs (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable fast indexing for compiled documents document_id schema searches
CREATE INDEX IF NOT EXISTS idx_master_compiled_docs_document_id ON master_compiled_docs(document_id);

-- Optional: Enable Supabase Realtime replication on these tables for instant broadcast synchronization updates
alter publication supabase_realtime add table chapters;
alter publication supabase_realtime add table master_compiled_docs;

COMMENT ON TABLE chapters IS 'Holds plain text content of chapters for virtualized collaborative editors.';
COMMENT ON TABLE master_compiled_docs IS 'Holds interactive JSONB elements, absolute canvas layout dimensions (width, height, posX, posY) for zero-lag virtualized compiling.';
