-- Create public bucket for organization logos
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to logos bucket
create policy "Authenticated users can upload logos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'logos');

-- Allow public read access to logos
create policy "Public can view logos"
on storage.objects for select
to public
using (bucket_id = 'logos');

-- Allow authenticated users to update/delete their uploads
create policy "Authenticated users can update logos"
on storage.objects for update
to authenticated
using (bucket_id = 'logos');

create policy "Authenticated users can delete logos"
on storage.objects for delete
to authenticated
using (bucket_id = 'logos');
