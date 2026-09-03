-- ================================================================
-- GRAM-X PHASE 4: NOTIFICATIONS, SLA MONITORING & SECURITY HARDENING
-- Schema, Automated SLA Triggers, & Row Level Security (RLS) Policies
-- ================================================================

-- 1. Central Notifications Table
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    recipient_id uuid references public.profiles(id) on delete cascade not null,
    grievance_id bigint references public.grievances(id) on delete cascade,
    type text not null check (type in (
        'GRIEVANCE_SUBMITTED',
        'GRIEVANCE_VERIFIED',
        'GRIEVANCE_ASSIGNED',
        'GRIEVANCE_STATUS_CHANGED',
        'GRIEVANCE_ESCALATED',
        'GRIEVANCE_RESOLVED',
        'GRIEVANCE_CLOSED',
        'GRIEVANCE_COMMENTED',
        'DEADLINE_APPROACHING',
        'DEADLINE_MISSED'
    )),
    title text not null,
    message text not null,
    read_at timestamptz,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    metadata jsonb default '{}'::jsonb
);

create index if not exists idx_notifications_recipient_id on public.notifications(recipient_id);
create index if not exists idx_notifications_read_at on public.notifications(read_at);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- 2. Notification Preferences Table
create table if not exists public.notification_preferences (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    email_enabled boolean default true,
    in_app_enabled boolean default true,
    status_updates boolean default true,
    assignments boolean default true,
    escalation_updates boolean default true,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Grievance Service Level Agreement (SLA) & Deadline Tracking
create table if not exists public.grievance_sla (
    grievance_id bigint primary key references public.grievances(id) on delete cascade,
    verification_due_at timestamptz not null,
    resolution_due_at timestamptz not null,
    is_escalated boolean default false,
    escalated_at timestamptz,
    escalation_level integer default 0,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_grievance_sla_verification on public.grievance_sla(verification_due_at);
create index if not exists idx_grievance_sla_resolution on public.grievance_sla(resolution_due_at);

-- 4. Function & Trigger: Calculate SLA Deadlines on Grievance Creation
create or replace function public.calculate_grievance_sla()
returns trigger
language plpgsql
as $$
declare
    v_hours integer;
    r_hours integer;
begin
    -- Configure SLA intervals based on priority
    if new.priority = 'critical' then
        v_hours := 12;
        r_hours := 24;
    elsif new.priority = 'high' then
        v_hours := 24;
        r_hours := 48;
    elsif new.priority = 'medium' then
        v_hours := 48;
        r_hours := 96;
    else
        v_hours := 72;
        r_hours := 168;
    end if;

    insert into public.grievance_sla (
        grievance_id,
        verification_due_at,
        resolution_due_at
    ) values (
        new.id,
        new.created_at + (v_hours || ' hours')::interval,
        new.created_at + (r_hours || ' hours')::interval
    ) on conflict (grievance_id) do nothing;

    return new;
end;
$$;

drop trigger if exists trigger_set_grievance_sla on public.grievances;
create trigger trigger_set_grievance_sla
    after insert on public.grievances
    for each row
    execute function public.calculate_grievance_sla();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.grievance_sla enable row level security;

-- ─── NOTIFICATIONS RLS ───────────────────────────────────────
create policy "Users can view own notifications"
    on public.notifications for select
    using (auth.uid() = recipient_id);

create policy "Users can update read status on own notifications"
    on public.notifications for update
    using (auth.uid() = recipient_id);

create policy "System and Authenticated users can insert notifications"
    on public.notifications for insert
    with check (auth.uid() is not null);

-- ─── NOTIFICATION PREFERENCES RLS ────────────────────────────
create policy "Users can view own preferences"
    on public.notification_preferences for select
    using (auth.uid() = user_id);

create policy "Users can update own preferences"
    on public.notification_preferences for all
    using (auth.uid() = user_id);

-- ─── SLA RLS ─────────────────────────────────────────────────
create policy "Users can view SLA for accessible grievances"
    on public.grievance_sla for select
    using (
        exists (
            select 1 from public.grievances g
            where g.id = grievance_id and (
                g.citizen_id = auth.uid()
                or g.assigned_worker_id = auth.uid()
                or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'district'))
            )
        )
    );

create policy "Admins can manage SLA records"
    on public.grievance_sla for all
    using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'district'))
    );
