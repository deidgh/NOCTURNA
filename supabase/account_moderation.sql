create table private.estado_cuentas (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  estado text not null check (estado in ('aprobada', 'suspendida'))
);
revoke all on private.estado_cuentas from public, anon, authenticated;

-- Preserve access for verified accounts created before approval was introduced.
insert into private.estado_cuentas (usuario_id, estado)
select id, 'aprobada' from auth.users where email_confirmed_at is not null;

create function private.cuenta_habilitada()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    join private.estado_cuentas e on e.usuario_id = u.id
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
      and e.estado = 'aprobada' and coalesce(u.banned_until <= now(), true)
  );
$$;
revoke all on function private.cuenta_habilitada() from public, anon;
grant execute on function private.cuenta_habilitada() to authenticated;

create function public.mi_estado_cuenta()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((
    select case when u.email_confirmed_at is null then 'correo_pendiente'
                when u.banned_until > now() then 'suspendida'
                else coalesce(e.estado, 'pendiente') end
    from auth.users u left join private.estado_cuentas e on e.usuario_id = u.id
    where u.id = (select auth.uid())
  ), 'sin_cuenta');
$$;
revoke all on function public.mi_estado_cuenta() from public, anon;
grant execute on function public.mi_estado_cuenta() to authenticated;

create function private.exigir_admin_activo()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.es_administrador() or not private.cuenta_habilitada() then
    raise exception 'Acceso administrativo denegado' using errcode = '42501';
  end if;
end;
$$;
revoke all on function private.exigir_admin_activo() from public, anon, authenticated;

create function public.admin_listar_cuentas(p_offset integer default 0, p_busqueda text default '')
returns table(id uuid, alias text, bio text, creado_en timestamptz, estado text,
              administrador boolean, total bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.exigir_admin_activo();
  return query
    select u.id, coalesce(p.alias, '(sin alias)'), p.bio, u.created_at,
           case when u.banned_until > now() then 'suspendida'
                when u.email_confirmed_at is null then 'correo_pendiente'
                else coalesce(e.estado, 'pendiente') end,
           a.usuario_id is not null, count(*) over ()
    from auth.users u
    left join public.perfiles p on p.id = u.id
    left join private.estado_cuentas e on e.usuario_id = u.id
    left join public.administradores a on a.usuario_id = u.id
    where length(btrim(coalesce(p_busqueda, ''))) = 0
       or strpos(lower(coalesce(p.alias, '')), lower(left(p_busqueda, 120))) > 0
       or strpos(lower(coalesce(u.email, '')), lower(left(p_busqueda, 120))) > 0
    order by u.created_at desc, u.id
    limit 15 offset greatest(coalesce(p_offset, 0), 0);
end;
$$;
revoke all on function public.admin_listar_cuentas(integer,text) from public, anon;
grant execute on function public.admin_listar_cuentas(integer,text) to authenticated;

create function public.admin_gestionar_cuenta(p_id uuid, p_accion text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  confirmada timestamptz;
begin
  perform private.exigir_admin_activo();
  if p_id = (select auth.uid()) or exists (
    select 1 from public.administradores a where a.usuario_id = p_id
  ) then
    raise exception 'La cuenta de un administrador está protegida';
  end if;
  select u.email_confirmed_at into confirmada from auth.users u where u.id = p_id for update;
  if not found then raise exception 'La cuenta ya no existe'; end if;

  case p_accion
    when 'aprobar' then
      if confirmada is null then raise exception 'El usuario debe confirmar su correo primero'; end if;
      insert into private.estado_cuentas values (p_id, 'aprobada')
        on conflict (usuario_id) do update set estado = excluded.estado;
      update auth.users set banned_until = null where id = p_id;
    when 'suspender' then
      insert into private.estado_cuentas values (p_id, 'suspendida')
        on conflict (usuario_id) do update set estado = excluded.estado;
      update auth.users set banned_until = '9999-12-31 00:00:00+00'::timestamptz where id = p_id;
      delete from auth.sessions where user_id = p_id;
    when 'eliminar' then
      if exists (select 1 from storage.objects o where o.owner_id = p_id::text or o.owner = p_id) then
        raise exception 'La cuenta tiene archivos adjuntos. Retíralos desde Storage antes de eliminarla.';
      end if;
      delete from auth.users where id = p_id;
    else raise exception 'Acción desconocida';
  end case;
end;
$$;
revoke all on function public.admin_gestionar_cuenta(uuid,text) from public, anon;
grant execute on function public.admin_gestionar_cuenta(uuid,text) to authenticated;

do $$
declare
  tabla text;
begin
  foreach tabla in array array['obras','perfiles','comentarios','favoritos','me_gusta','reportes','seguimientos']
  loop
    execute format('create policy cuenta_activa_insert on public.%I as restrictive for insert to authenticated with check ((select private.cuenta_habilitada()))', tabla);
    execute format('create policy cuenta_activa_update on public.%I as restrictive for update to authenticated using ((select private.cuenta_habilitada())) with check ((select private.cuenta_habilitada()))', tabla);
    execute format('create policy cuenta_activa_delete on public.%I as restrictive for delete to authenticated using ((select private.cuenta_habilitada()))', tabla);
  end loop;
end;
$$;

create policy cuenta_activa_subidas on storage.objects as restrictive for insert to authenticated
with check (bucket_id not in ('obras-imagenes','obras-audio') or (select private.cuenta_habilitada()));
create policy cuenta_activa_borrado_archivos on storage.objects as restrictive for delete to authenticated
using (bucket_id not in ('obras-imagenes','obras-audio') or (select private.cuenta_habilitada()));

create or replace function public.admin_moderar_obra(p_id uuid,p_visible boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform private.exigir_admin_activo();
  update public.obras set visible = p_visible where id = p_id;
  return found;
end;
$$;

grant update(titulo,descripcion,texto_alternativo) on public.obras to authenticated;

create table public.aviso_sitio (
  id boolean primary key default true check (id),
  texto text not null default '' check (length(texto) <= 280)
);
alter table public.aviso_sitio enable row level security;
revoke all on public.aviso_sitio from public,anon,authenticated;
grant select on public.aviso_sitio to anon,authenticated;
create policy leer_aviso on public.aviso_sitio for select to anon,authenticated using (true);
insert into public.aviso_sitio default values;
create function public.admin_guardar_aviso(p_texto text)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform private.exigir_admin_activo();
  update public.aviso_sitio set texto=btrim(coalesce(p_texto,'')) where id;
end;
$$;
revoke all on function public.admin_guardar_aviso(text) from public,anon;
grant execute on function public.admin_guardar_aviso(text) to authenticated;
