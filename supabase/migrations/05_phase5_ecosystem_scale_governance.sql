-- ================================================================
-- GRAM-X PHASE 5: MULTI-LEVEL HIERARCHY, TRANSPARENCY, FEEDBACK,
-- REOPENING APPEALS, SERVICE DIRECTORY, AND AUDIT 2.0
-- ================================================================

-- 1. Organizational & Administrative Hierarchy
create table if not exists public.states (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    code text unique not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.districts (
    id uuid primary key default gen_random_uuid(),
    state_id uuid references public.states(id) on delete cascade not null,
    name text not null,
    code text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.blocks (
    id uuid primary key default gen_random_uuid(),
    district_id uuid references public.districts(id) on delete cascade not null,
    name text not null,
    code text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.panchayats (
    id uuid primary key default gen_random_uuid(),
    block_id uuid references public.blocks(id) on delete cascade not null,
    name text not null,
    code text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.villages (
    id serial primary key,
    panchayat_id uuid references public.panchayats(id) on delete cascade,
    name text not null,
    census_code text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Scoped User Roles & Capabilities
create table if not exists public.user_scopes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text not null check (role in (
        'citizen', 'worker', 'panchayat_admin', 'block_official',
        'district_collector', 'state_admin', 'super_admin'
    )),
    scope_level text not null check (scope_level in ('state', 'district', 'block', 'panchayat', 'village', 'global')),
    scope_id text not null,
    capabilities text[] default '{}',
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_user_scopes_user on public.user_scopes(user_id);

-- 3. Citizen Feedback & Post-Resolution Rating
create table if not exists public.grievance_feedback (
    id uuid primary key default gen_random_uuid(),
    grievance_id bigint references public.grievances(id) on delete cascade not null unique,
    citizen_id uuid references public.profiles(id) on delete set null not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    is_satisfied boolean not null default true,
    feedback_text text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_feedback_grievance on public.grievance_feedback(grievance_id);

-- 4. Citizen Appeal & Reopen Requests
create table if not exists public.grievance_reopen_requests (
    id uuid primary key default gen_random_uuid(),
    grievance_id bigint references public.grievances(id) on delete cascade not null,
    requested_by uuid references public.profiles(id) on delete set null not null,
    reason text not null,
    status text not null check (status in ('PENDING', 'ACCEPTED', 'REJECTED')) default 'PENDING',
    reviewed_by uuid references public.profiles(id) on delete set null,
    review_notes text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    reviewed_at timestamptz
);

create index if not exists idx_reopen_grievance on public.grievance_reopen_requests(grievance_id);

-- 5. Government Services Directory
create table if not exists public.government_services (
    id uuid primary key default gen_random_uuid(),
    category text not null,
    name text not null,
    department text not null,
    nodal_officer text not null default 'Panchayat Nodal Officer',
    helpline text not null default '1800-111-000',
    sla_days integer not null default 3,
    is_active boolean not null default true,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. Public Civic Notices & Emergency Announcements
create table if not exists public.public_notices (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    category text not null,
    location_scope text not null default 'Panchayat',
    is_emergency boolean not null default false,
    status text not null check (status in ('ACTIVE', 'RESOLVED', 'ARCHIVED')) default 'ACTIVE',
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. Configurable SLA Policies
create table if not exists public.sla_policies (
    id uuid primary key default gen_random_uuid(),
    category text not null,
    priority text not null,
    verification_hours integer not null,
    resolution_hours integer not null,
    escalation_tier text not null default 'Panchayat',
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. Immutable Audit Logs 2.0
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references public.profiles(id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id text not null,
    scope text not null default 'panchayat',
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- 9. Dynamic Feature Flags
create table if not exists public.feature_flags (
    flag_key text primary key,
    is_enabled boolean not null default true,
    description text,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Populate default feature flags
insert into public.feature_flags (flag_key, is_enabled, description) values
    ('AI_ENABLED', true, 'AI grievance classification and priority triage'),
    ('VOICE_ENABLED', true, 'Browser voice speech-to-text input'),
    ('PUBLIC_TRANSPARENCY_ENABLED', true, 'Public /transparency governance metrics'),
    ('EMERGENCY_MODE', false, 'Disaster response high-priority escalation mode')
on conflict (flag_key) do nothing;

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

alter table public.states enable row level security;
alter table public.districts enable row level security;
alter table public.blocks enable row level security;
alter table public.panchayats enable row level security;
alter table public.villages enable row level security;
alter table public.user_scopes enable row level security;
alter table public.grievance_feedback enable row level security;
alter table public.grievance_reopen_requests enable row level security;
alter table public.government_services enable row level security;
alter table public.public_notices enable row level security;
alter table public.sla_policies enable row level security;
alter table public.audit_logs enable row level security;
alter table public.feature_flags enable row level security;

-- Public reference tables (read-only for all, manageable by admins)
create policy "Public read on administrative hierarchy" on public.states for select using (true);
create policy "Public read on districts" on public.districts for select using (true);
create policy "Public read on blocks" on public.blocks for select using (true);
create policy "Public read on panchayats" on public.panchayats for select using (true);
create policy "Public read on villages" on public.villages for select using (true);
create policy "Public read on services directory" on public.government_services for select using (true);
create policy "Public read on active notices" on public.public_notices for select using (true);
create policy "Public read on feature flags" on public.feature_flags for select using (true);

-- Feedback RLS
create policy "Citizens can insert feedback on their resolved grievances"
    on public.grievance_feedback for insert
    with check (
        auth.uid() = citizen_id and
        exists (
            select 1 from public.grievances g
            where g.id = grievance_id and g.citizen_id = auth.uid() and g.status in ('RESOLVED', 'CLOSED')
        )
    );

create policy "Users and Officials can view feedback"
    on public.grievance_feedback for select
    using (true);

-- Reopen Request RLS
create policy "Citizens can request reopen on own closed grievances"
    on public.grievance_reopen_requests for insert
    with check (
        auth.uid() = requested_by and
        exists (
            select 1 from public.grievances g
            where g.id = grievance_id and g.citizen_id = auth.uid()
        )
    );

create policy "Users can view reopen requests"
    on public.grievance_reopen_requests for select
    using (
        requested_by = auth.uid() or
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'district'))
    );

create policy "Admins can review reopen requests"
    on public.grievance_reopen_requests for update
    using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'district'))
    );

-- Audit Logs RLS (Immutable append-only, readable by admins)
create policy "Admins can view audit logs"
    on public.audit_logs for select
    using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'district'))
    );

create policy "System can insert audit logs"
    on public.audit_logs for insert
    with check (auth.uid() is not null);
