-- ================================================================
-- GRAM-X PHASE 9: OPERATIONAL INTELLIGENCE, GOVERNANCE COMMAND CENTER,
-- SLA RISK PREDICTION & WORKLOAD INTELLIGENCE
-- ================================================================

-- 1. High-Performance Analytical Function for Official Command Center
create or replace function public.get_command_center_operational_kpis(
    p_village_id bigint default null
)
returns jsonb language plpgsql security definer as $$
declare
    v_total bigint;
    v_pending bigint;
    v_in_progress bigint;
    v_resolved bigint;
    v_overdue bigint;
    v_escalated bigint;
    v_critical bigint;
    v_approaching_sla bigint;
begin
    -- Authorized official check
    if not exists (
        select 1 from public.profiles
        where id = auth.uid()
          and role in ('admin', 'district', 'super_admin', 'worker')
    ) then
        raise exception 'Access Denied: Only authorized governance officials can access Command Center KPIs.';
    end if;

    select 
        count(*),
        count(*) filter (where status = 'SUBMITTED'),
        count(*) filter (where status in ('VERIFIED', 'ASSIGNED', 'IN_PROGRESS')),
        count(*) filter (where status in ('RESOLVED', 'CLOSED')),
        count(*) filter (where priority = 'critical')
    into v_total, v_pending, v_in_progress, v_resolved, v_critical
    from public.grievances
    where (p_village_id is null or village_id = p_village_id);

    -- SLA Overdue & Approaching Breaches
    select 
        count(*) filter (where is_breached = true),
        count(*) filter (where is_breached = false and target_resolution_at <= (now() + interval '4 hours'))
    into v_overdue, v_approaching_sla
    from public.grievance_sla s
    join public.grievances g on s.grievance_id = g.id
    where (p_village_id is null or g.village_id = p_village_id);

    -- Escalated grievances
    select count(*)
    into v_escalated
    from public.grievances
    where status = 'ESCALATED'
      and (p_village_id is null or village_id = p_village_id);

    return jsonb_build_object(
        'total', coalesce(v_total, 0),
        'pending', coalesce(v_pending, 0),
        'in_progress', coalesce(v_in_progress, 0),
        'resolved', coalesce(v_resolved, 0),
        'overdue', coalesce(v_overdue, 0),
        'escalated', coalesce(v_escalated, 0),
        'critical', coalesce(v_critical, 0),
        'approaching_sla', coalesce(v_approaching_sla, 0)
    );
end;
$$;


-- 2. SLA Risk & Urgent Triage Feed RPC
create or replace function public.get_sla_risk_prediction_feed(
    p_village_id bigint default null,
    p_limit int default 20
)
returns table (
    id bigint,
    tracking_id text,
    title text,
    category text,
    priority text,
    status text,
    village_id bigint,
    hours_remaining numeric,
    is_overdue boolean,
    risk_level text
) language plpgsql security definer as $$
begin
    return query
    select 
        g.id,
        g.tracking_id,
        g.title,
        g.category,
        g.priority,
        g.status,
        g.village_id,
        round(extract(epoch from (s.target_resolution_at - now())) / 3600.0, 1) as hours_remaining,
        s.is_breached as is_overdue,
        case
            when s.is_breached = true or s.target_resolution_at <= now() then 'CRITICAL_BREACHED'
            when s.target_resolution_at <= (now() + interval '4 hours') then 'HIGH_RISK'
            when s.target_resolution_at <= (now() + interval '12 hours') then 'MEDIUM_RISK'
            else 'LOW_RISK'
        end as risk_level
    from public.grievances g
    join public.grievance_sla s on g.id = s.grievance_id
    where g.status not in ('RESOLVED', 'CLOSED')
      and (p_village_id is null or g.village_id = p_village_id)
    order by s.target_resolution_at asc
    limit p_limit;
end;
$$;
