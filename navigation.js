/* NOCTURNA navigation: sticky header, auto hide while scrolling down. */
(() => {
  'use strict';
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
