begin;
delete from public.lesson_segments where lesson_id = 'b0000002-0000-0000-0000-000000000002';
delete from public.segment_metrics where lesson_id = 'b0000002-0000-0000-0000-000000000002';
delete from public.lesson_metrics where lesson_id = 'b0000002-0000-0000-0000-000000000002';
commit;
