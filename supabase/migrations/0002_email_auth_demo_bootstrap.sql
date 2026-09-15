create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set display_name = excluded.display_name, updated_at = now();
  insert into public.organization_members (organization_id, user_id, role)
  values ('00000000-0000-0000-0000-000000000001', new.id, 'member')
  on conflict (organization_id, user_id) do nothing;
  insert into public.project_members (project_id, user_id, role)
  values ('00000000-0000-0000-0000-000000000010', new.id, 'viewer')
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.work_items (id, project_id, document_id, type_id, status_id, document_number, title, description)
values
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000031', 'REQ-0012', '차량은 운전자에게 충돌 경고를 제공해야 한다', '시스템은 운전자에게 충돌 위험을 인지할 수 있는 경고를 제공해야 한다.'),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000030', 'REQ-0013', '경고는 위험 감지 후 2초 이내 표시되어야 한다', '충돌 위험 감지 시각부터 2초 이내에 경고를 표시해야 한다.'),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000032', 'REQ-0014', '경고 메시지는 계기판 중앙에 표시되어야 한다', '경고 메시지는 운전자가 쉽게 인지할 수 있도록 계기판 중앙에 표시해야 한다.')
on conflict (id) do nothing;
