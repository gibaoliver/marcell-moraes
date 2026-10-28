-- ============================================================================
-- SCRIPT COMPLETO DO CMS DE NOTÍCIAS (SUPABASE SQL EDITOR)
-- Idempotente: Pode ser executado com segurança mesmo se já existirem tabelas.
-- Cole todo este conteúdo no SQL Editor do Supabase e clique em "Run".
-- ============================================================================

-- 1. TABELA DE CATEGORIAS
create table if not exists public.categorias (
    id uuid primary key default gen_random_uuid(),
    nome text not null unique,
    slug text not null unique,
    criado_em timestamptz not null default now()
);

alter table public.categorias enable row level security;

drop policy if exists "Leitura publica de categorias" on public.categorias;
drop policy if exists "Admins autenticados gerem categorias" on public.categorias;
drop policy if exists "Admins autenticados podem inserir categorias" on public.categorias;
drop policy if exists "Admins autenticados podem atualizar categorias" on public.categorias;
drop policy if exists "Admins autenticados podem apagar categorias" on public.categorias;

create policy "Leitura publica de categorias"
    on public.categorias for select
    to anon, authenticated
    using (true);

create policy "Admins autenticados gerem categorias"
    on public.categorias for all
    to authenticated
    using (true)
    with check (true);

insert into public.categorias (nome, slug) values
    ('Saúde Animal', 'saude-animal'),
    ('Resgates', 'resgates'),
    ('Projetos de Lei', 'projetos-de-lei'),
    ('Ações Comunitárias', 'acoes-comunitarias'),
    ('Eventos e Mutirões', 'eventos-e-mutiroes'),
    ('Agricultura', 'agricultura'),
    ('Política', 'politica')
on conflict (slug) do nothing;

-- ============================================================================
-- 2. TABELA DE NOTÍCIAS / POSTAGENS (COM TODOS OS CAMPOS DE SEO E IMAGEM)
-- ============================================================================
create table if not exists public.noticias (
    id uuid primary key default gen_random_uuid(),
    data_publicacao text default to_char(now(), 'DD/MM/YYYY'),
    titulo text not null,
    subtitulo text not null default '',
    titulo_seo text not null default '',
    descricao_seo text not null default '',
    palavras_chave text not null default '',
    categoria text not null default 'Saúde Animal',
    compressao_imagem text not null default '75%',
    capa_url text not null,
    legenda_imagem text not null default '',
    galeria_urls text[] not null default '{}',
    corpo text not null,
    publicado boolean not null default true,
    autor_email text,
    criado_em timestamptz not null default now()
);

-- Caso a tabela 'noticias' já tenha sido criada anteriormente, adiciona as novas colunas sem erro:
alter table public.noticias add column if not exists data_publicacao text default to_char(now(), 'DD/MM/YYYY');
alter table public.noticias add column if not exists subtitulo text not null default '';
alter table public.noticias add column if not exists titulo_seo text not null default '';
alter table public.noticias add column if not exists descricao_seo text not null default '';
alter table public.noticias add column if not exists palavras_chave text not null default '';
alter table public.noticias add column if not exists categoria text not null default 'Saúde Animal';
alter table public.noticias add column if not exists compressao_imagem text not null default '75%';
alter table public.noticias add column if not exists legenda_imagem text not null default '';
alter table public.noticias add column if not exists galeria_urls text[] not null default '{}';
alter table public.noticias add column if not exists publicado boolean not null default true;
alter table public.noticias add column if not exists autor_email text;

create index if not exists idx_noticias_criado_em on public.noticias (criado_em desc);
create index if not exists idx_noticias_categoria on public.noticias (categoria);

alter table public.noticias enable row level security;

drop policy if exists "Leitura publica de noticias publicadas" on public.noticias;
drop policy if exists "Admins autenticados podem inserir noticias" on public.noticias;
drop policy if exists "Admins autenticados podem atualizar noticias" on public.noticias;
drop policy if exists "Admins autenticados podem eliminar noticias" on public.noticias;
drop policy if exists "Admins autenticados gerem noticias" on public.noticias;

create policy "Leitura publica de noticias publicadas"
    on public.noticias for select
    to anon, authenticated
    using (publicado = true);

create policy "Admins autenticados gerem noticias"
    on public.noticias for all
    to authenticated
    using (true)
    with check (true);

-- ============================================================================
-- 3. TABELAS COMPLEMENTARES DO MENU LATERAL DO CMS
-- ============================================================================

-- 3.1 Importação RSS
create table if not exists public.rss_feeds (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    url text not null,
    categoria text not null default 'Saúde Animal',
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);
alter table public.rss_feeds enable row level security;
drop policy if exists "Admins gerem rss_feeds" on public.rss_feeds;
create policy "Admins gerem rss_feeds"
    on public.rss_feeds for all
    to authenticated
    using (true)
    with check (true);

-- 3.2 Anúncios / Banners
create table if not exists public.anuncios (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    posicao text not null default 'Topo',
    imagem_url text not null,
    link_url text default '#',
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);
alter table public.anuncios enable row level security;
drop policy if exists "Leitura publica de anuncios" on public.anuncios;
drop policy if exists "Admins gerem anuncios" on public.anuncios;
create policy "Leitura publica de anuncios"
    on public.anuncios for select
    to anon, authenticated
    using (ativo = true);
create policy "Admins gerem anuncios"
    on public.anuncios for all
    to authenticated
    using (true)
    with check (true);

-- 3.3 Configurações Gerais (Redes Sociais, Textos e Contatos)
create table if not exists public.configuracoes (
    chave text primary key,
    valor text not null default '',
    atualizado_em timestamptz not null default now()
);
alter table public.configuracoes enable row level security;
drop policy if exists "Leitura publica de configuracoes" on public.configuracoes;
drop policy if exists "Admins gerem configuracoes" on public.configuracoes;
create policy "Leitura publica de configuracoes"
    on public.configuracoes for select
    to anon, authenticated
    using (true);
create policy "Admins gerem configuracoes"
    on public.configuracoes for all
    to authenticated
    using (true)
    with check (true);

insert into public.configuracoes (chave, valor) values
    ('instagram', 'https://www.instagram.com/marcell_moraes45'),
    ('facebook', 'https://www.facebook.com/marcellmoraes'),
    ('youtube', ''),
    ('whatsapp', '5571999999999'),
    ('email_contato', 'contato@deputadomarcellmoraes.com.br'),
    ('telefone_contato', '(71) 99999-9999'),
    ('texto_institucional', 'Uma vida dedicada a proteger quem não pode falar.')
on conflict (chave) do nothing;

-- 3.4 Newsletter
create table if not exists public.newsletter (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    criado_em timestamptz not null default now()
);
alter table public.newsletter enable row level security;
drop policy if exists "Visitantes podem assinar newsletter" on public.newsletter;
drop policy if exists "Admins gerem newsletter" on public.newsletter;
create policy "Visitantes podem assinar newsletter"
    on public.newsletter for insert
    to anon, authenticated
    with check (true);
create policy "Admins gerem newsletter"
    on public.newsletter for all
    to authenticated
    using (true)
    with check (true);

-- 3.5 Usuários do Painel
create table if not exists public.usuarios_admin (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text not null unique,
    cargo text not null default 'Editor',
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);
alter table public.usuarios_admin enable row level security;
drop policy if exists "Admins gerem usuarios_admin" on public.usuarios_admin;
create policy "Admins gerem usuarios_admin"
    on public.usuarios_admin for all
    to authenticated
    using (true)
    with check (true);

-- ============================================================================
-- 4. STORAGE BUCKET ('noticias') E POLÍTICAS DE UPLOAD
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('noticias', 'noticias', true)
on conflict (id) do update set public = true;

drop policy if exists "Imagens das noticias sao publicas" on storage.objects;
drop policy if exists "Admins autenticados podem enviar imagens" on storage.objects;
drop policy if exists "Admins autenticados podem atualizar imagens" on storage.objects;
drop policy if exists "Admins autenticados podem apagar imagens" on storage.objects;

create policy "Imagens das noticias sao publicas"
    on storage.objects for select
    to public
    using (bucket_id = 'noticias');

create policy "Admins autenticados podem enviar imagens"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'noticias');

create policy "Admins autenticados podem atualizar imagens"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'noticias')
    with check (bucket_id = 'noticias');

create policy "Admins autenticados podem apagar imagens"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'noticias');
