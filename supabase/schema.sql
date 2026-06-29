-- Pega y ejecuta esto una sola vez en el SQL Editor de tu proyecto de Supabase
-- (Project → SQL Editor → New query). Crea la tabla donde vive el perfil de
-- cada usuario y las políticas de Row Level Security que aseguran que cada
-- persona solo pueda ver/editar su propia fila.

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  alergias text default '',
  composicion text default '',
  objetivo text default '',
  no_quieren text default '',
  contexto jsonb default '{}',
  historial jsonb default '[]',
  updated_at timestamptz default now()
);

alter table public.perfiles enable row level security;

create policy "usuarios ven su propia fila" on public.perfiles
  for select using (auth.uid() = id);

create policy "usuarios insertan su propia fila" on public.perfiles
  for insert with check (auth.uid() = id);

create policy "usuarios actualizan su propia fila" on public.perfiles
  for update using (auth.uid() = id);
