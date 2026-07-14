-- Tabela de captação da Landing Page. Único módulo ativo do produto hoje.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  profile text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_email_unique on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

-- Nenhuma policy pública de select/insert é criada de propósito: o client
-- anônimo do browser nunca acessa esta tabela diretamente. Toda escrita
-- passa por app/api/waitlist/route.ts usando a service role key.
