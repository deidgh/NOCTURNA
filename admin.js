/* NOCTURNA: el servidor comprueba los permisos mediante RLS y RPC. */
(async () => {
'use strict';
const $=x=>document.querySelector(x), records=$('#adminRecords'), status=$('#adminStatus');
const state={db:null,user:null,section:'works',offset:0,limit:15,items:[],count:0,query:''};
const columns={works:'obras',profiles:'perfiles',comments:'comentarios',reports:'reportes'};
const selects={works:'id,titulo,descripcion,categoria,nombre_autor,autor_id,visible,creado_en,texto_alternativo',profiles:'id,alias,bio,creado_en',comments:'id,obra_id,usuario_id,texto,creado_en',reports:'id,obra_id,usuario_id,motivo,creado_en'};
const fmt=v=>v?new Date(v).toLocaleString('es-MX'):'—';
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n}
function error(err){status.textContent=err?.message||String(err||'Error de conexión');}
async function boot(){try{
const cfg=window.NOCTURNA_CONFIG;if(!cfg?.supabaseUrl||!cfg?.supabaseAnonKey)throw Error('No está configurada la conexión con Supabase.');
if(!window.supabase){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';script.onload=resolve;script.onerror=reject;document.head.append(script)})}
state.db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const {data:{user},error:authError}=await state.db.auth.getUser();if(authError&&!/auth session missing/i.test(authError.message))throw authError;
state.user=user;if(!user||!user.email_confirmed_at){$('#adminGate').hidden=false;status.textContent='Inicia sesión con una cuenta verificada.';return}
const {data:role,error:roleErr}=await state.db.from('administradores').select('usuario_id').eq('usuario_id',user.id).maybeSingle();if(roleErr)throw roleErr;
if(!role){$('#adminGate').hidden=false;status.textContent='Tu cuenta no tiene permisos de administración.';return}
$('#adminConsole').hidden=false;status.textContent='Sesión administrativa verificada.';await Promise.all([loadStats(),loadRecords()]);
}catch(e){error(e);$('#adminGate').hidden=false}}
async function loadStats(){for(const [name,table] of Object.entries(columns)){const {count,error:e}=await state.db.from(table).select('*',{count:'exact',head:true});if(e){error(e);continue}$('#stat'+{works:'Works',profiles:'Profiles',comments:'Comments',reports:'Reports'}[name]).textContent=count??0}}
function empty(){records.replaceChildren()}
async function loadRecords(){empty();status.textContent='Consultando registros…';
try{let q=state.db.from(columns[state.section]).select(selects[state.section],{count:'exact'}).order('creado_en',{ascending:false}).range(state.offset,state.offset+state.limit-1);const {data,error:e,count}=await q;if(e)throw e;
state.items=data||[];state.count=count||0;const visible=state.items.filter(item=>Object.values(item).some(v=>String(v??'').toLowerCase().includes(state.query)));
if(!visible.length)records.append(el('p','','No hay registros en esta página con ese filtro.'));
visible.forEach(item=>{const article=el('article','admin-record'),copy=el('div');let title='',sub='',meta='';
switch(state.section){case'works':title=item.titulo;sub=`${item.nombre_autor} · ${item.categoria} · ${item.visible?'Visible':'Oculta'}`;meta=item.descripcion;break;case'profiles':title=item.alias;sub='Perfil de usuario';meta=item.bio||'Sin biografía';break;case'comments':title=item.texto;sub=`Obra ${item.obra_id}`;meta=`Usuario ${item.usuario_id}`;break;case'reports':title=`Reporte: ${item.motivo}`;sub=`Obra ${item.obra_id}`;meta=`Usuario ${item.usuario_id}`;break}
copy.append(el('h3','',title),el('p','',sub),el('p','',meta),el('small','',fmt(item.creado_en)));const actions=el('div','admin-record-actions');
const btn=(label,action,danger=false)=>{const b=el('button',danger?'danger':'',label);b.type='button';b.addEventListener('click',()=>action(item));actions.append(b)};
if(state.section==='works'){btn('Editar',edit);btn(item.visible?'Ocultar':'Mostrar',moderate);btn('Eliminar obra',remove,true)}
if(state.section==='profiles')btn('Editar perfil',edit);
if(state.section==='comments')btn('Eliminar comentario',remove,true);
if(state.section==='reports')btn('Marcar atendido',remove);
article.append(copy,actions);records.append(article)});
$('#adminPrev').disabled=state.offset===0;$('#adminNext').disabled=state.offset+state.limit>=state.count;$('#adminPageInfo').textContent=`Página ${Math.floor(state.offset/state.limit)+1} · ${state.count} registros`;status.textContent='Datos actualizados.';
}catch(e){error(e)}}
async function mutate(promise,success){try{const {error:e}=await promise;if(e)throw e;status.textContent=success;await Promise.all([loadStats(),loadRecords()])}catch(e){error(e)}}
async function moderate(item){if(!confirm(`${item.visible?'Ocultar':'Mostrar'} la obra «${item.titulo}»?`))return;await mutate(state.db.rpc('admin_moderar_obra',{p_id:item.id,p_visible:!item.visible}),'Visibilidad actualizada.')}
async function remove(item){const names={works:'la obra',comments:'el comentario',reports:'el reporte'};if(!confirm(`¿Eliminar ${names[state.section]}? Esta acción no se puede deshacer.`))return;await mutate(state.db.from(columns[state.section]).delete().eq('id',item.id),'Registro eliminado.')}
let editing=null;
function edit(item){editing=item;const fields=$('#adminEditFields');fields.replaceChildren();const descriptors=state.section==='profiles'?[['alias','Alias',32],['bio','Biografía',280]]:[['titulo','Título',80],['descripcion','Descripción',1000],['texto_alternativo','Texto alternativo',180]];
for(const [key,label,max] of descriptors){const lbl=el('label','',label);lbl.htmlFor='edit-'+key;const field=key==='bio'||key==='descripcion'?el('textarea'):el('input');field.id='edit-'+key;field.name=key;field.maxLength=max;field.value=item[key]||'';lbl.append(field);fields.append(lbl)}
$('#adminEditTitle').textContent=state.section==='profiles'?'Editar perfil':'Editar obra';$('#adminEditError').textContent='';$('#adminEditDialog').showModal()}
$('#adminEditForm').addEventListener('submit',async e=>{e.preventDefault();if(!editing)return;const payload={};for(const x of $('#adminEditFields').querySelectorAll('input,textarea'))payload[x.name]=x.value.trim();
try{const {error:e}=await state.db.from(columns[state.section]).update(payload).eq(state.section==='profiles'?'id':'id',editing.id);if(e)throw e;$('#adminEditDialog').close();editing=null;await Promise.all([loadStats(),loadRecords()])}catch(ex){$('#adminEditError').textContent=ex.message}});
$('#adminEditCancel').addEventListener('click',()=>$('#adminEditDialog').close());
$('#adminRefresh').addEventListener('click',()=>Promise.all([loadStats(),loadRecords()]));
$('#adminSearch').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();loadRecords()});
$('#adminPrev').addEventListener('click',()=>{state.offset=Math.max(0,state.offset-state.limit);loadRecords()});$('#adminNext').addEventListener('click',()=>{state.offset+=state.limit;loadRecords()});
for(const b of document.querySelectorAll('[data-panel]'))b.addEventListener('click',()=>{document.querySelector('.admin-tabs .is-active')?.classList.remove('is-active');b.classList.add('is-active');state.section=b.dataset.panel;state.offset=0;state.query='';$('#adminSearch').value='';loadRecords()});
$('#adminLogout').addEventListener('click',async()=>{if(state.db)await state.db.auth.signOut();location.href='index.html'});
await boot();
})();
