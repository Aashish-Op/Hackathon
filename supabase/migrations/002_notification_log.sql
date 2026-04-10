begin;

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid references public.interventions (id) on delete set null,
  student_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms', 'whatsapp')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed')),
  message_preview text,
  is_read boolean not null default false,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_log_student_created_at
  on public.notification_log (student_id, created_at desc);

create index if not exists idx_notification_log_intervention_id
  on public.notification_log (intervention_id);

alter table public.notification_log enable row level security;

drop policy if exists notification_log_student_select_own on public.notification_log;
create policy notification_log_student_select_own
on public.notification_log
for select
using (student_id = auth.uid());

drop policy if exists notification_log_admin_select_all on public.notification_log;
create policy notification_log_admin_select_all
on public.notification_log
for select
using (public.is_tpc_admin());

drop policy if exists notification_log_admin_insert_all on public.notification_log;
create policy notification_log_admin_insert_all
on public.notification_log
for insert
with check (public.is_tpc_admin());

drop policy if exists notification_log_admin_update_all on public.notification_log;
create policy notification_log_admin_update_all
on public.notification_log
for update
using (public.is_tpc_admin())
with check (public.is_tpc_admin());

commit;
