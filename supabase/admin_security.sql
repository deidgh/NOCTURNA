-- NOCTURNA · Administración con autorización en PostgreSQL.
-- Cuenta inicial: propietario verificado de la organización; nunca se autoriza
-- a un usuario a partir de metadatos editables o de un parámetro del cliente.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.administradores (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now()
);
alter table public.administradores enable row level security;
revoke all on public.administradores from public, anon, authenticated;
grant select on public.administradores to authenticated;

drop policy if exists "Leer mi rol administrativo" on public.administradores;
create policy "Leer mi rol administrativo" on public.administradores
 for select to authenticated using (usuario_id = (select auth.uid()));

-- Primer administrador: asignación manual y privada desde SQL Editor; nunca
-- incluir email del propietario ni identificadores en este repositorio público.

create or replace function private.es_administrador()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.administradores a where a.usuario_id = (select auth.uid())
  );
$$;
revoke all on function private.es_administrador() from public, anon;
grant execute on function private.es_administrador() to authenticated;

-- El administrador puede consultar y moderar obras; los autores no pueden
-- hacer visibles sus publicaciones ocultas por el equipo de moderación.
alter table public.obras add column if not exists visible boolean not null default true;
drop policy if exists "Cualquiera puede leer obras" on public.obras;
create policy "Cualquiera puede leer obras" on public.obras
 for select to anon using (visible);
create policy "Ver obras como usuario" on public.obras
 for select to authenticated
 using (visible or autor_id=(select auth.uid()) or (select private.es_administrador()));
drop policy if exists "Usuarios eliminan solo sus obras" on public.obras;
create policy "Usuarios eliminan solo sus obras" on public.obras
 for delete to authenticated
 using (autor_id=(select auth.uid()) or (select private.es_administrador()));
drop policy if exists "Usuarios editan solo sus obras" on public.obras;
create policy "Usuarios editan solo sus obras" on public.obras
 for update to authenticated
 using (autor_id=(select auth.uid()) or (select private.es_administrador()))
 with check (autor_id=(select auth.uid()) or (select private.es_administrador()));
-- No otorgar UPDATE(visible) al usuario final.
revoke update (visible) on public.obras from authenticated;

-- Gestión de perfiles y reportes sin exponer los emails de auth.users.
drop policy if exists "Perfiles públicos" on public.perfiles;
create policy "Perfiles públicos" on public.perfiles for select to anon,authenticated using (true);
drop policy if exists "Editar perfil propio" on public.perfiles;
create policy "Editar perfil propio" on public.perfiles for update to authenticated
 using (id=(select auth.uid()) or (select private.es_administrador()))
 with check (id=(select auth.uid()) or (select private.es_administrador()));

drop policy if exists "Leer reportes administrador" on public.reportes;
create policy "Leer reportes administrador" on public.reportes for select to authenticated
 using ((select private.es_administrador()));
drop policy if exists "Gestionar reportes administrador" on public.reportes;
create policy "Gestionar reportes administrador" on public.reportes for delete to authenticated
 using ((select private.es_administrador()));
grant select,delete on public.reportes to authenticated;

drop policy if exists "Borrar comentario propio" on public.comentarios;
create policy "Borrar comentario propio" on public.comentarios for delete to authenticated
 using (usuario_id=(select auth.uid()) or (select private.es_administrador()));

-- La interfaz llama a RPC; la función autoriza en el servidor y no acepta
-- arbitrariedad sobre el autor de una obra.
create or replace function public.admin_moderar_obra(p_id uuid, p_visible boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not (select private.es_administrador()) then
    raise exception 'Acceso denegado' using errcode='42501';
  end if;
  update public.obras set visible = p_visible where id = p_id;
  return found;
end;
$$;
revoke execute on function public.admin_moderar_obra(uuid,boolean) from public, anon;
grant execute on function public.admin_moderar_obra(uuid,boolean) to authenticated;

-- Estadísticas por medio de consulta a tablas protegidas por RLS. El panel
-- administra perfiles, publicaciones, comentarios y reportes; no puede leer
-- contraseñas, tokens ni eliminar identidades de auth.users.
