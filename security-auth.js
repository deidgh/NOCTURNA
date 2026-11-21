/* NOCTURNA: integra Turnstile con Supabase Auth; verificación real es servidor. */
(()=>{'use strict';
const cfg=window.NOCTURNA_CONFIG||{};const sitekey=(cfg.turnstileSiteKey||'').trim();
const required=Boolean(sitekey);const state={};
const $=x=>document.querySelector(x);
function render(){if(!required||!window.turnstile)return;
for(const formName of ['login','signup','reset']){
 const target=$('#captcha-'+formName);if(!target||state[formName]?.id!==undefined)continue;
 const id=window.turnstile.render(target,{sitekey,theme:'dark',appearance:formName==='reset'?'interaction-only':'always',callback:token=>{state[formName]={id,token}},'expired-callback':()=>{if(state[formName])state[formName].token=''},'error-callback':()=>{if(state[formName])state[formName].token=''}});
 state[formName]={id,token:''};
}}
function mount(){if(!required)return;
const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;script.onload=render;script.onerror=()=>console.error('Turnstile: no se pudo cargar el captcha');document.head.append(script);
}
window.NOCTURNA_CAPTCHA={getToken(mode){if(!required)return null;const token=state[mode]?.token;if(!token)throw Error('Completa la verificación CAPTCHA antes de continuar.');return token},reset(mode){if(required&&state[mode]){state[mode].token='';window.turnstile?.reset(state[mode].id)}},configured:required};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
