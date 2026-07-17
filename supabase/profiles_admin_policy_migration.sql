-- Admins/moderators can currently only ever update their OWN profile row
-- (the original policy is `using (auth.uid() = id)`), and there is no
-- DELETE policy on profiles at all. That means the Admin Panel's Verify,
-- Edit, and Delete actions on OTHER residents silently affect 0 rows —
-- the UI updates optimistically, but a refresh shows the real, unchanged
-- database state.

-- Allow admins, moderators, and superadmins to update any resident's profile
-- (verify/un-verify, edit name/unit/phase/project code, etc.)
drop policy if exists "Admins and moderators can update any profile" on public.profiles;
create policy "Admins and moderators can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator', 'superadmin')
    )
  );

-- Allow admins and superadmins to delete resident profiles
-- (moderators can verify/edit but not delete accounts)
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'superadmin')
    )
  );
