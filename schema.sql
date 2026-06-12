

-- ===== FILE: setup_supabase.sql =====

-- LEARNING HUB MULTI-SUBJECT SETUP SUPABASE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'user',
  blocked boolean default false,
  last_login timestamptz,
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists blocked boolean default false;
alter table public.profiles add column if not exists last_login timestamptz;

create table if not exists public.subjects (
  id bigserial primary key,
  code text unique not null,
  name text not null,
  description text,
  cover text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.questions (
  id bigserial primary key,
  subject_code text default 'HOD102',
  num integer,
  question text,
  options jsonb default '{}'::jsonb,
  answer text,
  answer_text text,
  images jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.questions add column if not exists subject_code text;
alter table public.questions add column if not exists is_active boolean default true;
update public.questions set subject_code = 'HOD102' where subject_code is null;
alter table public.questions alter column subject_code set default 'HOD102';
create unique index if not exists uq_questions_subject_num on public.questions(subject_code, num);
create index if not exists idx_questions_subject_code_num on public.questions(subject_code, num);

create table if not exists public.edit_requests (
  id bigserial primary key,
  question_id bigint,
  question_num bigint,
  user_id uuid,
  user_email text,
  old_data jsonb,
  new_data jsonb,
  reason text,
  status text default 'pending',
  admin_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz default now()
);

alter table public.edit_requests add column if not exists user_email text;
alter table public.edit_requests add column if not exists reason text;
alter table public.edit_requests add column if not exists status text default 'pending';
alter table public.edit_requests add column if not exists admin_note text;
alter table public.edit_requests add column if not exists reviewed_at timestamptz;
alter table public.edit_requests add column if not exists reviewed_by uuid;

create table if not exists public.question_history (
  id bigserial primary key,
  question_id bigint,
  request_id bigint,
  previous_data jsonb,
  new_data jsonb,
  changed_by uuid,
  approved_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.admin_logs (
  id bigserial primary key,
  admin_id uuid,
  admin_email text,
  action text not null,
  target_type text,
  target_id text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and coalesce(blocked,false) = false);
$$;
create or replace function public.is_editor_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor') and coalesce(blocked,false) = false);
$$;
create or replace function public.is_not_blocked()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and coalesce(blocked,false) = false);
$$;

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.questions enable row level security;
alter table public.edit_requests enable row level security;
alter table public.question_history enable row level security;
alter table public.admin_logs enable row level security;

drop policy if exists "profiles read own or editor" on public.profiles;
create policy "profiles read own or editor" on public.profiles for select to authenticated using (id = auth.uid() or public.is_editor_or_admin());
drop policy if exists "profiles insert own user" on public.profiles;
create policy "profiles insert own user" on public.profiles for insert to authenticated with check (id = auth.uid() and coalesce(role,'user') = 'user' and coalesce(blocked,false) = false);
drop policy if exists "profiles update own login" on public.profiles;
create policy "profiles update own login" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "subjects read authenticated" on public.subjects;
create policy "subjects read authenticated" on public.subjects for select to authenticated using (coalesce(is_active, true) = true);
drop policy if exists "questions read by subject" on public.questions;
create policy "questions read by subject" on public.questions for select to authenticated using (is_active = true or public.is_editor_or_admin());
drop policy if exists "questions editor write" on public.questions;
create policy "questions editor write" on public.questions for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
drop policy if exists "edit_requests insert own" on public.edit_requests;
create policy "edit_requests insert own" on public.edit_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and public.is_not_blocked());
drop policy if exists "edit_requests read own or editor" on public.edit_requests;
create policy "edit_requests read own or editor" on public.edit_requests for select to authenticated using (user_id = auth.uid() or public.is_editor_or_admin());
drop policy if exists "edit_requests editor update" on public.edit_requests;
create policy "edit_requests editor update" on public.edit_requests for update to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
drop policy if exists "question_history read editor" on public.question_history;
create policy "question_history read editor" on public.question_history for select to authenticated using (public.is_editor_or_admin());
drop policy if exists "question_history insert editor" on public.question_history;
create policy "question_history insert editor" on public.question_history for insert to authenticated with check (public.is_editor_or_admin());
drop policy if exists "admin_logs read admin" on public.admin_logs;
create policy "admin_logs read admin" on public.admin_logs for select to authenticated using (public.is_admin());
drop policy if exists "admin_logs insert admin" on public.admin_logs;
create policy "admin_logs insert admin" on public.admin_logs for insert to authenticated with check (public.is_admin());

notify pgrst, 'reload schema';



-- ===== FILE: quick_fix_MLN111_subjects.sql =====

-- QUICK FIX SUBJECTS + MLN111
create table if not exists public.subjects (
  id bigserial primary key,
  code text unique not null,
  name text not null,
  description text,
  cover text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.questions add column if not exists subject_code text;
update public.questions set subject_code = 'HOD102' where subject_code is null;
alter table public.questions alter column subject_code set default 'HOD102';
create unique index if not exists uq_questions_subject_num on public.questions(subject_code, num);
create index if not exists idx_questions_subject_code_num on public.questions(subject_code, num);

alter table public.subjects enable row level security;
drop policy if exists "subjects read authenticated" on public.subjects;
create policy "subjects read authenticated"
on public.subjects
for select to authenticated
using (coalesce(is_active, true) = true);

insert into public.subjects (code, name, description, cover, sort_order, is_active)
values
  ('HOD102', 'HOD102 Learning', 'Bộ câu hỏi và tài liệu HOD102.', '', 1, true),
  ('MLN111', 'MLN111 Learning', 'Bộ câu hỏi và tài liệu MLN111.', '', 2, true)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  cover = excluded.cover,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

notify pgrst, 'reload schema';



-- ===== FILE: seed_subjects.sql =====

-- SEED SUBJECTS FOR LEARNING HUB
insert into public.subjects (code, name, description, cover, sort_order, is_active)
values
  ('HOD102', 'HOD102 Learning', 'Bộ câu hỏi và tài liệu HOD102.', '', 1, true),
  ('MLN111', 'MLN111 Learning', 'Bộ câu hỏi và tài liệu MLN111.', '', 2, true)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  cover = excluded.cover,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

notify pgrst, 'reload schema';

-- seed question bank was moved to seed_questions.sql (one-time import only).

-- ===== PATCH_DB_REQUEST_SPAM_AND_MLN_ANSWER =====
with ranked as (
  select id, row_number() over (partition by question_id, user_id order by created_at desc nulls last, id desc) as rn
  from public.edit_requests where status = 'pending'
)
delete from public.edit_requests er using ranked r where er.id = r.id and r.rn > 1;
create unique index if not exists uq_edit_requests_one_pending_per_user_question on public.edit_requests(question_id, user_id) where status = 'pending';
drop policy if exists "edit_requests update own pending" on public.edit_requests;
create policy "edit_requests update own pending" on public.edit_requests for update to authenticated using (user_id = auth.uid() and status = 'pending' and public.is_not_blocked()) with check (user_id = auth.uid() and status = 'pending' and public.is_not_blocked());
notify pgrst, 'reload schema';
