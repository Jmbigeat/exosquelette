-- Exosquelette — Schema de base de donnees
-- A executer dans Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new)

-- Table profiles : lie chaque utilisateur auth a un statut de paiement
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  paid boolean default false,
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- Table sprints : stocke l'etat complet du sprint en JSONB
create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  state jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table payments : log des paiements Stripe
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  stripe_session_id text unique,
  amount integer,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Index pour les requetes frequentes
create index if not exists idx_sprints_user on public.sprints(user_id);
create index if not exists idx_payments_user on public.payments(user_id);

-- Row Level Security : chaque utilisateur voit uniquement ses donnees
alter table public.profiles enable row level security;
alter table public.sprints enable row level security;
alter table public.payments enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users read own sprints"
  on public.sprints for select
  using (auth.uid() = user_id);

create policy "Users insert own sprints"
  on public.sprints for insert
  with check (auth.uid() = user_id);

create policy "Users update own sprints"
  on public.sprints for update
  using (auth.uid() = user_id);

create policy "Users read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Trigger : cree un profil automatiquement quand un utilisateur s'inscrit
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
