update public.project_members
set role = 'editor'
where project_id = '00000000-0000-0000-0000-000000000010';

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
  values ('00000000-0000-0000-0000-000000000010', new.id, 'editor')
  on conflict (project_id, user_id) do update set role = excluded.role;
  return new;
end;
$$;
