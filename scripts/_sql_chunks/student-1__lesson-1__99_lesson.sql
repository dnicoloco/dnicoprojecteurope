begin;
insert into public.lesson_metrics (lesson_id, student_id, tutor_id, happened_at, duration_min, student_word_count, talk_ratio_pct, wpm, clarity, filler_pct, vocab, latency_sec, quality_flags, algo_version) select 'a0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', l.happened_at, 44.888, 1856, 66.01, 41.348, 0.892811, 5.819, 434, 3.16, ARRAY['mic_issue']::text[], '1.0.0' from public.lessons l where l.id = 'a0000001-0000-0000-0000-000000000001';
commit;
