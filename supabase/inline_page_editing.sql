create table public.ediciones_pagina (
  pagina text not null check (pagina ~ '^[a-z0-9-]{1,80}$'),
  campo text not null check (campo ~ '^[a-z0-9:_-]{1,120}$'),
  valor text not null check (length(valor) between 1 and 2000),
  primary key (pagina, campo)
);
alter table public.ediciones_pagina enable row level security;
revoke all on public.ediciones_pagina from public, anon, authenticated;
grant select on public.ediciones_pagina to anon, authenticated;
create policy lectura_ediciones_pagina on public.ediciones_pagina
for select to anon, authenticated using (true);

create function public.admin_editar_elemento(p_pagina text, p_campo text, p_valor text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.exigir_admin_activo();
  if p_valor is null then
    delete from public.ediciones_pagina where pagina=p_pagina and campo=p_campo;
    return;
  end if;
  if p_campo like '%:precio' and p_valor !~ '^[1-9][0-9]{0,6}$' then
    raise exception 'Escribe un precio entero válido en MXN.';
  end if;
  insert into public.ediciones_pagina values (p_pagina, p_campo, p_valor)
  on conflict (pagina,campo) do update set valor=excluded.valor;
end;
$$;
revoke all on function public.admin_editar_elemento(text,text,text) from public, anon;
grant execute on function public.admin_editar_elemento(text,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('contenido-editorial','contenido-editorial',true,15728640,
        array['image/jpeg','image/png','image/webp','audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/webm']);
create policy editar_archivos_editoriales on storage.objects for insert to authenticated
with check (bucket_id='contenido-editorial'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and (select private.cuenta_habilitada()) and (select private.es_administrador()));
create policy leer_archivos_editoriales_propios on storage.objects for select to authenticated
using (bucket_id='contenido-editorial' and (storage.foldername(name))[1]=(select auth.uid())::text
 and (select private.cuenta_habilitada()) and (select private.es_administrador()));
create policy borrar_archivos_editoriales_propios on storage.objects for delete to authenticated
using (bucket_id='contenido-editorial' and (storage.foldername(name))[1]=(select auth.uid())::text
 and (select private.cuenta_habilitada()) and (select private.es_administrador()));
