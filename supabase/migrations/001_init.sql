begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('tpc_admin', 'student')),
  department text,
  batch_year int,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  cgpa numeric(3,2) check (cgpa >= 0 and cgpa <= 10),
  active_backlogs int not null default 0 check (active_backlogs >= 0),
  internship_count int not null default 0 check (internship_count >= 0),
  github_url text,
  linkedin_url text,
  resume_updated_at timestamptz,
  last_portal_login timestamptz,
  mock_tests_attempted int not null default 0 check (mock_tests_attempted >= 0),
  mock_avg_score numeric(5,2) check (mock_avg_score is null or mock_avg_score >= 0),
  certifications_count int not null default 0 check (certifications_count >= 0),
  placement_status text not null default 'unplaced' check (placement_status in ('unplaced', 'process', 'placed')),
  company_placed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_skills (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  skill_name text not null,
  proficiency text not null check (proficiency in ('beginner', 'intermediate', 'advanced')),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.vigilo_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  cluster text not null check (cluster in ('placement_ready', 'at_risk', 'silent_dropout')),
  placement_probability numeric(5,4) not null check (placement_probability >= 0 and placement_probability <= 1),
  score_breakdown jsonb not null,
  computed_at timestamptz not null default now(),
  is_latest boolean not null default true
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  activity_type text not null check (activity_type in ('portal_login', 'mock_test', 'resume_update', 'skill_added', 'job_applied', 'session_attended')),
  metadata jsonb,
  logged_at timestamptz not null default now()
);

create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  intervention_type text not null check (intervention_type in ('nudge_sent', 'meeting_scheduled', 'domain_shift_suggested', 'mock_assigned', 'counselling')),
  ai_generated_message text,
  custom_message text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'acknowledged', 'completed')),
  sent_at timestamptz,
  acknowledged_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  alert_type text not null check (alert_type in ('silent_30', 'score_drop', 'cluster_change', 'no_resume', 'zero_mocks')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  message text not null,
  is_read boolean not null default false,
  is_resolved boolean not null default false,
  triggered_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.placement_drives (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  role text not null,
  package_lpa numeric(6,2) check (package_lpa is null or package_lpa >= 0),
  drive_date date not null,
  eligibility_criteria jsonb not null,
  status text not null check (status in ('upcoming', 'ongoing', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.drive_applications (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references public.placement_drives (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('applied', 'shortlisted', 'rejected', 'selected')),
  applied_at timestamptz not null default now(),
  unique (drive_id, student_id)
);

create index if not exists idx_student_skills_student_id on public.student_skills (student_id);
create index if not exists idx_vigilo_scores_student_id on public.vigilo_scores (student_id);
create index if not exists idx_activity_logs_student_id on public.activity_logs (student_id);
create index if not exists idx_interventions_student_id on public.interventions (student_id);
create index if not exists idx_alerts_student_id on public.alerts (student_id);
create index if not exists idx_drive_applications_student_id on public.drive_applications (student_id);
create index if not exists idx_vigilo_scores_is_latest on public.vigilo_scores (is_latest);
create index if not exists idx_alerts_is_resolved on public.alerts (is_resolved);
create index if not exists idx_activity_logs_logged_at on public.activity_logs (logged_at);
create unique index if not exists idx_vigilo_scores_latest_per_student on public.vigilo_scores (student_id) where is_latest;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger trg_student_profiles_set_updated_at
before update on public.student_profiles
for each row
execute function public.set_updated_at();

create trigger trg_interventions_set_updated_at
before update on public.interventions
for each row
execute function public.set_updated_at();

create or replace function public.mark_previous_vigilo_scores_not_latest()
returns trigger
language plpgsql
as $$
begin
  if new.is_latest then
    update public.vigilo_scores
    set is_latest = false
    where student_id = new.student_id
      and id is distinct from new.id
      and is_latest = true;
  end if;

  return new;
end;
$$;

create trigger trg_vigilo_scores_latest
before insert on public.vigilo_scores
for each row
execute function public.mark_previous_vigilo_scores_not_latest();

create or replace function public.is_tpc_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'tpc_admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.student_skills enable row level security;
alter table public.vigilo_scores enable row level security;
alter table public.activity_logs enable row level security;
alter table public.interventions enable row level security;
alter table public.alerts enable row level security;
alter table public.placement_drives enable row level security;
alter table public.drive_applications enable row level security;

create policy profiles_student_select_own
on public.profiles
for select
using (id = auth.uid());

create policy profiles_admin_select_all
on public.profiles
for select
using (public.is_tpc_admin());

create policy profiles_admin_insert_all
on public.profiles
for insert
with check (public.is_tpc_admin());

create policy profiles_admin_update_all
on public.profiles
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

create policy student_profiles_student_select_own
on public.student_profiles
for select
using (id = auth.uid());

create policy student_profiles_admin_select_all
on public.student_profiles
for select
using (public.is_tpc_admin());

create policy student_profiles_admin_insert_all
on public.student_profiles
for insert
with check (public.is_tpc_admin());

create policy student_profiles_admin_update_all
on public.student_profiles
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

create policy student_skills_student_select_own
on public.student_skills
for select
using (student_id = auth.uid());

create policy student_skills_admin_select_all
on public.student_skills
for select
using (public.is_tpc_admin());

create policy student_skills_admin_insert_all
on public.student_skills
for insert
with check (public.is_tpc_admin());

create policy student_skills_admin_update_all
on public.student_skills
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

create policy vigilo_scores_student_select_own
on public.vigilo_scores
for select
using (student_id = auth.uid());

create policy vigilo_scores_admin_select_all
on public.vigilo_scores
for select
using (public.is_tpc_admin());

create policy vigilo_scores_admin_insert_all
on public.vigilo_scores
for insert
with check (public.is_tpc_admin());

create policy vigilo_scores_admin_update_all
on public.vigilo_scores
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

create policy activity_logs_student_select_own
on public.activity_logs
for select
using (student_id = auth.uid());

create policy activity_logs_admin_select_all
on public.activity_logs
for select
using (public.is_tpc_admin());

create policy activity_logs_admin_insert_all
on public.activity_logs
for insert
with check (public.is_tpc_admin());

create policy activity_logs_admin_update_all
on public.activity_logs
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

create policy interventions_student_select_own
on public.interventions
for select
using (student_id = auth.uid());

create policy interventions_admin_select_all
on public.interventions
for select
using (public.is_tpc_admin());

create policy interventions_admin_insert_all
on public.interventions
for insert
with check (public.is_tpc_admin());

create policy interventions_admin_update_all
on public.interventions
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

create policy alerts_student_select_own
on public.alerts
for select
using (student_id = auth.uid());

create policy alerts_admin_select_all
on public.alerts
for select
using (public.is_tpc_admin());

create policy alerts_admin_insert_all
on public.alerts
for insert
with check (public.is_tpc_admin());

create policy alerts_admin_update_all
on public.alerts
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

create policy placement_drives_admin_select_all
on public.placement_drives
for select
using (public.is_tpc_admin());

create policy placement_drives_admin_insert_all
on public.placement_drives
for insert
with check (public.is_tpc_admin());

create policy placement_drives_admin_update_all
on public.placement_drives
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

create policy drive_applications_student_select_own
on public.drive_applications
for select
using (student_id = auth.uid());

create policy drive_applications_admin_select_all
on public.drive_applications
for select
using (public.is_tpc_admin());

create policy drive_applications_admin_insert_all
on public.drive_applications
for insert
with check (public.is_tpc_admin());

create policy drive_applications_admin_update_all
on public.drive_applications
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

commit;
