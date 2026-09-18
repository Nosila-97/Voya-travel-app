-- One vote per trip member per packing item or look.
create table public.item_votes (
  trip_id uuid not null references public.trips(id) on delete cascade,
  target_type text not null check (target_type in ('packing','outfit')),
  target_id text not null,
  voter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, target_type, target_id, voter_id)
);

create index item_votes_voter_id_idx on public.item_votes (voter_id);

alter table public.item_votes enable row level security;

grant select, insert, delete on public.item_votes to authenticated;
revoke all on public.item_votes from anon;

create policy "Trip members can view item votes"
on public.item_votes for select
to authenticated
using ((select private.is_trip_member(trip_id)));

create policy "Trip members can cast own item votes"
on public.item_votes for insert
to authenticated
with check (
  voter_id = (select auth.uid())
  and (select private.is_trip_member(trip_id))
);

create policy "Trip members can remove own item votes"
on public.item_votes for delete
to authenticated
using (
  voter_id = (select auth.uid())
  and (select private.is_trip_member(trip_id))
);

alter table public.item_votes replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'item_votes'
  ) then
    alter publication supabase_realtime add table public.item_votes;
  end if;
end
$$;
