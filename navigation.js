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

/* Edición directamente sobre el contenido público. */
(() => {
  'use strict';
  const page = location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'index';
  const main = document.querySelector('main');
  const headerActions = document.querySelector('.site-header .header-actions');
  const footer = document.querySelector('.site-footer .footer-right');
  if (!main || !headerActions || !footer) return;

  const values = new Map();
  const originals = new Map();
  const focusable = new Map();
  let db, user, authorizedId, editor, enabled = false, request = 0;
  const make = (tag, label) => {
    const element = document.createElement(tag);
    if (label) element.textContent = label;
    return element;
  };
  const adminLink = make('a', 'Administración');
  adminLink.id = 'adminFooterLink';
  adminLink.href = 'admin.html';
  adminLink.hidden = true;
  footer.append(adminLink);
  const toggle = make('button', 'Editar esta página');
  toggle.type = 'button';
  toggle.className = 'button button-outline small edit-page-button';
  toggle.hidden = true;
  toggle.setAttribute('aria-pressed', 'false');
  headerActions.append(toggle);
  const status = make('p');
  status.className = 'inline-edit-status';
  status.hidden = true;
  status.setAttribute('role', 'status');
  document.body.append(status);

  const targets = '[data-edit-key]';
  function field(node, key, type = 'text', current) {
    node.dataset.editKey = key;
    node.dataset.editType = type;
    if (current !== undefined) node.dataset.editValue = current;
    return node;
  }
  const candidates = main.querySelectorAll(
    'h1,h2,h3,h4,p,li,img,a,figcaption,.section-kicker,.tool-tab,[data-section-field]'
  );
  const counters = new Map();
  for (const element of candidates) {
    if (element.closest('dialog,form,[aria-live], [hidden]') ||
        element.matches('[role=status], #siteNotice') ||
        element.querySelector('img,h1,h2,h3,h4,p,li,a,button,input,select,textarea') ||
        (!element.matches('img') && !element.textContent.trim())) continue;
    const tag = element.localName;
    const ordinal = (counters.get(tag) || 0) + 1;
    counters.set(tag, ordinal);
    const key = element.dataset.sectionField ? 'section:' + element.dataset.sectionField
      : element.id && /^[a-z0-9_-]+$/i.test(element.id) ? 'id:' + element.id.toLowerCase()
      : 'static:' + tag + ':' + ordinal;
    field(element, key, tag === 'img' ? 'image' : 'text');
    originals.set(element, {text:[...element.childNodes].map(child => child.cloneNode(true)),
      source:element.getAttribute('src'), srcset:element.getAttribute('srcset'),
      credit:element.closest('.page-banner-art')?.querySelector('.page-image-credit')});
  }

  function paintStatic() {
    for (const [element, original] of originals) {
      const val = values.get(element.dataset.editKey);
      if (val === undefined && !element.hasAttribute('data-edited')) continue;
      if (element.dataset.editType === 'image') {
        if (val) { element.removeAttribute('srcset'); element.src = val; }
        else {
          if (original.source) element.src = original.source;
          if (original.srcset) element.setAttribute('srcset', original.srcset);
        }
        if (original.credit) original.credit.hidden = Boolean(val);
      } else if (val) element.textContent = val;
      else element.replaceChildren(...original.text.map(child => child.cloneNode(true)));
      element.toggleAttribute('data-edited', val !== undefined);
    }
  }
  function publish(key) {
    paintStatic();
    window.dispatchEvent(new CustomEvent('nocturna:edits', {detail:{key}}));
  }
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  window.NOCTURNA_EDITOR = { field, get: (key, fallback) => values.get(key) ?? fallback, ready };

  function announce(message) {
    status.textContent = message;
    status.hidden = !message;
  }
  function setFocusTargets() {
    if (!enabled) return;
    for (const element of main.querySelectorAll(targets)) {
      if (focusable.has(element)) continue;
      focusable.set(element, element.getAttribute('tabindex'));
      element.tabIndex = 0;
    }
    for (const element of focusable.keys()) if (!element.isConnected) focusable.delete(element);
  }
  const observer = new MutationObserver(setFocusTargets);
  function setEditing(active) {
    enabled = active;
    toggle.setAttribute('aria-pressed', String(active));
    toggle.textContent = active ? 'Salir de edición' : 'Editar esta página';
    document.documentElement.toggleAttribute('data-editing-page', active);
    if (active) {
      observer.observe(main,{childList:true,subtree:true});
      setFocusTargets();
      announce('Doble clic o F2 para editar. Cada cambio se guarda por separado.');
    } else {
      observer.disconnect();
      for (const [element, original] of focusable) {
        if (original === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', original);
      }
      focusable.clear();
      editor?.remove();
      editor = null;
      announce('');
    }
  }
  toggle.addEventListener('click', () => setEditing(!enabled));

  main.addEventListener('click', event => {
    if (enabled && event.target.closest(targets) && !event.target.closest('.inline-field-editor')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  for (const type of ['dblclick','keydown']) main.addEventListener(type, event => {
    const element = event.target.closest(targets);
    if (!enabled || !element || (type === 'keydown' && event.key !== 'F2')) return;
    event.preventDefault();
    event.stopPropagation();
    openField(element);
  }, true);

  async function upload(file, kind) {
    const formats = kind === 'image'
      ? {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}
      : {'audio/mpeg':'mp3','audio/wav':'wav','audio/x-wav':'wav','audio/ogg':'ogg','audio/webm':'webm'};
    const extension = formats[file.type];
    if (!extension || file.size > 15 * 1024 * 1024) {
      throw Error(kind === 'image' ? 'Usa JPG, PNG o WebP de hasta 15 MB.' : 'Usa MP3, WAV, OGG o WebM de hasta 15 MB.');
    }
    const path = user.id + '/' + crypto.randomUUID() + '.' + extension;
    const bucket = db.storage.from('contenido-editorial');
    const {error} = await bucket.upload(path,file,{contentType:file.type});
    if (error) throw error;
    return {path, bucket, url:bucket.getPublicUrl(path).data.publicUrl};
  }
  function openField(element) {
    if (editor?.dataset.busy === 'true') return;
    editor?.remove();
    const key = element.dataset.editKey, kind = element.dataset.editType;
    const media = kind === 'image' || kind === 'audio';
    const form = make('form');
    form.className = 'inline-field-editor';
    editor = form;
    const label = make('label', media ? (kind === 'image' ? 'Cambiar imagen' : 'Cambiar audio')
      : kind === 'number' ? 'Precio en MXN' : kind === 'link' ? 'Dirección del enlace' : 'Editar texto');
    const input = make(kind === 'text' ? 'textarea' : 'input');
    if (kind === 'text') { input.rows = 2; input.maxLength = 2000; }
    if (kind === 'number') { input.type = 'number'; input.min = '1'; input.max = '9999999'; input.step = '1'; }
    if (media) {
      input.type = 'file';
      input.accept = kind === 'image' ? 'image/jpeg,image/png,image/webp' : 'audio/mpeg,audio/wav,audio/ogg,audio/webm';
    } else {
      input.value = values.get(key) ?? element.dataset.editValue ?? element.textContent.trim();
      input.required = true;
    }
    label.append(input);
    const save = make('button','Guardar');
    const cancel = make('button','Cancelar');
    const restore = make('button','Restaurar original');
    save.type = 'submit';
    cancel.type = restore.type = 'button';
    restore.hidden = !values.has(key);
    const message = make('span');
    message.setAttribute('role','status');
    form.append(label,save,cancel,restore,message);
    const anchor = element.closest('button,a,picture') || element;
    anchor.after(form);
    input.focus();
    if (!media && kind !== 'number') input.select();

    function close() { form.remove(); if (editor === form) editor = null; }
    cancel.addEventListener('click', () => { close(); element.focus(); });
    form.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !save.disabled) { event.preventDefault(); cancel.click(); }
    });
    async function commit(revert) {
      let uploaded;
      form.dataset.busy = 'true';
      save.disabled = restore.disabled = cancel.disabled = true;
      try {
        let value = revert ? null : input.value.trim();
        if (!revert && media) {
          if (!input.files[0]) throw Error('Elige un archivo.');
          uploaded = await upload(input.files[0],kind);
          value = uploaded.url;
        }
        if (!revert && !value) throw Error('Escribe un valor.');
        if (!revert && kind === 'link') {
          const url = new URL(value, location.href);
          if (url.protocol !== 'https:' || url.username || url.password) throw Error('Usa una dirección HTTPS válida.');
          value = url.href;
        }
        const {error} = await db.rpc('admin_editar_elemento',{p_pagina:page,p_campo:key,p_valor:value});
        if (error) throw error;
        if (revert) values.delete(key);
        else values.set(key,value);
        close();
        publish(key);
        if (enabled) announce('Cambio publicado.');
      } catch (failure) {
        if (uploaded && failure.code) await uploaded.bucket.remove([uploaded.path]).catch(() => {});
        message.textContent = failure.message;
      } finally {
        delete form.dataset.busy;
        save.disabled = restore.disabled = cancel.disabled = false;
      }
    }
    form.addEventListener('submit',event => { event.preventDefault(); commit(false); });
    restore.addEventListener('click',() => commit(true));
  }

  async function checkRole() {
    const bridge = window.NOCTURNA_BRIDGE?.snapshot?.();
    const sequence = ++request;
    user = bridge?.user;
    if (!user?.email_confirmed_at || authorizedId && authorizedId !== user.id) {
      authorizedId = undefined;
      toggle.hidden = adminLink.hidden = true;
      setEditing(false);
    }
    if (!bridge?.db || !user?.email_confirmed_at || authorizedId === user.id) return;
    const {data,error} = await bridge.db.from('administradores').select('usuario_id').eq('usuario_id',user.id).maybeSingle();
    if (sequence !== request || error || !data) return;
    authorizedId = user.id;
    toggle.hidden = adminLink.hidden = false;
  }
  window.addEventListener('nocturna:connected', async () => {
    db = window.NOCTURNA_BRIDGE.snapshot().db;
    try {
      const {data,error} = await db.from('ediciones_pagina').select('campo,valor').eq('pagina',page).limit(1000);
      if (error) throw error;
      for (const row of data) values.set(row.campo,row.valor);
      publish();
    } catch (error) {
      console.warn('Ediciones de página:', error.message);
    } finally {
      resolveReady();
    }
    checkRole();
  }, {once:true});
  window.addEventListener('nocturna:user', checkRole);
  window.addEventListener('nocturna:copy-ready', event => {
    for (const [element, original] of originals) {
      const legacy = event.detail?.[element.dataset.sectionField];
      if (legacy) original.text = [document.createTextNode(legacy)];
    }
    paintStatic();
  });
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
