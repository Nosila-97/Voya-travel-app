-- Store packing photos outside the trip JSON so large Base64 payloads cannot
-- overflow browser storage or be erased by a metadata sync.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voya-packing-images',
  'voya-packing-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Trip members can view packing images" on storage.objects;
create policy "Trip members can view packing images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'voya-packing-images'
  and exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = ((storage.foldername(name))[1])::uuid
      and tm.user_id = (select auth.uid())
  )
);

drop policy if exists "Trip editors can upload packing images" on storage.objects;
create policy "Trip editors can upload packing images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'voya-packing-images'
  and exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = ((storage.foldername(name))[1])::uuid
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'editor')
  )
);

drop policy if exists "Trip editors can update packing images" on storage.objects;
create policy "Trip editors can update packing images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'voya-packing-images'
  and exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = ((storage.foldername(name))[1])::uuid
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'editor')
  )
)
with check (
  bucket_id = 'voya-packing-images'
  and exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = ((storage.foldername(name))[1])::uuid
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'editor')
  )
);

drop policy if exists "Trip editors can delete packing images" on storage.objects;
create policy "Trip editors can delete packing images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'voya-packing-images'
  and exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = ((storage.foldername(name))[1])::uuid
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'editor')
  )
);
