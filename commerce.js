(() => {
 'use strict';
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const products=window.NOCTURNA_PRODUCTS||[];
 const key='nocturna-cart-v2'; const fmt=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
 const safeLoad=()=>{try{const x=JSON.parse(localStorage.getItem(key)||'{}');return Object.fromEntries(Object.entries(x).filter(([id,q])=>products.some(p=>p.id===id)&&Number.isInteger(q)&&q>0&&q<=99));}catch{return {}}};
 let cart=safeLoad(),filter='todos',search='';
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(cart))}catch{}};
 const el=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;};
 function card(p){const wrap=el('article','product-card new-product-card');const visual=el('div','product-visual');const image=el('img');image.src=p.image;image.alt=`Fotografía del producto ${p.name}`;image.loading='lazy';image.decoding='async';image.addEventListener('error',()=>{
   if(p.fallback){
    image.src=p.fallback;
    image.alt='Ilustración referencial de '+p.name+'; foto original disponible en la ficha del fabricante.';
    image.classList.add('product-fallback-img');
   }else{
    visual.classList.add('image-error');image.hidden=true;
    visual.append(el('p','product-image-placeholder',p.name+' · Ver imagen en el sitio de la marca o distribuidor.'));
   }
  },{once:true});visual.append(image);
 const body=el('div','product-copy');body.append(el('span','product-category',p.cat.toUpperCase()),el('h3','',p.name),el('p','product-desc',p.desc),el('strong','price-tag',fmt(p.price)));
 const actions=el('div','store-card-actions');const add=el('button','button button-primary','＋ Agregar');add.type='button';add.setAttribute('aria-label',`Añadir ${p.name} al carrito`);add.addEventListener('click',()=>{cart[p.id]=Math.min(99,(cart[p.id]||0)+1);save();drawCart();show(`${p.name} añadido a tu carrito.`);});const info=el('a','text-link-arrow','Conocer el modelo ↗');info.href=p.url;info.target='_blank';info.rel='noopener noreferrer';info.setAttribute('aria-label',`Ver detalles de ${p.name} en su fuente original`);actions.append(add,info);body.append(actions,el('small','product-credits',p.imageCredit));wrap.append(visual,body);return wrap;}
 function drawProducts(){const wrap=$('#catalogGrid');if(!wrap)return;wrap.replaceChildren();let visible=products.filter(p=>(filter==='todos'||p.cat===filter)&&(`${p.name} ${p.desc}`.toLowerCase().includes(search)));if(!visible.length)wrap.append(el('p','micro-note','No encontramos productos con esa búsqueda.'));visible.forEach(p=>wrap.append(card(p)));}
 function adjust(id,delta){const n=(cart[id]||0)+delta;if(n<=0)delete cart[id];else cart[id]=Math.min(99,n);save();drawCart();}
 function drawCart(){const wrap=$('#cartLines');if(!wrap)return;wrap.replaceChildren();let total=0,count=0;const selected=products.filter(p=>cart[p.id]);if(!selected.length)wrap.append(el('div','cart-empty','Tu carrito está vacío. Explora el catálogo y añade algo que te guste.'));
 selected.forEach(p=>{const q=cart[p.id];total+=q*p.price;count+=q;const line=el('article','cart-item');const img=el('img');img.src=p.image;img.alt='';img.loading='lazy';
 img.addEventListener('error',()=>{if(p.fallback)img.src=p.fallback;else img.hidden=true},{once:true});const info=el('div','cart-item-info');info.append(el('strong','',p.name),el('small','',fmt(p.price)+' por unidad'));const control=el('div','cart-qty');let minus=el('button','','−'),n=el('span','',String(q)),plus=el('button','','+'),remove=el('button','remove-item','Quitar');minus.type=plus.type=remove.type='button';minus.setAttribute('aria-label','Reducir cantidad de '+p.name);plus.setAttribute('aria-label','Aumentar cantidad de '+p.name);minus.addEventListener('click',()=>adjust(p.id,-1));plus.addEventListener('click',()=>adjust(p.id,1));remove.addEventListener('click',()=>{delete cart[p.id];save();drawCart();});control.append(minus,n,plus,remove);info.append(control);line.append(img,info,el('strong','line-price',fmt(q*p.price)));wrap.append(line);});
 $('#cartQty').textContent=String(count);$('#cartSubtotal').textContent=fmt(total);$('#cartGrand').textContent=fmt(total);}
 function show(t){const el=$('#toast');if(el){el.textContent=t;el.hidden=false;clearTimeout(show.timer);show.timer=setTimeout(()=>el.hidden=true,3000);}}
 $$('.store-filter').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('.store-filter').forEach(n=>n.classList.toggle('active',n===b));drawProducts()}));
 $('#storeSearch')?.addEventListener('input',e=>{search=e.target.value.trim().toLowerCase();drawProducts()});
 $('#cartClearNew')?.addEventListener('click',()=>{cart={};save();drawCart()});
 $('#cartExport')?.addEventListener('click',async()=>{const lines=products.filter(p=>cart[p.id]).map(p=>`${cart[p.id]} × ${p.name} — ${fmt(p.price*cart[p.id])}`);if(!lines.length){show('Primero añade productos.');return}const sum=products.reduce((s,p)=>s+(cart[p.id]||0)*p.price,0);try{await navigator.clipboard.writeText('NOCTURNA · Mi carrito\n'+lines.join('\n')+'\nTotal estimado: '+fmt(sum)+'\nPrecios de referencia, sin compra realizada.');show('Lista copiada.')}catch{show('No se pudo copiar. Prueba HTTPS o localhost.')}});
 drawProducts();drawCart();
 window.addEventListener('nocturna:connected', async () => {
   const { db } = window.NOCTURNA_BRIDGE.snapshot();
   const { data, error } = await db.from('precios_catalogo').select('producto,precio');
   if (error) return;
   const prices = new Map(data.map(row => [row.producto, row.precio]));
   for (const product of products) {
     if (prices.has(product.id)) product.price = prices.get(product.id);
   }
   drawProducts();
   drawCart();
 }, { once: true });
})();
