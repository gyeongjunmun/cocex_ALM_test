insert into public.organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'ALM Demo Organization')
on conflict (id) do nothing;

insert into public.projects (id, organization_id, name, key, description)
values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'ADAS Platform 2026', 'ADAS26', 'Demo project for requirements traceability')
on conflict (id) do nothing;

insert into public.work_item_types (id, project_id, name, key, description)
values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'System Requirement', 'SYS_REQ', 'Vehicle and system-level requirements'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Software Requirement', 'SW_REQ', 'Software-level derived requirements')
on conflict (id) do nothing;

insert into public.field_definitions (type_id, name, key, field_type, is_required, position)
values
  ('00000000-0000-0000-0000-000000000020', 'Priority', 'priority', 'select', true, 1),
  ('00000000-0000-0000-0000-000000000020', 'Safety relevant', 'safety_relevant', 'boolean', false, 2),
  ('00000000-0000-0000-0000-000000000021', 'Component', 'component', 'text', false, 1)
on conflict (type_id, key) do nothing;

insert into public.workflow_states (id, type_id, name, key, position, is_terminal)
values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000020', 'Draft', 'draft', 1, false),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000020', 'In Review', 'in_review', 2, false),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000020', 'Approved', 'approved', 3, true),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000021', 'Draft', 'draft', 1, false),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000021', 'Approved', 'approved', 2, true)
on conflict (id) do nothing;

insert into public.workflow_transitions (type_id, from_state_id, to_state_id)
values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000031'),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000032'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000034')
on conflict do nothing;

insert into public.documents (id, project_id, name, key, description)
values ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000010', 'System Requirements', 'SYSTEM', 'Top-level system requirements')
on conflict (id) do nothing;

insert into public.relation_types (id, project_id, name, key, inverse_name, is_hierarchy, is_required)
values
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000010', 'Derives from', 'derives_from', 'Derived by', false, true),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000010', 'Satisfies', 'satisfies', 'Satisfied by', false, false),
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000010', 'Parent of', 'parent_of', 'Child of', true, false)
on conflict (id) do nothing;
