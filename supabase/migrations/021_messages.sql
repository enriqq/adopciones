-- FEAT-008: mensajería por solicitud de adopción

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.adoption_applications (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  content text not null
    check (char_length(trim(content)) >= 2 and char_length(content) <= 2000),
  created_at timestamptz not null default now(),
  constraint messages_sender_not_receiver check (sender_id <> receiver_id)
);

create index if not exists messages_application_created_idx
  on public.messages (application_id, created_at);

create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists messages_receiver_idx on public.messages (receiver_id);

alter table public.messages enable row level security;

comment on table public.messages is
  'Chat refugio ↔ adoptante por solicitud (FEAT-008)';

-- Migrar histórico desde adoption_messages (FEAT-005)
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

alter table public.messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
