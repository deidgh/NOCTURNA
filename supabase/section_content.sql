create table public.contenido_secciones (
  seccion text primary key check (seccion in ('tienda','musica','galeria','guitar-lab','juegos')),
  titulo text not null check (length(titulo) <= 100),
  introduccion text not null check (length(introduccion) <= 450),
  boton text not null check (length(boton) <= 70),
  titulo_bloque text not null check (length(titulo_bloque) <= 100),
  descripcion_bloque text not null check (length(descripcion_bloque) <= 450)
);
alter table public.contenido_secciones enable row level security;
revoke all on public.contenido_secciones from public, anon, authenticated;
grant select on public.contenido_secciones to anon, authenticated;
create policy leer_contenido_secciones on public.contenido_secciones
  for select to anon, authenticated using (true);

create function public.admin_guardar_seccion(
  p_seccion text, p_titulo text, p_introduccion text, p_boton text,
  p_titulo_bloque text, p_descripcion_bloque text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.exigir_admin_activo();
  insert into public.contenido_secciones
  values (p_seccion, trim(p_titulo), trim(p_introduccion), trim(p_boton),
          trim(p_titulo_bloque), trim(p_descripcion_bloque))
  on conflict (seccion) do update set titulo = excluded.titulo,
    introduccion = excluded.introduccion, boton = excluded.boton,
    titulo_bloque = excluded.titulo_bloque, descripcion_bloque = excluded.descripcion_bloque;
end;
$$;
revoke all on function public.admin_guardar_seccion(text,text,text,text,text,text) from public, anon;
grant execute on function public.admin_guardar_seccion(text,text,text,text,text,text) to authenticated;

create table public.precios_catalogo (
  producto text primary key check (producto ~ '^[a-z0-9-]{1,64}$'),
  precio integer not null check (precio between 1 and 9999999)
);
alter table public.precios_catalogo enable row level security;
revoke all on public.precios_catalogo from public, anon, authenticated;
grant select on public.precios_catalogo to anon, authenticated;
create policy leer_precios_catalogo on public.precios_catalogo
  for select to anon, authenticated using (true);

create function public.admin_guardar_precio(p_producto text, p_precio integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.exigir_admin_activo();
  if p_precio is null then
    delete from public.precios_catalogo where producto = p_producto;
  else
    insert into public.precios_catalogo values (p_producto, p_precio)
    on conflict (producto) do update set precio = excluded.precio;
  end if;
end;
$$;
revoke all on function public.admin_guardar_precio(text,integer) from public, anon;
grant execute on function public.admin_guardar_precio(text,integer) to authenticated;
