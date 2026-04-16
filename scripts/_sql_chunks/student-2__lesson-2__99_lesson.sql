begin;
insert into public.lesson_metrics (lesson_id, student_id, tutor_id, happened_at, duration_min, student_word_count, talk_ratio_pct, wpm, clarity, filler_pct, vocab, latency_sec, quality_flags, algo_version) select 'b0000002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', l.happened_at, 49.261, 4832, 65.713, 98.09, 0.931185, 5.567, 663, 2.375, ARRAY[]::text[], '1.0.0' from public.lessons l where l.id = 'b0000002-0000-0000-0000-000000000002';
commit;
