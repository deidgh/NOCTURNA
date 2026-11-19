-- =============================================================
-- NOCTURNA · Instalación de base de datos y almacenamiento
-- Ejecutar una vez en Supabase > SQL Editor > New query > Run.
-- Usa Auth de Supabase para cuentas y claves de acceso.
-- =============================================================

-- 1. Tabla de obras públicas.
create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users(id) on delete cascade,
  nombre_autor text not null check (char_length(btrim(nombre_autor)) between 2 and 32),
  titulo text not null check (char_length(btrim(titulo)) between 3 and 80),
  descripcion text not null check (char_length(btrim(descripcion)) between 10 and 1000),
  categoria text not null check (categoria in ('fotografia', 'guitarra', 'musica')),
  texto_alternativo text not null check (char_length(btrim(texto_alternativo)) between 10 and 180),
  imagen_path text not null,
  audio_path text,
  creado_en timestamptz not null default now(),
  constraint ruta_imagen_de_su_autor check (
    split_part(imagen_path, '/', 1) = autor_id::text
    and imagen_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
  ),
  constraint ruta_audio_de_su_autor check (
    audio_path is null or (
      split_part(audio_path, '/', 1) = autor_id::text
      and audio_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](mp3|wav|ogg|webm)$'
    )
  ),
  constraint fotografia_sin_audio check (categoria <> 'fotografia' or audio_path is null)
);

create index if not exists obras_fecha_idx on public.obras (creado_en desc);
create index if not exists obras_autor_idx on public.obras (autor_id);

-- 2. Permisos reales en base de datos (no solo botones escondidos).
alter table public.obras enable row level security;

drop policy if exists "Cualquiera puede leer obras" on public.obras;
create policy "Cualquiera puede leer obras"
  on public.obras for select to anon, authenticated
  using (true);

drop policy if exists "Usuarios publican solo sus obras" on public.obras;
create policy "Usuarios publican solo sus obras"
  on public.obras for insert to authenticated
  with check ((select auth.uid()) = autor_id);

drop policy if exists "Usuarios eliminan solo sus obras" on public.obras;
create policy "Usuarios eliminan solo sus obras"
  on public.obras for delete to authenticated
  using ((select auth.uid()) = autor_id);

-- Permisos de tabla: operaciones limitadas; el UPDATE de texto se concede más abajo.
revoke all on public.obras from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.obras to anon;
grant select, insert, delete on public.obras to authenticated;

-- La edición de textos es exclusiva del propietario, sin modificar autor o rutas de archivos.
drop policy if exists "Usuarios editan solo sus obras" on public.obras;
create policy "Usuarios editan solo sus obras" on public.obras for update to authenticated
  using ((select auth.uid())=autor_id) with check ((select auth.uid())=autor_id);
grant update (titulo,descripcion,texto_alternativo) on public.obras to authenticated;

-- 3. Depósitos públicos para las imágenes y el audio de obras publicadas.
-- Los límites son revisados también en el navegador, pero aquí se aplican en servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obras-imagenes', 'obras-imagenes', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obras-audio', 'obras-audio', true, 15728640,
        array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 4. Storage RLS: cada cuenta escribe y elimina archivos solo en su carpeta UID.
-- Las carpetas se crean automáticamente al subir (UID/archivo.ext).
drop policy if exists "Subir imagen en carpeta propia" on storage.objects;
create policy "Subir imagen en carpeta propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'obras-imagenes'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Consultar metadatos de imagen propia" on storage.objects;
create policy "Consultar metadatos de imagen propia" on storage.objects
  for select to authenticated
  using (bucket_id = 'obras-imagenes'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Eliminar imagen propia" on storage.objects;
create policy "Eliminar imagen propia" on storage.objects
  for delete to authenticated
  using (bucket_id = 'obras-imagenes'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Subir audio en carpeta propia" on storage.objects;
create policy "Subir audio en carpeta propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'obras-audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Consultar metadatos de audio propio" on storage.objects;
create policy "Consultar metadatos de audio propio" on storage.objects
  for select to authenticated
  using (bucket_id = 'obras-audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Eliminar audio propio" on storage.objects;
create policy "Eliminar audio propio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'obras-audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ATENCIÓN: los archivos de ambos depósitos son PÚBLICOS por diseño.
-- No publiques archivos privados, datos sensibles, ni material sin permiso.
-- Para contenido privado se necesita otra arquitectura de buckets y URLs firmadas.
-- Para una comunidad grande también se necesita moderación, reportes y anti-spam.

-- 5. Comunidad opcional: perfiles, likes, favoritos, comentarios, seguidores y reportes.
-- Se crea junto con la galería. Las operaciones se protegen con RLS.
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  alias text not null check (char_length(btrim(alias)) between 2 and 32),
  bio text not null default '' check (char_length(bio) <= 280),
  creado_en timestamptz not null default now()
);
alter table public.perfiles enable row level security;

drop policy if exists "Perfiles públicos" on public.perfiles;
create policy "Perfiles públicos" on public.perfiles for select to anon,authenticated using (true);
drop policy if exists "Editar perfil propio" on public.perfiles;
create policy "Editar perfil propio" on public.perfiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke all on public.perfiles from public,anon,authenticated;
grant select on public.perfiles to anon,authenticated;
grant update (alias,bio) on public.perfiles to authenticated;

create or replace function public.crear_perfil_nuevo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles(id,alias)
  values(new.id,
    case when char_length(btrim(coalesce(new.raw_user_meta_data->>'display_name',''))) between 2 and 32
      then btrim(new.raw_user_meta_data->>'display_name') else 'Artista' end)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists auth_nuevo_perfil on auth.users;
create trigger auth_nuevo_perfil after insert on auth.users
for each row execute function public.crear_perfil_nuevo();
-- Perfiles de cuentas anteriores a la creación del módulo.
insert into public.perfiles(id,alias)
select id,
  case when char_length(btrim(coalesce(raw_user_meta_data->>'display_name',''))) between 2 and 32
    then btrim(raw_user_meta_data->>'display_name') else 'Artista' end
from auth.users on conflict (id) do nothing;

create table if not exists public.me_gusta (
  obra_id uuid not null references public.obras(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (obra_id, usuario_id)
);
alter table public.me_gusta enable row level security;
drop policy if exists "Leer likes" on public.me_gusta;
create policy "Leer likes" on public.me_gusta for select to anon,authenticated using (true);
drop policy if exists "Dar likes propios" on public.me_gusta;
create policy "Dar likes propios" on public.me_gusta for insert to authenticated with check ((select auth.uid())=usuario_id);
drop policy if exists "Eliminar likes propios" on public.me_gusta;
create policy "Eliminar likes propios" on public.me_gusta for delete to authenticated using ((select auth.uid())=usuario_id);
revoke all on public.me_gusta from public,anon,authenticated;
grant select on public.me_gusta to anon;
grant select,insert,delete on public.me_gusta to authenticated;

create table if not exists public.favoritos (
  obra_id uuid not null references public.obras(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (obra_id,usuario_id)
);
alter table public.favoritos enable row level security;
drop policy if exists "Leer favoritos propios" on public.favoritos;
create policy "Leer favoritos propios" on public.favoritos for select to authenticated using ((select auth.uid())=usuario_id);
drop policy if exists "Guardar favoritos propios" on public.favoritos;
create policy "Guardar favoritos propios" on public.favoritos for insert to authenticated with check ((select auth.uid())=usuario_id);
drop policy if exists "Eliminar favoritos propios" on public.favoritos;
create policy "Eliminar favoritos propios" on public.favoritos for delete to authenticated using ((select auth.uid())=usuario_id);
revoke all on public.favoritos from public,anon,authenticated;
grant select,insert,delete on public.favoritos to authenticated;

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  texto text not null check (char_length(btrim(texto)) between 2 and 500),
  creado_en timestamptz not null default now()
);
create index if not exists comentarios_obra_fecha_idx on public.comentarios(obra_id,creado_en desc);
alter table public.comentarios enable row level security;
drop policy if exists "Leer comentarios" on public.comentarios;
create policy "Leer comentarios" on public.comentarios for select to anon,authenticated using (true);
drop policy if exists "Crear comentario propio" on public.comentarios;
create policy "Crear comentario propio" on public.comentarios for insert to authenticated with check ((select auth.uid())=usuario_id);
drop policy if exists "Borrar comentario propio" on public.comentarios;
create policy "Borrar comentario propio" on public.comentarios for delete to authenticated using ((select auth.uid())=usuario_id);
revoke all on public.comentarios from public,anon,authenticated;
grant select on public.comentarios to anon;
grant select,insert,delete on public.comentarios to authenticated;

create table if not exists public.seguimientos (
  seguidor_id uuid not null references auth.users(id) on delete cascade,
  seguido_id uuid not null references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (seguidor_id,seguido_id),
  constraint no_auto_seguimiento check (seguidor_id<>seguido_id)
);
alter table public.seguimientos enable row level security;
drop policy if exists "Leer seguimientos" on public.seguimientos;
create policy "Leer seguimientos" on public.seguimientos for select to anon,authenticated using (true);
drop policy if exists "Seguir usuarios" on public.seguimientos;
create policy "Seguir usuarios" on public.seguimientos for insert to authenticated with check ((select auth.uid())=seguidor_id);
drop policy if exists "Dejar de seguir usuarios" on public.seguimientos;
create policy "Dejar de seguir usuarios" on public.seguimientos for delete to authenticated using ((select auth.uid())=seguidor_id);
revoke all on public.seguimientos from public,anon,authenticated;
grant select on public.seguimientos to anon;
grant select,insert,delete on public.seguimientos to authenticated;

create table if not exists public.reportes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  motivo text not null check (motivo in ('spam','derechos','acoso','otro')),
  creado_en timestamptz not null default now(),
  unique(obra_id,usuario_id)
);
alter table public.reportes enable row level security;
drop policy if exists "Enviar reporte propio" on public.reportes;
create policy "Enviar reporte propio" on public.reportes for insert to authenticated
  with check ((select auth.uid()) = usuario_id);
-- Los reportes no se pueden leer desde el cliente, ni siquiera los del autor.
revoke all on public.reportes from public,anon,authenticated;
grant insert on public.reportes to authenticated;

-- Nota de producción: no incluye panel moderador ni sistema completo antiabuso.
-- No utilizar service_role en config.js. Para producción, añade rate limits
-- mediante funciones de servidor, captcha y revisión humana de reportes.

-- Impedir ejecución directa de la función del trigger mediante la API.
revoke execute on function public.crear_perfil_nuevo() from public, anon, authenticated;
