/* NOCTURNA navigation: sticky header, auto hide while scrolling down. */
(() => {
  'use strict';

  // Instalación PWA en Android, Windows y navegadores compatibles.
  if ('serviceWorker' in navigator && location.protocol==='https:') {
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn),{once:true});
  }
  let installationPrompt = null;
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();installationPrompt=event;
    const host=document.querySelector('.header-actions');
    if(host && !document.getElementById('installNocturnaBtn')){
      const button=document.createElement('button');button.id='installNocturnaBtn';button.className='button button-outline small';button.type='button';button.textContent='Instalar app';
      button.addEventListener('click',async()=>{if(!installationPrompt)return;installationPrompt.prompt();await installationPrompt.userChoice;installationPrompt=null;button.remove()});
      host.append(button);
    }
  });
  window.addEventListener('appinstalled',()=>document.getElementById('installNocturnaBtn')?.remove());
  const header=document.querySelector('.site-header');
  const toggle=document.getElementById('menuBtn');
  const nav=document.getElementById('mainNav');
  if(!header||!toggle||!nav)return;
  let lastY=window.scrollY,scheduled=false;
  const closeMenu=()=>{nav.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menú')};
  toggle.addEventListener('click',()=>{
    const open=!nav.classList.contains('nav-open');
    nav.classList.toggle('nav-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
    header.classList.remove('header-hidden');
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  document.addEventListener('focusin',e=>{if(header.contains(e.target))header.classList.remove('header-hidden')});
  document.addEventListener('pointerdown',e=>{if(!header.contains(e.target))closeMenu()});
  const update=()=>{
    const y=Math.max(0,window.scrollY),delta=y-lastY;
    if(y<95||nav.classList.contains('nav-open')||header.contains(document.activeElement))header.classList.remove('header-hidden');
    else if(delta>6)header.classList.add('header-hidden');
    else if(delta< -4)header.classList.remove('header-hidden');
    lastY=y;scheduled=false;
  };
  window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});
  window.addEventListener('pageshow',()=>{header.classList.remove('header-hidden');lastY=window.scrollY});
  window.addEventListener('resize',()=>{if(window.innerWidth>1350)closeMenu()},{passive:true});
})();

/* Enlace al panel solamente para cuentas con rol confirmado en la BD. */
(() => {
'use strict';
let latest=0;
const section = document.querySelector('[data-section]')?.dataset.section;
const fields = [...document.querySelectorAll('[data-section-field]')];
const defaults = new Map(fields.map(field => [field, [...field.childNodes].map(node => node.cloneNode(true))]));
let editButton;
let closeEditor;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function showEditor(db) {
  if (editButton) {
    editButton.hidden = false;
    return;
  }
  editButton = node('button', 'Editar esta página', 'button button-outline small edit-page-button');
  editButton.type = 'button';
  document.querySelector('.header-actions')?.append(editButton);

  editButton.addEventListener('click', async () => {
    editButton.disabled = true;
    try {
      const {data, error} = await db.from('contenido_secciones').select('*').eq('seccion', section).maybeSingle();
      if (error) throw error;
      if (editButton.hidden) { editButton.disabled = false; return; }
      const dialog = node('dialog', '', 'page-editor');
      dialog.setAttribute('aria-label', 'Editar contenido de esta página');
      const form = node('form');
      const status = node('p');
      status.setAttribute('role', 'status');
      const cancel = node('button', 'Cancelar', 'button button-outline small');
      const save = node('button', 'Guardar en el sitio', 'button button-primary small');
      const labels = {
        titulo: 'Título principal', introduccion: 'Introducción', boton: 'Botón principal',
        titulo_bloque: 'Título del bloque', descripcion_bloque: 'Descripción del bloque'
      };
      const originals = fields.map(field => [...field.childNodes].map(child => child.cloneNode(true)));
      const inputs = fields.map(field => {
        const key = field.dataset.sectionField;
        const long = key === 'introduccion' || key === 'descripcion_bloque';
        const input = node(long ? 'textarea' : 'input');
        const label = node('label', labels[key]);
        label.append(input);
        input.maxLength = long ? 450 : key === 'boton' ? 70 : 100;
        input.value = data?.[key] || '';
        input.placeholder = defaults.get(field).map(child => child.textContent).join('');
        input.addEventListener('input', () => {
          const value = input.value.trim();
          if (value) field.textContent = value;
          else field.replaceChildren(...defaults.get(field).map(child => child.cloneNode(true)));
        });
        return {key, label, input};
      });
      let saved = false;
      cancel.type = 'button';
      save.type = 'submit';
      cancel.addEventListener('click', () => dialog.close());
      dialog.addEventListener('keydown', event => { if (event.key === 'Escape' && !save.disabled) dialog.close(); });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const params = Object.fromEntries(inputs.map(({key,input}) => ['p_' + key, input.value.trim()]));
        save.disabled = true;
        cancel.disabled = true;
        try {
          const {error: saveError} = await db.rpc('admin_guardar_seccion', {p_seccion: section, ...params});
          if (saveError) throw saveError;
          saved = true;
          dialog.close();
        } catch (failure) {
          status.textContent = failure.message;
        } finally {
          save.disabled = false;
          cancel.disabled = false;
        }
      });
      closeEditor = () => dialog.close();
      dialog.addEventListener('close', () => {
        if (!saved) fields.forEach((field, i) => field.replaceChildren(...originals[i]));
        dialog.remove();
        closeEditor = null;
        delete document.documentElement.dataset.editingPage;
        editButton.disabled = false;
        if (!editButton.hidden) editButton.focus();
      });
      const actions = node('div', '', 'page-editor-actions');
      actions.append(cancel, save);
      form.append(node('h2', 'Editar esta página'), ...inputs.map(item => item.label), status, actions);
      dialog.append(form);
      document.body.append(dialog);
      document.documentElement.dataset.editingPage = 'true';
      dialog.show();
      inputs[0].input.focus({preventScroll:true});
    } catch (failure) {
      editButton.disabled = false;
      editButton.title = failure.message;
    }
  });
}

async function checkAdmin(){
 const b=window.NOCTURNA_BRIDGE?.snapshot?.();const footer=document.querySelector('.site-footer .footer-right');if(!footer||!b?.db)return;
 let link=footer.querySelector('#adminFooterLink');if(!link){link=document.createElement('a');link.id='adminFooterLink';link.href='admin.html';link.textContent='Administración';link.hidden=true;footer.append(link)}
 const token=++latest;link.hidden=true;
 if(editButton)editButton.hidden=true;
 if(!b.user)closeEditor?.();
 if(!b.user?.email_confirmed_at)return;
 const {data,error}=await b.db.from('administradores').select('usuario_id').eq('usuario_id',b.user.id).maybeSingle();
 if(token===latest && !error && data){link.hidden=false;if(section)showEditor(b.db);}
}
window.addEventListener('nocturna:connected',checkAdmin);
window.addEventListener('nocturna:user',checkAdmin);
})();

/* Preferencia compartida entre páginas y panel. */
(() => {
  'use strict';
  const host = document.querySelector('.header-actions, .admin-actions');
  if (!host) return;

  const themeButton = document.createElement('button');
  themeButton.type = 'button';
  themeButton.className = 'icon-button theme-toggle';
  host.prepend(themeButton);

  let light = false;
  try { light = localStorage.getItem('nocturna-theme') === 'light'; } catch {}
  function showTheme() {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    themeButton.textContent = light ? '☾' : '☀';
    themeButton.title = light ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';
    themeButton.setAttribute('aria-label', 'Modo claro');
    themeButton.setAttribute('aria-pressed', String(light));
  }
  themeButton.addEventListener('click', () => {
    light = !light;
    showTheme();
    try { localStorage.setItem('nocturna-theme', light ? 'light' : 'dark'); } catch {}
  });
  showTheme();
})();
