-- ============================================================================
-- SCRIPT DE ATUALIZAÇÃO SUPABASE: CATEGORIAS & AJUSTES NO PORTAL DE NOTÍCIAS
-- Cole este código no "SQL Editor" do Supabase e clique em "Run"
-- ============================================================================

-- 1. Criar tabela de Categorias
create table if not exists public.categorias (
    id uuid primary key default gen_random_uuid(),
    nome text not null unique,
    slug text not null unique,
    criado_em timestamptz not null default now()
);

-- Ativar RLS na tabela de categorias
alter table public.categorias enable row level security;

-- Políticas de RLS para categorias
drop policy if exists "Leitura publica de categorias" on public.categorias;
drop policy if exists "Admins autenticados podem inserir categorias" on public.categorias;
drop policy if exists "Admins autenticados podem atualizar categorias" on public.categorias;
drop policy if exists "Admins autenticados podem apagar categorias" on public.categorias;

create policy "Leitura publica de categorias"
    on public.categorias for select
    to anon, authenticated
    using (true);

create policy "Admins autenticados podem inserir categorias"
    on public.categorias for insert
    to authenticated
    with check (true);

create policy "Admins autenticados podem atualizar categorias"
    on public.categorias for update
    to authenticated
    using (true)
    with check (true);

create policy "Admins autenticados podem apagar categorias"
    on public.categorias for delete
    to authenticated
    using (true);

-- Inserir categorias padrão caso ainda não existam
insert into public.categorias (nome, slug) values
    ('Saúde Animal', 'saude-animal'),
    ('Resgates', 'resgates'),
    ('Projetos de Lei', 'projetos-de-lei'),
    ('Ações Comunitárias', 'acoes-comunitarias'),
    ('Eventos e Mutirões', 'eventos-e-mutiroes')
on conflict (slug) do nothing;

-- 2. Garantir coluna 'categoria' na tabela de notícias
alter table public.noticias
    add column if not exists categoria text not null default 'Saúde Animal';

-- Índice para acelerar busca por categoria
create index if not exists idx_noticias_categoria
    on public.noticias (categoria);

-- 3. Garantir tabela 'noticias' caso seja a primeira execução
create table if not exists public.noticias (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    subtitulo text not null,
    categoria text not null default 'Saúde Animal',
    corpo text not null,
    capa_url text not null,
    galeria_urls text[] not null default '{}',
    publicado boolean not null default true,
    autor_email text,
    criado_em timestamptz not null default now()
);

create index if not exists idx_noticias_criado_em
    on public.noticias (criado_em desc);

alter table public.noticias enable row level security;

drop policy if exists "Leitura publica de noticias publicadas" on public.noticias;
drop policy if exists "Admins autenticados podem inserir noticias" on public.noticias;
drop policy if exists "Admins autenticados podem atualizar noticias" on public.noticias;
drop policy if exists "Admins autenticados podem eliminar noticias" on public.noticias;

create policy "Leitura publica de noticias publicadas"
    on public.noticias for select
    to anon, authenticated
    using (publicado = true);

create policy "Admins autenticados podem inserir noticias"
    on public.noticias for insert
    to authenticated
    with check (true);

create policy "Admins autenticados podem atualizar noticias"
    on public.noticias for update
    to authenticated
    using (true)
    with check (true);

create policy "Admins autenticados podem eliminar noticias"
    on public.noticias for delete
    to authenticated
    using (true);

-- 4. Garantir Bucket de Storage 'noticias'
insert into storage.buckets (id, name, public)
values ('noticias', 'noticias', true)
on conflict (id) do update set public = true;

drop policy if exists "Imagens das noticias sao publicas" on storage.objects;
drop policy if exists "Admins autenticados podem enviar imagens" on storage.objects;
drop policy if exists "Admins autenticados podem apagar imagens" on storage.objects;

create policy "Imagens das noticias sao publicas"
    on storage.objects for select
    to public
    using (bucket_id = 'noticias');

create policy "Admins autenticados podem enviar imagens"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'noticias');

create policy "Admins autenticados podem apagar imagens"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'noticias');
