-- Consentimento LGPD, metadados de dispositivo/origem e updated_at
-- automático para a tabela `waitlist`. Segue o roadmap documentado em
-- supabase/migrations/README.md — próximas tabelas repetem o mesmo padrão
-- de trigger de updated_at e RLS sem policy pública.

alter table public.waitlist
  add column if not exists lgpd_consent boolean not null default false,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists landing text,
  add column if not exists referrer text,
  add column if not exists user_agent text,
  add column if not exists device text,
  add column if not exists browser text,
  add column if not exists os text,
  add column if not exists ip inet;

-- Função genérica de updated_at — reaproveitável pelas próximas tabelas
-- do roadmap (drivers, passengers, companies, rides...).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists waitlist_set_updated_at on public.waitlist;
create trigger waitlist_set_updated_at
  before update on public.waitlist
  for each row
  execute function public.set_updated_at();

-- Índices para consultas de CRM/marketing (paginação por data, segmentação
-- por origem e por perfil). Parciais porque a maioria dos leads vem sem
-- todos os campos preenchidos.
create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);

create index if not exists waitlist_utm_source_idx
  on public.waitlist (utm_source)
  where utm_source is not null;

create index if not exists waitlist_profile_idx
  on public.waitlist (profile)
  where profile is not null;
