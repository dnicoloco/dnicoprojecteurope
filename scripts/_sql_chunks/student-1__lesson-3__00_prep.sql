begin;
delete from public.lesson_segments where lesson_id = 'a0000001-0000-0000-0000-000000000003';
delete from public.segment_metrics where lesson_id = 'a0000001-0000-0000-0000-000000000003';
delete from public.lesson_metrics where lesson_id = 'a0000001-0000-0000-0000-000000000003';
commit;
