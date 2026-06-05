-- FEAT-010: transición desde refugio_reviews (iteración previa)

drop trigger if exists refugio_reviews_set_display_name on public.refugio_reviews;
drop function if exists public.trg_refugio_reviews_set_display_name() cascade;
drop table if exists public.refugio_reviews cascade;
drop view if exists public.v_refugio_review_summary;
drop function if exists public.user_can_review_refugio(uuid);
