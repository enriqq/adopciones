-- FEAT-008: reintentar migración adoption_messages → messages omitiendo remitente = destinatario
-- Ejecutar solo si 021 falló en el INSERT por messages_sender_not_receiver
-- (p. ej. misma cuenta auth como refugio y adoptante en pruebas).

insert into public.messages (application_id, sender_id, receiver_id, content, created_at)
select
  m.application_id,
  m.sender_id,
  case
    when m.sender_role = 'applicant' then r.user_id
    else a.applicant_id
  end as receiver_id,
  m.body as content,
  m.created_at
from public.adoption_messages m
join public.adoption_applications a on a.id = m.application_id
join public.pets p on p.id = a.pet_id
join public.refugios r on r.id = p.refugio_id
where m.sender_id <> case
    when m.sender_role = 'applicant' then r.user_id
    else a.applicant_id
  end
  and not exists (
    select 1
    from public.messages existing
    where existing.application_id = m.application_id
      and existing.sender_id = m.sender_id
      and existing.created_at = m.created_at
  );
