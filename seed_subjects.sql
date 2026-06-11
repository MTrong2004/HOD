-- SEED SUBJECTS FOR LEARNING HUB
insert into public.subjects (code, name, description, cover, sort_order, is_active)
values
  ('HOD102', 'HOD102 Learning', 'Bộ câu hỏi và tài liệu HOD102.', '', 1, true)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  cover = excluded.cover,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

notify pgrst, 'reload schema';
