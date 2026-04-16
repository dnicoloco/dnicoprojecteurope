begin;
insert into public.lesson_metrics (lesson_id, student_id, tutor_id, happened_at, duration_min, student_word_count, talk_ratio_pct, wpm, clarity, filler_pct, vocab, latency_sec, quality_flags, algo_version) select 'a0000001-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', l.happened_at, 43.105, 2092, 39.12, 48.533, 0.942377, 11.807, 262, 3.61, ARRAY[]::text[], '1.0.0' from public.lessons l where l.id = 'a0000001-0000-0000-0000-000000000002';
commit;
