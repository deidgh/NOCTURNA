-- Exige correo confirmado en el servidor, incluso si el formulario se omite.
create or replace function private.usuario_verificado()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users where id = (select auth.uid()) and email_confirmed_at is not null);
$$;
revoke all on function private.usuario_verificado() from public, anon;
grant execute on function private.usuario_verificado() to authenticated;
drop policy if exists "Usuarios publican solo sus obras" on public.obras;
create policy "Usuarios publican solo sus obras" on public.obras for insert to authenticated
with check (autor_id=(select auth.uid()) and (select private.usuario_verificado()));
drop policy if exists "Crear comentario propio" on public.comentarios;
create policy "Crear comentario propio" on public.comentarios for insert to authenticated
with check (usuario_id=(select auth.uid()) and (select private.usuario_verificado()));
drop policy if exists "Subir imagen en carpeta propia" on storage.objects;
create policy "Subir imagen en carpeta propia" on storage.objects for insert to authenticated
with check (bucket_id='obras-imagenes' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.usuario_verificado()));
drop policy if exists "Subir audio en carpeta propia" on storage.objects;
create policy "Subir audio en carpeta propia" on storage.objects for insert to authenticated
with check (bucket_id='obras-audio' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.usuario_verificado()));
