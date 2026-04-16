begin;
insert into public.lesson_metrics (lesson_id, student_id, tutor_id, happened_at, duration_min, student_word_count, talk_ratio_pct, wpm, clarity, filler_pct, vocab, latency_sec, quality_flags, algo_version) select 'b0000002-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', l.happened_at, 53.097, 4771, 73.076, 89.855, 0.909968, 4.632, 778, 1.162, ARRAY[]::text[], '1.0.0' from public.lessons l where l.id = 'b0000002-0000-0000-0000-000000000001';
commit;
