begin;

alter table if exists public.interventions
  add column if not exists deleted_at timestamptz;

do $$
begin
  alter table public.interventions
    drop constraint if exists interventions_intervention_type_check;

  alter table public.interventions
    add constraint interventions_intervention_type_check
    check (
      intervention_type in (
        'nudge_sent',
        'meeting_scheduled',
        'domain_shift_suggested',
        'mock_assigned',
        'counselling',
        'weekly_check_in',
        'weekly_recommendation'
      )
    );
exception
  when undefined_table then
    raise notice 'Table public.interventions does not exist yet; skipping constraint update.';
end
$$;

create index if not exists idx_interventions_deleted_at on public.interventions (deleted_at);

commit;
