begin;
insert into public.lesson_metrics (lesson_id, student_id, tutor_id, happened_at, duration_min, student_word_count, talk_ratio_pct, wpm, clarity, filler_pct, vocab, latency_sec, quality_flags, algo_version) select 'a0000001-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', l.happened_at, 47.498, 3929, 70.522, 82.719, 0.936964, 5.116, 639, 2.787, ARRAY['short_chunk']::text[], '1.0.0' from public.lessons l where l.id = 'a0000001-0000-0000-0000-000000000003';
commit;
