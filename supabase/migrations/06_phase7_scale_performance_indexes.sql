-- ================================================================
-- GRAM-X PHASE 7: SCALE, HIGH-THROUGHPUT INDEXES, IDEMPOTENCY,
-- RATE LIMITING, AND HIGH-CONCURRENCY RPC FUNCTIONS (100K SCALE)
-- ================================================================

-- 1. Composite & High-Throughput Indexes for 100,000+ Row Scale
create index if not exists idx_grievances_status_created 
    on public.grievances (status, created_at desc);

create index if not exists idx_grievances_village_status 
    on public.grievances (village_id, status);

create index if not exists idx_grievances_category_priority 
    on public.grievances (category, priority);

create index if not exists idx_grievances_assigned_status 
    on public.grievances (assigned_to, status);

create index if not exists idx_grievances_citizen_created 
    on public.grievances (citizen_id, created_at desc);

-- Full-Text Search GIN index for ultra-fast multi-keyword searching
create index if not exists idx_grievances_fts_gin 
    on public.grievances using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- SLA tracking performance index
create index if not exists idx_sla_breach_tracking 
    on public.grievance_sla (is_breached, target_resolution_at);

-- Notifications fast retrieval index
create index if not exists idx_notifications_user_unread_fast 
    on public.notifications (user_id, is_read, created_at desc);

-- Audit logs index for timeline streaming
create index if not exists idx_audit_logs_entity_created 
    on public.audit_logs (entity_type, entity_id, created_at desc);


-- 2. Idempotency Key Management (Prevents Duplicate Submissions in Offline Retries)
create table if not exists public.idempotency_keys (
    id uuid primary key default gen_random_uuid(),
    key text unique not null,
    user_id uuid references public.profiles(id) on delete cascade,
    resource_type text not null,
    resource_id text,
    status text not null default 'PROCESSING', -- 'PROCESSING', 'COMPLETED', 'FAILED'
    response_payload jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    expires_at timestamptz default (timezone('utc'::text, now()) + interval '24 hours') not null
);

create index if not exists idx_idempotency_key_lookup on public.idempotency_keys(key, user_id);
create index if not exists idx_idempotency_expiry on public.idempotency_keys(expires_at);

alter table public.idempotency_keys enable row level security;

create policy "Users can check and create their own idempotency keys"
    on public.idempotency_keys
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 3. Rate Limiting Buckets (Edge & API Protection)
create table if not exists public.rate_limit_buckets (
    id text primary key, -- formatted as 'identifier:action' e.g. 'ip:192.168.1.1:login' or 'user:uuid:create_grievance'
    tokens integer not null default 60,
    max_tokens integer not null default 60,
    refill_rate integer not null default 1, -- tokens per second
    last_refilled_at timestamptz default timezone('utc'::text, now()) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_rate_limit_refill on public.rate_limit_buckets(last_refilled_at);

alter table public.rate_limit_buckets enable row level security;

-- Rate limiter is strictly accessed by service_role / edge functions
create policy "Service role rate limit administration"
    on public.rate_limit_buckets
    for all
    using (auth.role() = 'service_role');


-- 4. High-Performance Paginated Query RPC (Avoids N+1 & full table scans)
create or replace function public.get_paginated_grievances(
    p_status text default null,
    p_category text default null,
    p_village_id bigint default null,
    p_search_query text default null,
    p_limit int default 20,
    p_offset int default 0
)
returns table (
    id bigint,
    tracking_id text,
    title text,
    category text,
    priority text,
    status text,
    village_id bigint,
    citizen_name text,
    created_at timestamptz,
    total_count bigint
) language plpgsql security definer as $$
begin
    return query
    with filtered as (
        select 
            g.id,
            g.tracking_id,
            g.title,
            g.category,
            g.priority,
            g.status,
            g.village_id,
            coalesce(p.name, 'Citizen') as citizen_name,
            g.created_at
        from public.grievances g
        left join public.profiles p on g.citizen_id = p.id
        where (p_status is null or g.status = p_status)
          and (p_category is null or g.category = p_category)
          and (p_village_id is null or g.village_id = p_village_id)
          and (
              p_search_query is null or 
              to_tsvector('english', coalesce(g.title, '') || ' ' || coalesce(g.description, '')) @@ plainto_tsquery('english', p_search_query) or
              g.tracking_id ilike '%' || p_search_query || '%'
          )
    ),
    counted as (
        select count(*) as cnt from filtered
    )
    select 
        f.id,
        f.tracking_id,
        f.title,
        f.category,
        f.priority,
        f.status,
        f.village_id,
        f.citizen_name,
        f.created_at,
        c.cnt as total_count
    from filtered f
    cross join counted c
    order by f.created_at desc
    limit p_limit offset p_offset;
end;
$$;


-- 5. Fast KPI & Aggregate Governance Summary (Eliminates unbounded scans)
create or replace function public.get_governance_kpi_summary(p_village_id bigint default null)
returns jsonb language plpgsql security definer as $$
declare
    v_total bigint;
    v_open bigint;
    v_resolved bigint;
    v_in_progress bigint;
    v_breached bigint;
begin
    select 
        count(*),
        count(*) filter (where status in ('SUBMITTED', 'VERIFIED', 'ASSIGNED')),
        count(*) filter (where status in ('RESOLVED', 'CLOSED')),
        count(*) filter (where status = 'IN_PROGRESS')
    into v_total, v_open, v_resolved, v_in_progress
    from public.grievances
    where (p_village_id is null or village_id = p_village_id);

    select count(*)
    into v_breached
    from public.grievance_sla s
    join public.grievances g on s.grievance_id = g.id
    where s.is_breached = true
      and (p_village_id is null or g.village_id = p_village_id);

    return jsonb_build_object(
        'total_grievances', coalesce(v_total, 0),
        'open_cases', coalesce(v_open, 0),
        'in_progress', coalesce(v_in_progress, 0),
        'resolved_cases', coalesce(v_resolved, 0),
        'sla_breaches', coalesce(v_breached, 0),
        'resolution_rate', case when coalesce(v_total, 0) > 0 then round((v_resolved::numeric / v_total::numeric) * 100, 1) else 100.0 end
    );
end;
$$;
