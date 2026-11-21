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
async function checkAdmin(){
 const b=window.NOCTURNA_BRIDGE?.snapshot?.();const nav=document.getElementById('mainNav');if(!nav||!b?.db)return;
 let link=nav.querySelector('#adminNavLink');if(!link){link=document.createElement('a');link.id='adminNavLink';link.href='admin.html';link.textContent='Administración';link.hidden=true;nav.append(link)}
 const token=++latest;link.hidden=true;
 if(!b.user?.email_confirmed_at)return;
 const {data,error}=await b.db.from('administradores').select('usuario_id').eq('usuario_id',b.user.id).maybeSingle();
 if(token===latest && !error && data)link.hidden=false;
}
window.addEventListener('nocturna:connected',checkAdmin);
window.addEventListener('nocturna:user',checkAdmin);
})();
