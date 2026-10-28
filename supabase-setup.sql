-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO SUPABASE: PORTAL DE NOTÍCIAS (MARCELL MORAES)
-- Cole este código no "SQL Editor" do Supabase e clique em "Run"
-- ============================================================================

-- 1. Criar a tabela de notícias
create table if not exists public.noticias (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    subtitulo text not null,
    corpo text not null,
    capa_url text not null,
    galeria_urls text[] not null default '{}',
    publicado boolean not null default true,
    autor_email text,
    criado_em timestamptz not null default now()
);

-- 2. Criar índice para acelerar a ordenação da mais recente para a mais antiga
create index if not exists idx_noticias_criado_em
    on public.noticias (criado_em desc);

-- 3. Ativar Row Level Security (RLS) na tabela
alter table public.noticias enable row level security;

-- Remover políticas antigas caso o script seja executado novamente
drop policy if exists "Leitura publica de noticias publicadas" on public.noticias;
drop policy if exists "Admins autenticados podem inserir noticias" on public.noticias;
drop policy if exists "Admins autenticados podem atualizar noticias" on public.noticias;
drop policy if exists "Admins autenticados podem eliminar noticias" on public.noticias;

-- Política 1: Qualquer visitante (anon ou logado) pode ler as notícias publicadas
create policy "Leitura publica de noticias publicadas"
    on public.noticias
    for select
    to anon, authenticated
    using (publicado = true);

-- Política 2: Apenas utilizadores autenticados no Supabase Auth podem criar notícias
create policy "Admins autenticados podem inserir noticias"
    on public.noticias
    for insert
    to authenticated
    with check (true);

-- Política 3: Apenas utilizadores autenticados podem editar notícias
create policy "Admins autenticados podem atualizar noticias"
    on public.noticias
    for update
    to authenticated
    using (true)
    with check (true);

-- Política 4: Apenas utilizadores autenticados podem excluir notícias
create policy "Admins autenticados podem eliminar noticias"
    on public.noticias
    for delete
    to authenticated
    using (true);

-- ============================================================================
-- 4. CONFIGURAÇÃO AUTOMÁTICA DO STORAGE (BUCKET 'noticias')
-- ============================================================================

-- Cria o bucket público 'noticias' para armazenar capas e galerias
insert into storage.buckets (id, name, public)
values ('noticias', 'noticias', true)
on conflict (id) do update set public = true;

-- Remover políticas antigas de storage caso existam
drop policy if exists "Imagens das noticias sao publicas" on storage.objects;
drop policy if exists "Admins autenticados podem enviar imagens" on storage.objects;
drop policy if exists "Admins autenticados podem apagar imagens" on storage.objects;

-- Permitir visualização pública das imagens do bucket 'noticias'
create policy "Imagens das noticias sao publicas"
    on storage.objects
    for select
    to public
    using (bucket_id = 'noticias');

-- Permitir upload de imagens apenas para utilizadores autenticados
create policy "Admins autenticados podem enviar imagens"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'noticias');

-- Permitir exclusão de imagens apenas para utilizadores autenticados
create policy "Admins autenticados podem apagar imagens"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'noticias');

