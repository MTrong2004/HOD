

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


-- ===== FINAL_USER_LAST_ACTIVITY_20260613 =====
alter table public.profiles add column if not exists last_activity timestamptz;
update public.profiles set last_activity = coalesce(last_activity, last_login, created_at, now()) where last_activity is null;
create index if not exists idx_profiles_last_activity on public.profiles(last_activity desc);
notify pgrst, 'reload schema';


-- ===== ACCESS_APPROVAL_20260624 =====
alter table public.profiles add column if not exists approved boolean default false;
update public.profiles set approved = true where approved is null or approved = false;

create or replace function public.is_not_blocked()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and coalesce(blocked, false) = false
      and coalesce(approved, true) = true
  );
$$;

notify pgrst, 'reload schema';


-- ===== SUBJECT_REQUESTS_AND_TRASH_20260625 =====
create table if not exists public.subject_requests (
  id bigserial primary key,
  code text not null,
  name text not null,
  description text,
  questions_data jsonb default '[]'::jsonb,
  user_id uuid,
  user_email text,
  status text default 'pending',
  admin_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz default now()
);

alter table public.subject_requests enable row level security;

drop policy if exists "subject_requests insert own" on public.subject_requests;
create policy "subject_requests insert own" on public.subject_requests
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and public.is_not_blocked());

drop policy if exists "subject_requests read own or editor" on public.subject_requests;
create policy "subject_requests read own or editor" on public.subject_requests
  for select to authenticated
  using (user_id = auth.uid() or public.is_editor_or_admin());

drop policy if exists "subject_requests editor update" on public.subject_requests;
create policy "subject_requests editor update" on public.subject_requests
  for update to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

create table if not exists public.deleted_subjects (
  id bigserial primary key,
  original_data jsonb not null,
  deleted_by uuid,
  deleted_by_email text,
  deleted_at timestamptz default now()
);

alter table public.deleted_subjects enable row level security;

drop policy if exists "deleted_subjects admin only" on public.deleted_subjects;
create policy "deleted_subjects admin only" on public.deleted_subjects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  updated_by uuid
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings read all" on public.site_settings;
create policy "site_settings read all" on public.site_settings
  for select to authenticated using (true);

drop policy if exists "site_settings admin write" on public.site_settings;
create policy "site_settings admin write" on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.site_settings (key, value) values
  ('registration_mode', '"approval"'::jsonb)
on conflict (key) do nothing;

drop policy if exists "subjects editor write" on public.subjects;
create policy "subjects editor write" on public.subjects
  for all to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

notify pgrst, 'reload schema';


-- ===== PATCH_AVATAR_ROLE_ACTIONS_APPROVAL_20260625 =====
alter table public.profiles add column if not exists avatar_url text;

update public.profiles p
set avatar_url = coalesce(p.avatar_url, u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
where p.id = u.id and p.avatar_url is null;

drop policy if exists "profiles admin delete" on public.profiles;
create policy "profiles admin delete" on public.profiles
  for delete to authenticated
  using (public.is_admin());

notify pgrst, 'reload schema';


-- ===== REGISTRATION_GATE_SERVER_SIDE_20260626 =====
-- Fix 1: Trigger sync_profile_from_auth đọc registration_mode từ site_settings
-- Fix 2: Chuẩn hóa value (bỏ ngoặc kép thừa do JSON.stringify cũ)
-- Fix 3: RLS server-side: user chưa approved không đọc được questions/subjects
-- Fix 4: Realtime cho site_settings

update public.site_settings
set value = to_jsonb(trim(both '"' from (value #>> '{}')))
where key = 'registration_mode'
  and (value #>> '{}') like '"%"';

create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reg_mode text;
  auto_approve boolean;
begin
  select trim(both '"' from (value #>> '{}'))
  into reg_mode
  from public.site_settings
  where key = 'registration_mode';

  reg_mode := coalesce(reg_mode, 'approval');
  auto_approve := (reg_mode = 'open');

  insert into public.profiles (id, email, avatar_url, role, approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    'user',
    auto_approve
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$;

drop trigger if exists sync_profile_from_auth_trigger on auth.users;
create trigger sync_profile_from_auth_trigger
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_profile_from_auth();

create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and coalesce(approved, true) = true
      and coalesce(blocked, false) = false
  );
$$;

drop policy if exists "questions read by subject" on public.questions;
create policy "questions read by subject" on public.questions
  for select to authenticated
  using (
    (is_active = true and public.is_approved())
    or public.is_editor_or_admin()
  );

drop policy if exists "subjects read authenticated" on public.subjects;
create policy "subjects read authenticated" on public.subjects
  for select to authenticated
  using (
    coalesce(is_active, true) = true
    and (public.is_approved() or public.is_editor_or_admin())
  );

revoke all on function public.is_approved() from public;
revoke execute on function public.is_approved() from anon;
grant execute on function public.is_approved() to authenticated;

do $$
begin
  if to_regclass('public.site_settings') is not null then
    begin
      alter publication supabase_realtime add table public.site_settings;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

notify pgrst, 'reload schema';
