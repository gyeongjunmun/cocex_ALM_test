create extension if not exists "pgcrypto";

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('organization_admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  key text not null,
  description text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('project_admin', 'editor', 'reviewer', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.work_item_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  key text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, key)
);

create table public.field_definitions (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references public.work_item_types(id) on delete cascade,
  name text not null,
  key text not null,
  field_type text not null check (field_type in ('text', 'long_text', 'number', 'select', 'date', 'boolean')),
  is_required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  unique (type_id, key)
);

create table public.workflow_states (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references public.work_item_types(id) on delete cascade,
  name text not null,
  key text not null,
  position integer not null default 0,
  is_terminal boolean not null default false,
  unique (type_id, key)
);

create table public.workflow_transitions (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references public.work_item_types(id) on delete cascade,
  from_state_id uuid not null references public.workflow_states(id) on delete cascade,
  to_state_id uuid not null references public.workflow_states(id) on delete cascade,
  unique (type_id, from_state_id, to_state_id),
  check (from_state_id <> to_state_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  key text not null,
  description text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete restrict,
  type_id uuid not null references public.work_item_types(id) on delete restrict,
  status_id uuid not null references public.workflow_states(id) on delete restrict,
  parent_id uuid references public.work_items(id) on delete set null,
  document_number text not null,
  title text not null,
  description text not null default '',
  custom_fields jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, document_number),
  check (id <> parent_id)
);

create table public.relation_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  key text not null,
  inverse_name text not null,
  is_hierarchy boolean not null default false,
  is_required boolean not null default false,
  unique (project_id, key)
);

create table public.work_item_relations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  relation_type_id uuid not null references public.relation_types(id) on delete restrict,
  source_item_id uuid not null references public.work_items(id) on delete restrict,
  target_item_id uuid not null references public.work_items(id) on delete restrict,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (source_item_id <> target_item_id),
  unique (relation_type_id, source_item_id, target_item_id)
);

create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  revision_number integer not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (work_item_id, revision_number)
);

create table public.revision_changes (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.revisions(id) on delete cascade,
  field_key text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table public.baselines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.baseline_items (
  baseline_id uuid not null references public.baselines(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  revision_id uuid not null references public.revisions(id) on delete restrict,
  primary key (baseline_id, work_item_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  revision_id uuid references public.revisions(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index work_items_project_parent_idx on public.work_items(project_id, parent_id) where deleted_at is null;
create index work_items_project_type_status_idx on public.work_items(project_id, type_id, status_id) where deleted_at is null;
create index relations_project_source_idx on public.work_item_relations(project_id, source_item_id) where deleted_at is null;
create index relations_project_target_idx on public.work_item_relations(project_id, target_item_id) where deleted_at is null;
create index revisions_item_created_idx on public.revisions(work_item_id, created_at desc);
create index audit_project_created_idx on public.audit_events(project_id, created_at desc);

create or replace function public.is_org_member(requested_org uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.organization_members where organization_id = requested_org and user_id = auth.uid());
$$;

create or replace function public.project_role(requested_project uuid)
returns text language sql security definer set search_path = public stable as $$
  select case when exists (
    select 1 from public.organization_members om join public.projects p on p.organization_id = om.organization_id
    where p.id = requested_project and om.user_id = auth.uid() and om.role = 'organization_admin'
  ) then 'organization_admin' else (
    select role from public.project_members where project_id = requested_project and user_id = auth.uid()
  ) end;
$$;

create or replace function public.can_read_project(requested_project uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.project_role(requested_project) is not null;
$$;

create or replace function public.can_edit_project(requested_project uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.project_role(requested_project) in ('organization_admin', 'project_admin', 'editor');
$$;

create or replace function public.can_review_project(requested_project uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.project_role(requested_project) in ('organization_admin', 'project_admin', 'editor', 'reviewer');
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.work_item_types enable row level security;
alter table public.field_definitions enable row level security;
alter table public.workflow_states enable row level security;
alter table public.workflow_transitions enable row level security;
alter table public.documents enable row level security;
alter table public.work_items enable row level security;
alter table public.relation_types enable row level security;
alter table public.work_item_relations enable row level security;
alter table public.revisions enable row level security;
alter table public.revision_changes enable row level security;
alter table public.baselines enable row level security;
alter table public.baseline_items enable row level security;
alter table public.comments enable row level security;
alter table public.audit_events enable row level security;

create policy organization_member_read on public.organizations for select using (public.is_org_member(id));
create policy own_profile_read on public.profiles for select using (id = auth.uid());
create policy organization_members_read on public.organization_members for select using (public.is_org_member(organization_id));
create policy projects_read on public.projects for select using (public.can_read_project(id));
create policy projects_insert on public.projects for insert with check (public.is_org_member(organization_id));
create policy projects_update on public.projects for update using (public.project_role(id) in ('organization_admin', 'project_admin')) with check (public.project_role(id) in ('organization_admin', 'project_admin'));
create policy project_members_read on public.project_members for select using (public.can_read_project(project_id));
create policy project_members_manage on public.project_members for all using (public.project_role(project_id) in ('organization_admin', 'project_admin')) with check (public.project_role(project_id) in ('organization_admin', 'project_admin'));

create policy project_config_read on public.work_item_types for select using (public.can_read_project(project_id));
create policy project_config_manage on public.work_item_types for all using (public.project_role(project_id) in ('organization_admin', 'project_admin')) with check (public.project_role(project_id) in ('organization_admin', 'project_admin'));
create policy field_config_read on public.field_definitions for select using (exists (select 1 from public.work_item_types t where t.id = type_id and public.can_read_project(t.project_id)));
create policy field_config_manage on public.field_definitions for all using (exists (select 1 from public.work_item_types t where t.id = type_id and public.project_role(t.project_id) in ('organization_admin', 'project_admin'))) with check (exists (select 1 from public.work_item_types t where t.id = type_id and public.project_role(t.project_id) in ('organization_admin', 'project_admin')));
create policy workflow_read on public.workflow_states for select using (exists (select 1 from public.work_item_types t where t.id = type_id and public.can_read_project(t.project_id)));
create policy workflow_manage on public.workflow_states for all using (exists (select 1 from public.work_item_types t where t.id = type_id and public.project_role(t.project_id) in ('organization_admin', 'project_admin'))) with check (exists (select 1 from public.work_item_types t where t.id = type_id and public.project_role(t.project_id) in ('organization_admin', 'project_admin')));
create policy transition_read on public.workflow_transitions for select using (exists (select 1 from public.work_item_types t where t.id = type_id and public.can_read_project(t.project_id)));
create policy transition_manage on public.workflow_transitions for all using (exists (select 1 from public.work_item_types t where t.id = type_id and public.project_role(t.project_id) in ('organization_admin', 'project_admin'))) with check (exists (select 1 from public.work_item_types t where t.id = type_id and public.project_role(t.project_id) in ('organization_admin', 'project_admin')));

create policy documents_read on public.documents for select using (public.can_read_project(project_id));
create policy documents_write on public.documents for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));
create policy items_read on public.work_items for select using (public.can_read_project(project_id));
create policy items_write on public.work_items for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));
create policy relation_types_read on public.relation_types for select using (public.can_read_project(project_id));
create policy relation_types_manage on public.relation_types for all using (public.project_role(project_id) in ('organization_admin', 'project_admin')) with check (public.project_role(project_id) in ('organization_admin', 'project_admin'));
create policy relations_read on public.work_item_relations for select using (public.can_read_project(project_id));
create policy relations_write on public.work_item_relations for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));
create policy revisions_read on public.revisions for select using (public.can_read_project(project_id));
create policy revision_changes_read on public.revision_changes for select using (exists (select 1 from public.revisions r where r.id = revision_id and public.can_read_project(r.project_id)));
create policy baselines_read on public.baselines for select using (public.can_read_project(project_id));
create policy baselines_write on public.baselines for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));
create policy baseline_items_read on public.baseline_items for select using (exists (select 1 from public.baselines b where b.id = baseline_id and public.can_read_project(b.project_id)));
create policy baseline_items_write on public.baseline_items for all using (exists (select 1 from public.baselines b where b.id = baseline_id and public.can_edit_project(b.project_id))) with check (exists (select 1 from public.baselines b where b.id = baseline_id and public.can_edit_project(b.project_id)));
create policy comments_read on public.comments for select using (public.can_read_project(project_id));
create policy comments_write on public.comments for all using (public.can_review_project(project_id)) with check (public.can_review_project(project_id));
create policy audit_read on public.audit_events for select using (public.can_read_project(project_id));
