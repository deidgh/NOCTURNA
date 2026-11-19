/* NOCTURNA STUDIO — funcionalidades musicales, fotográficas y tienda demo.
   Sin APIs de pago, sin subida de micrófono o fotografías. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const NOTES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const audioTracks=[
    {
        "name": "Interludio violeta",
        "artist": "NOCTURNA Sessions",
        "style": "Ambient electrónico · producción original",
        "file": "assets/audio/interludio-violeta.wav",
        "source": "",
        "license": "Obra original",
        "length": "0:17"
    },
    {
        "name": "Cuerdas lentas",
        "artist": "NOCTURNA Sessions",
        "style": "Textura sintética · producción original",
        "file": "assets/audio/cuerdas-lentas.wav",
        "source": "",
        "license": "Obra original",
        "length": "0:17"
    },
    {
        "name": "Ciudad de cristal",
        "artist": "NOCTURNA Sessions",
        "style": "Electrónica nocturna · producción original",
        "file": "assets/audio/ciudad-de-cristal.wav",
        "source": "",
        "license": "Obra original",
        "length": "0:17"
    },
    {
        "name": "Retrato en grano",
        "artist": "NOCTURNA Sessions",
        "style": "Instrumental minimalista · producción original",
        "file": "assets/audio/retrato-en-grano.wav",
        "source": "",
        "license": "Obra original",
        "length": "0:17"
    },
    {
        "name": "Wikipedia guitar solo",
        "artist": "Leechfoot",
        "style": "Solo eléctrico en Fa♯ menor · CC0",
        "file": "https://upload.wikimedia.org/wikipedia/commons/b/b6/Wikipedia_guitar_solo.ogg",
        "source": "https://commons.wikimedia.org/wiki/File:Wikipedia_guitar_solo.ogg",
        "license": "CC0 1.0",
        "length": "0:42"
    },
    {
        "name": "Sonecito libre",
        "artist": "ProtoplasmaKid",
        "style": "Son jarocho experimental · CC BY-SA 4.0",
        "file": "https://upload.wikimedia.org/wikipedia/commons/1/19/Sonecito_libre_extendido.ogg",
        "source": "https://commons.wikimedia.org/wiki/File:Sonecito_libre_extendido.ogg",
        "license": "CC BY-SA 4.0",
        "length": "1:41"
    },
    {
        "name": "Jazz Guitar",
        "artist": "Serolillo",
        "style": "Guitarra jazz · CC BY 2.5",
        "file": "https://upload.wikimedia.org/wikipedia/commons/4/40/Jazz-Guitar.ogg",
        "source": "https://commons.wikimedia.org/wiki/File:Jazz-Guitar.ogg",
        "license": "CC BY 2.5",
        "length": "0:24"
    },
    {
        "name": "Bravoure for 12 String Guitar",
        "artist": "Vladan L. Kuzmanović",
        "style": "Guitarra de doce cuerdas · CC BY-SA 4.0",
        "file": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Vladan_Kuzmanovi%C4%87_-_Bravoure_For_12_String_Guitar.ogg",
        "source": "https://commons.wikimedia.org/wiki/File:Vladan_Kuzmanovi%C4%87_-_Bravoure_For_12_String_Guitar.ogg",
        "license": "CC BY-SA 4.0",
        "length": "7:28"
    }
];
  window.NOCTURNA_TRACKS = audioTracks.map((track, index) => ({...track, id: `track-${index+1}`}));
  let ac, currentTrack=0, tickTimer=null, nextTick=0, currentBeat=0, metroRunning=false;
  let micStream=null,tunerCtx=null,tunerSource=null,tunerAnalyser=null,tunerFrame=null;
  let gameTarget=null, noteSuccess=0,noteTries=0,fretSuccess=0,fretTries=0, fretTarget=null;
  let rhythmActive=false,rhythmStart=0,rhythmLastBeat=-1,rhythmHits=[],rhythmTimer=null;
  const shopItems=[
    {
        "id": "yamaha",
        "name": "Yamaha Pacifica PAC112V",
        "cat": "musica",
        "desc": "Guitarra eléctrica HSS con selector de cinco posiciones y vibrato vintage; versátil para limpios y distorsión.",
        "url": "https://mx.yamaha.com/es/musical-instruments/guitars-basses-amps/products/electric-guitars/pacifica/lineup.html",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Yamaha_Pac%C3%ADfica_112V.jpg/500px-Yamaha_Pac%C3%ADfica_112V.jpg",
        "badge": "GUITARRA · HSS"
    },
    {
        "id": "squier",
        "name": "Squier Classic Vibe 60s Stratocaster",
        "cat": "musica",
        "desc": "Tres pastillas single-coil con sonido clásico Strat; vibrato inspirado en los años sesenta.",
        "url": "https://es.fender.com/products/classic-vibe-60s-stratocaster",
        "image": "",
        "badge": "GUITARRA · SINGLE-COIL"
    },
    {
        "id": "boss",
        "name": "BOSS Katana-50 Gen 3",
        "cat": "musica",
        "desc": "Amplificador combo de 50 W con diferentes caracteres de amplificador y efectos integrados.",
        "url": "https://www.boss.info/mx/products/katana-50_gen_3/",
        "image": "",
        "badge": "AMPLIFICACIÓN"
    },
    {
        "id": "focusrite",
        "name": "Focusrite Scarlett Solo 4th Gen",
        "cat": "musica",
        "desc": "Interfaz USB para grabar voz e instrumento, con entrada Hi-Z para conectar guitarra.",
        "url": "https://focusrite.com/products/scarlett-solo",
        "image": "",
        "badge": "GRABACIÓN"
    },
    {
        "id": "shure",
        "name": "Shure SM57",
        "cat": "musica",
        "desc": "Micrófono dinámico cardioide usado habitualmente en amplificadores de guitarra y percusión.",
        "url": "https://www.shure.com/es-MX/productos/microfonos/sm57",
        "image": "",
        "badge": "MICROFONÍA"
    },
    {
        "id": "canon",
        "name": "Canon EOS R50",
        "cat": "foto",
        "desc": "Cámara sin espejo APS-C con montura RF, enfoque automático y herramientas para fotografía y video.",
        "url": "https://www.canon-europe.com/cameras/eos-r50/",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Canon_R50_without_lens.jpg/650px-Canon_R50_without_lens.jpg",
        "badge": "CÁMARA · APS-C"
    },
    {
        "id": "sony",
        "name": "Sony Alpha a6400",
        "cat": "foto",
        "desc": "Cámara sin espejo APS-C con montura E; opción para retrato, calle y video.",
        "url": "https://electronics.sony.com/t/cameras-and-lenses",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/2022-02-17_Sony_alpha_6400_IMG20220217210008.jpg/650px-2022-02-17_Sony_alpha_6400_IMG20220217210008.jpg",
        "badge": "CÁMARA · APS-C"
    },
    {
        "id": "sigma",
        "name": "Sigma 30mm F1.4 DC DN Contemporary",
        "cat": "foto",
        "desc": "Objetivo luminoso para sensores APS-C; confirmar la montura antes de elegirlo.",
        "url": "https://www.sigma-global.com/en/lenses/c016_30_14/",
        "image": "",
        "badge": "ÓPTICA · F1.4"
    },
    {
        "id": "rode",
        "name": "RØDE VideoMic GO II",
        "cat": "foto",
        "desc": "Micrófono direccional compacto para cámara, computadora o móvil compatible.",
        "url": "https://rode.com/es-mx/products/videomic-go-ii",
        "image": "",
        "badge": "AUDIO PARA VIDEO"
    },
    {
        "id": "justinguitar",
        "name": "JustinGuitar · Beginner Course",
        "cat": "curso",
        "desc": "Lecciones gratuitas organizadas por niveles para aprender guitarra con práctica progresiva.",
        "url": "https://www.justinguitar.com/classes/beginner-guitar-course-grade-one",
        "image": "",
        "badge": "APRENDER GUITARRA"
    },
    {
        "id": "fender-lessons",
        "name": "Fender · Guitar articles",
        "cat": "curso",
        "desc": "Material editorial sobre acordes, equipo, técnicas y construcción del sonido.",
        "url": "https://www.fender.com/articles",
        "image": "",
        "badge": "RECURSOS MUSICALES"
    },
    {
        "id": "adobe",
        "name": "Adobe · Photography tutorials",
        "cat": "curso",
        "desc": "Recursos de fotografía sobre exposición, composición, edición y luz.",
        "url": "https://www.adobe.com/creativecloud/photography/discover.html",
        "image": "",
        "badge": "APRENDER FOTOGRAFÍA"
    },
    {
        "id": "canon-guides",
        "name": "Canon · Pro tips",
        "cat": "curso",
        "desc": "Guías de cámara, objetivos, retrato, paisaje y otras técnicas fotográficas.",
        "url": "https://www.canon-europe.com/pro/stories/",
        "image": "",
        "badge": "GUÍAS DE IMAGEN"
    }
];
  let cart={};let shopFilter='todo';
  function msg(el,text){if(el)el.textContent=text;}
  function notify(text){const area=$('#srAnnouncements');if(area)area.textContent=text; const t=$('#toast');if(t){t.textContent=text;t.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.hidden=true,4300);}}
  function audioContext(){if(!ac){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw new Error('Tu navegador no admite Web Audio API.');ac=new Ctx();}if(ac.state==='suspended')ac.resume();return ac;}
  function beep(freq,start,duration=.10,volume=.12,type='sine'){
    const ctx=audioContext(),o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,start);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(Math.max(.001,volume),start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g).connect(ctx.destination);o.start(start);o.stop(start+duration+.015);
  }
  function midiFreq(m){return 440*Math.pow(2,(m-69)/12)}
  function nameFromMidi(m){return NOTES[((m%12)+12)%12]+(Math.floor(m/12)-1)}
  function openMenu(){const btn=$('#menuBtn'),nav=$('#mainNav');if(!btn||!nav)return;btn.addEventListener('click',()=>{const open=btn.getAttribute('aria-expanded')!=='true';btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');nav.classList.toggle('nav-open',open)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Abrir menú');nav.classList.remove('nav-open')}));}
  function initPlayer(){
    const audio=$('#demoAudio');audio.volume=.7;
    const format=s=>`${Math.floor((s||0)/60)}:${String(Math.floor((s||0)%60)).padStart(2,'0')}`;
    audioTracks.forEach((t,i)=>{
      const row=document.createElement('button');row.className='track-row';row.type='button';
      const n=document.createElement('span');n.className='track-number';n.textContent=String(i+1).padStart(2,'0');
      const label=document.createElement('span');const name=document.createElement('strong');name.textContent=t.name;const artist=document.createElement('small');artist.textContent=t.artist+' · '+t.style;label.append(name,artist);
      const duration=document.createElement('span');duration.className='track-duration';duration.textContent=t.length;
      const play=document.createElement('span');play.setAttribute('aria-hidden','true');play.textContent='▶';row.append(n,label,duration,play);
      row.addEventListener('click',()=>{selectSong(i);audio.play().catch(()=>notify('No se pudo iniciar el audio. Revisa tu conexión.'))});$('#trackList').append(row);
    });
    function refresh(){
      const t=audioTracks[currentTrack];msg($('#currentTrack'),t.name);msg($('#currentArtist'),t.artist+' · '+t.license);msg($('#trackTime'),format(audio.currentTime));
      const source=$('#trackSource');if(source){source.hidden=!t.source;source.href=t.source||'creditos.html';source.textContent=`Ver autor y licencia: ${t.artist} · ${t.license} ↗`;}
      $('#songPlay').textContent=audio.paused?'▶':'Ⅱ';$('#songPlay').setAttribute('aria-label',audio.paused?'Reproducir pista':'Pausar pista');
      $$('.track-row').forEach((r,i)=>{r.classList.toggle('is-current',i===currentTrack);r.setAttribute('aria-current',String(i===currentTrack))});
    }
    function selectSong(n){currentTrack=n;audio.src=audioTracks[n].file;audio.load();$('#trackSeek').value='0';refresh();}
    $('#songPlay').addEventListener('click',()=>{if(audio.paused)audio.play().catch(()=>notify('No se pudo reproducir la pista. Revisa tu conexión a internet.'));else audio.pause()});
    audio.addEventListener('play',refresh);audio.addEventListener('pause',refresh);
    audio.addEventListener('error',()=>notify('No se pudo cargar esta grabación. Puedes abrir la fuente desde su enlace.'));
    audio.addEventListener('ended',()=>{selectSong((currentTrack+1)%audioTracks.length);audio.play().catch(()=>{});});
    audio.addEventListener('timeupdate',()=>{if(audio.duration)$('#trackSeek').value=Math.round(100*audio.currentTime/audio.duration);msg($('#trackTime'),format(audio.currentTime));});
    $('#trackSeek').addEventListener('input',e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=audio.duration*(+e.target.value/100)});
    $('#trackVolume').addEventListener('input',e=>audio.volume=+e.target.value);
    selectSong(0);
  }
  function initTabs(){const tabs=$$('.tool-tab');tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(tab.dataset.tool));tab.addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();const next=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();activate(tabs[next].dataset.tool)})});function activate(id){tabs.forEach(t=>{const active=t.dataset.tool===id;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;$('#panel-'+t.dataset.tool).hidden=!active});if(id!=='tuner')stopTuner();if(id!=='metro'&&metroRunning)stopMetro();}}
  // Afinador: YIN con señal PCM leída del micrófono local.
  function yin(data,sr){let rms=0;for(let i=0;i<data.length;i++)rms+=data[i]*data[i];rms=Math.sqrt(rms/data.length);if(rms<.012)return null;const maxTau=Math.min(Math.floor(sr/72),Math.floor(data.length/2)),minTau=Math.floor(sr/1200);const diff=new Float32Array(maxTau+1);const length=Math.min(1600,data.length-maxTau);
    for(let tau=2;tau<=maxTau;tau++){let sum=0;for(let i=0;i<length;i++){const z=data[i]-data[i+tau];sum+=z*z;}diff[tau]=sum;}
    let run=0,bestTau=-1;
    for(let tau=2;tau<=maxTau;tau++){run+=diff[tau];diff[tau]=run?diff[tau]*tau/run:1;}
    for(let tau=minTau;tau<maxTau;tau++){
      if(diff[tau]<.16){while(tau+1<maxTau&&diff[tau+1]<diff[tau])tau++;bestTau=tau;break;}
    }
    if(bestTau<0)return null;const l=diff[bestTau-1]||diff[bestTau],c=diff[bestTau],r=diff[bestTau+1]||diff[bestTau];const adjust=(l-2*c+r)?(l-r)/(2*(l-2*c+r)):0;const hz=sr/(bestTau+clamp(adjust,-1,1));return hz>=70&&hz<1200?hz:null;}
  function readTuner(){if(!tunerAnalyser||!tunerCtx)return;const data=new Float32Array(tunerAnalyser.fftSize);tunerAnalyser.getFloatTimeDomainData(data);const freq=yin(data,tunerCtx.sampleRate);if(freq){const mid=69+12*Math.log2(freq/440),nearest=Math.round(mid),cents=Math.round((mid-nearest)*100),name=nameFromMidi(nearest);msg($('#tunerNote'),name);msg($('#tunerFreq'),freq.toFixed(1)+' Hz');msg($('#tunerCents'),(cents>0?'+':'')+cents+' cents');$('#tunerNeedle').style.left=`${clamp(50+cents*.8,10,90)}%`;msg($('#tunerStatus'),Math.abs(cents)<=6?'✓ Afinación correcta':cents<0?'La cuerda está un poco grave.':'La cuerda está un poco aguda.');}else{msg($('#tunerNote'),'—');msg($('#tunerFreq'),'Toca una cuerda…');msg($('#tunerStatus'),'No se detecta una nota estable. Evita el ruido de fondo.');}tunerFrame=setTimeout(readTuner,140)}
  async function startTuner(){if(!navigator.mediaDevices?.getUserMedia){notify('El afinador requiere HTTPS o localhost y acceso al micrófono.');return;}try{micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});tunerCtx=new (window.AudioContext||window.webkitAudioContext)();tunerSource=tunerCtx.createMediaStreamSource(micStream);tunerAnalyser=tunerCtx.createAnalyser();tunerAnalyser.fftSize=4096;tunerSource.connect(tunerAnalyser);$('#tunerToggle').textContent='Detener micrófono';$('#tunerToggle').setAttribute('aria-pressed','true');msg($('#tunerStatus'),'Escuchando en este dispositivo…');readTuner()}catch(e){stopTuner();msg($('#tunerStatus'),e.name==='NotAllowedError'?'Permiso de micrófono denegado.':'No se pudo abrir el micrófono.')}}
  function stopTuner(){clearTimeout(tunerFrame);if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null;}if(tunerSource){tunerSource.disconnect();tunerSource=null;}if(tunerCtx){tunerCtx.close().catch(()=>{});tunerCtx=null;}tunerAnalyser=null;$('#tunerToggle').textContent='Activar micrófono';$('#tunerToggle').setAttribute('aria-pressed','false');msg($('#tunerStatus'),'Micrófono desactivado.');}
  function initTuner(){$('#tunerToggle').addEventListener('click',()=>micStream?stopTuner():startTuner());document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTuner()});window.addEventListener('pagehide',stopTuner);}
  // Metrónomo Web Audio: programar cada click con el reloj del AudioContext.
  let metroBpm=95,metroTimeSig=4,metroVolume=.5,tapHistory=[];
  function metroBeatUI(beat){$$('.beat-light').forEach((el,i)=>el.classList.toggle('is-on',i===beat))}
  function metroSchedule(){if(!metroRunning)return;const ctx=audioContext();while(nextTick<ctx.currentTime+.12){const accent=currentBeat===0;beep(accent?1000:670,nextTick,.048,metroVolume*(accent?.27:.16),'sine');const beat=currentBeat,offset=Math.max(0,(nextTick-ctx.currentTime)*1000);setTimeout(()=>{if(metroRunning)metroBeatUI(beat)},offset);nextTick+=60/metroBpm;currentBeat=(currentBeat+1)%metroTimeSig;}}
  function startMetro(){try{audioContext();}catch(e){notify(e.message);return}metroRunning=true;nextTick=ac.currentTime+.055;currentBeat=0;metroSchedule();tickTimer=setInterval(metroSchedule,25);$('#metroStart').textContent='■ Detener metrónomo'}
  function stopMetro(){metroRunning=false;clearInterval(tickTimer);tickTimer=null;$$('.beat-light').forEach(el=>el.classList.remove('is-on'));$('#metroStart').textContent='▶ Iniciar metrónomo'}
  function setMetroBpm(n){metroBpm=clamp(Math.round(n),40,240);$('#metroSlider').value=String(metroBpm);msg($('#metroValue'),String(metroBpm));}
  function buildBeatLights(){const el=$('#beatLights');el.replaceChildren();for(let i=0;i<metroTimeSig;i++){const span=document.createElement('span');span.className='beat-light';span.setAttribute('aria-hidden','true');el.append(span)}}
  function collectTaps(arr,time){arr.push(time);while(arr.length>9)arr.shift();if(arr.length>1&&arr.at(-1)-arr.at(-2)>2400){arr.length=0;arr.push(time);}if(arr.length<4)return null;const intervals=arr.slice(1).map((v,i)=>v-arr[i]).filter(n=>n>=210&&n<=1900).sort((a,b)=>a-b);if(intervals.length<3)return null;const middle=intervals[Math.floor(intervals.length/2)];return Math.round(60000/middle)}
  function initMetro(){$('#metroStart').addEventListener('click',()=>metroRunning?stopMetro():startMetro());$('#metroSlider').addEventListener('input',e=>setMetroBpm(+e.target.value));$('#metroDown').addEventListener('click',()=>setMetroBpm(metroBpm-1));$('#metroUp').addEventListener('click',()=>setMetroBpm(metroBpm+1));$('#metroVolume').addEventListener('input',e=>metroVolume=+e.target.value/100);$('#metroBeats').addEventListener('change',e=>{metroTimeSig=+e.target.value;currentBeat=0;buildBeatLights()});$('#metroTap').addEventListener('click',()=>{const n=collectTaps(tapHistory,performance.now());if(n)setMetroBpm(n)});buildBeatLights();document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMetro()});}
  // Detección BPM manual y aproximación automática por novedad de energía.
  let bpmTaps=[];
  function tapBpm(){const n=collectTaps(bpmTaps,performance.now());if(n&&n>=40&&n<=300){msg($('#bpmResult'),String(n));msg($('#bpmStatus'),`Estimación manual: ${n} BPM. Sigue pulsando para mejorarla.`)}else msg($('#bpmStatus'),'Sigue pulsando de forma constante (mínimo 4 golpes).')}
  async function detectFileBpm(){const f=$('#bpmFile').files?.[0];if(!f){notify('Selecciona un archivo de audio primero.');return;}if(f.size>20*1024*1024){notify('El archivo supera 20 MB.');return;}const btn=$('#analyzeBpm');btn.disabled=true;msg($('#bpmStatus'),'Analizando audio localmente…');try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const buffer=await ctx.decodeAudioData(await f.arrayBuffer());const raw=buffer.getChannelData(0),sr=buffer.sampleRate,step=1024,maxSamples=Math.min(raw.length,sr*90),n=Math.floor(maxSamples/step),nov=new Float32Array(n);if(n<100)throw Error('El audio es demasiado corto.');let previous=0;for(let i=0;i<n;i++){let e=0;for(let j=0;j<step;j++){const s=raw[i*step+j];e+=s*s;}e=Math.sqrt(e/step);nov[i]=Math.max(0,e-previous);previous=e;}
      // Centrar y obtener autocorrelación de transientes entre 50 y 200 BPM.
      let mean=0;for(const v of nov)mean+=v;mean/=nov.length;
      let best=-Infinity,bestTempo=0;for(let tempo=55;tempo<=200;tempo+=.5){const lag=Math.round(60*sr/(tempo*step));if(lag<2||lag>=nov.length/2)continue;let score=0,norm=0;for(let i=lag;i<nov.length;i++){const a=Math.max(0,nov[i]-mean),b=Math.max(0,nov[i-lag]-mean);score+=a*b;norm+=a*a;}score/=Math.max(1,norm);if(score>best){best=score;bestTempo=tempo;}}
      await ctx.close();if(best<=.005)throw Error('No se encontró un pulso claro en esta grabación.');const tempo=Math.round(bestTempo);msg($('#bpmResult'),String(tempo));msg($('#bpmStatus'),`BPM estimados: ${tempo}. El doble o la mitad también podrían corresponder al pulso real.`);
    }catch(e){msg($('#bpmStatus'),'No se pudo analizar: '+e.message)}finally{btn.disabled=false}}
  function initBpm(){$('#bpmTap').addEventListener('click',tapBpm);$('#bpmClear').addEventListener('click',()=>{bpmTaps=[];msg($('#bpmResult'),'—');msg($('#bpmStatus'),'Reiniciado. Vuelve a pulsar al ritmo.')});$('#analyzeBpm').addEventListener('click',detectFileBpm);}
  // Diccionario musical con digitaciones móviles reales (raíz en sexta o quinta cuerda).
  const SHAPES={
    six:{major:[0,2,2,1,0,0],minor:[0,2,2,0,0,0],7:[0,2,0,1,0,0],maj7:[0,2,1,1,0,0],m7:[0,2,0,0,0,0],sus4:[0,2,2,2,0,0],5:[0,2,2,-1,-1,-1]},
    five:{major:[-1,0,2,2,2,0],minor:[-1,0,2,2,1,0],7:[-1,0,2,0,2,0],maj7:[-1,0,2,1,2,0],m7:[-1,0,2,0,1,0],sus4:[-1,0,2,2,3,0],5:[-1,0,2,2,-1,-1]}}
  const FORMULAS={major:'1 · 3 · 5',minor:'1 · ♭3 · 5',7:'1 · 3 · 5 · ♭7',maj7:'1 · 3 · 5 · 7',m7:'1 · ♭3 · 5 · ♭7',sus4:'1 · 4 · 5',5:'1 · 5'};
  const TUNING=[40,45,50,55,59,64];
  function chordFrets(){const root=NOTES.indexOf($('#chordRoot').value),type=$('#chordType').value;
    let sixth=(root-4+12)%12,fifth=(root-9+12)%12,base=0,which='six';
    if(fifth<sixth && fifth<=5){base=fifth;which='five'}else {base=sixth;which='six'}
    return {root,type,base,which,frets:SHAPES[which][type].map(n=>n<0?n:n+base)}}
  function renderChords(){const {root,type,base,frets}=chordFrets();const nm=NOTES[root]+({major:'',minor:'m',7:'7',maj7:'maj7',m7:'m7',sus4:'sus4',5:'5'}[type]);msg($('#chordName'),nm);msg($('#chordFormula'),FORMULAS[type]);const board=$('#chordDiagram');board.replaceChildren();const baseShown=base||1;
    for(let string=5;string>=0;string--){const row=document.createElement('div');row.className='fret-string';const label=document.createElement('span');label.className='fret-label';label.textContent=['E','A','D','G','B','e'][string];row.append(label);for(let i=0;i<5;i++){const fret=i===0?0:baseShown+i-1;const el=document.createElement('span');el.className='fret-cell';if(frets[string]===fret){el.classList.add('marked');if(fret===0)el.classList.add('open-mark')}if(i===0)el.textContent='0';else if(string===5)el.setAttribute('title',`Traste ${fret}`);row.append(el)}board.append(row)}
    const names=frets.map((f,i)=>f<0?'X':String(f));$('#chordDiagram').setAttribute('aria-label',`Acorde ${nm}, cuerdas de sexta a primera: ${names.join(', ')}`);msg($('#chordPositions'),`Cuerdas 6→1: ${names.join(' · ')} · X = no tocar · 0 = al aire. Desliza la cejilla al traste indicado.`)}
  function playChord(){const {frets}=chordFrets(),ctx=audioContext();frets.forEach((f,i)=>{if(f>=0)beep(midiFreq(TUNING[i]+f),ctx.currentTime+.04+i*.085,1.25,.07,'triangle')})}
  function initChords(){$('#chordRoot').addEventListener('change',renderChords);$('#chordType').addEventListener('change',renderChords);$('#chordPlay').addEventListener('click',playChord);renderChords()}
  // Círculo de quintas, mayor y relativa menor.
  const FIFTHS=['C','G','D','A','E','B','F#','C#','G#','D#','A#','F'];
  const circleAcc=[0,1,2,3,4,5,6,7,8,9,10,-1];
  const circleLabels=['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];
  const diatonicQual=['','m','m','','','m','°'];
  let circleIndex=0;
  function pickKey(i){circleIndex=i;$$('.circle-key').forEach((b,n)=>{b.classList.toggle('selected',i===n);b.setAttribute('aria-pressed',String(i===n))});const root=NOTES.indexOf(FIFTHS[i]),relative=NOTES[(root+9)%12]+'m',a=(i<=6?i:i===11?-1:-(12-i)),alter=a===0?'sin alteraciones':`${Math.abs(a)} ${a>0?'sostenidos':'bemoles'}`;msg($('#circleInfo'),`${circleLabels[i]} mayor · relativa menor: ${relative} · ${alter}.`);msg($('.circle-center'),circleLabels[i]);const wrap=$('#diatonicChords');wrap.replaceChildren();[0,2,4,5,7,9,11].forEach((d,j)=>{const el=document.createElement('span');el.className='diatonic-pill';el.textContent=NOTES[(root+d)%12]+diatonicQual[j];const sm=document.createElement('small');sm.textContent=['I','ii','iii','IV','V','vi','vii°'][j];el.append(sm);wrap.append(el)})}
  function initCircle(){const circle=$('#circleHolder');circleLabels.forEach((name,i)=>{const angle=i*Math.PI/6-Math.PI/2;const b=document.createElement('button');b.className='circle-key';b.type='button';b.textContent=name;b.style.left=`${50+38*Math.cos(angle)}%`;b.style.top=`${50+38*Math.sin(angle)}%`;b.setAttribute('aria-label',`Elegir tonalidad de ${name} mayor`);b.addEventListener('click',()=>pickKey(i));circle.append(b)});const center=document.createElement('span');center.className='circle-center';center.textContent='C';circle.append(center);pickKey(0)}
  // Juegos: oído, ritmo y localización de notas.
  function answerButton(text,onClick){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>onClick(b));return b}
  function shuffle(array){for(let i=array.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]]}return array}
  function renderGameChoices(container,correct,onComplete){container.replaceChildren();const picks=shuffle([correct,...shuffle(NOTES.filter(n=>n!==correct)).slice(0,3)]);picks.forEach(note=>container.append(answerButton(note,(b)=>{const ok=note===correct;b.classList.add(ok?'correct':'wrong');container.querySelectorAll('button').forEach(el=>el.disabled=true);onComplete(ok,correct)})))}
  function newEarGame(){const root=Math.floor(Math.random()*12);gameTarget={root,midi:60+root};renderGameChoices($('#noteAnswers'),NOTES[root],(ok,correct)=>{noteTries++;if(ok)noteSuccess++;msg($('#noteGameStatus'),ok?'✓ ¡Correcto!':`No exactamente. Era ${correct}.`);msg($('#noteScore'),`Aciertos: ${noteSuccess} / ${noteTries}`)});playEarNote();msg($('#noteGameStatus'),'Escucha la nota y elige una respuesta.')}
  function playEarNote(){if(!gameTarget){newEarGame();return}const ctx=audioContext();beep(midiFreq(gameTarget.midi),ctx.currentTime+.025,.8,.12,'sine')}
  function nextFret(){const string=Math.floor(Math.random()*6),fret=Math.floor(Math.random()*11);const midi=TUNING[string]+fret;fretTarget=NOTES[midi%12];msg($('#fretQuestion'),`Cuerda ${['6.ª (Mi)','5.ª (La)','4.ª (Re)','3.ª (Sol)','2.ª (Si)','1.ª (Mi)'][string]} · traste ${fret}`);renderGameChoices($('#fretAnswers'),fretTarget,(ok,note)=>{fretTries++;if(ok)fretSuccess++;msg($('#fretStatus'),ok?'✓ Bien tocado.':`Era ${note}. Prueba otra posición.`);msg($('#fretScore'),`Aciertos: ${fretSuccess} / ${fretTries}`)});msg($('#fretStatus'),'¿Qué nota se encuentra ahí?')}
  function hitRhythm(){if(!rhythmActive)return;const t=audioContext().currentTime-rhythmStart;const idx=Math.round(t/.6);if(idx<0||idx>=12||idx===rhythmLastBeat)return;rhythmLastBeat=idx;const delta=Math.abs(t-idx*.6);rhythmHits.push(delta);msg($('#rhythmStatus'),delta<.085?'¡Perfecto!':delta<.17?'Bien, casi al pulso.':'Intenta acercarte al clic.');msg($('#rhythmScore'),`${rhythmHits.length} golpes · error medio ${Math.round(rhythmHits.reduce((a,b)=>a+b,0)/rhythmHits.length*1000)} ms`)}
  function stopRhythm(){clearInterval(rhythmTimer);rhythmTimer=null;rhythmActive=false;$('#rhythmHit').disabled=true;$('#rhythmStart').textContent='Intentar otra vez';if(rhythmHits.length){const avg=rhythmHits.reduce((a,b)=>a+b,0)/rhythmHits.length;msg($('#rhythmStatus'),`Desafío completado: ${rhythmHits.length} de 12 pulsos. Desviación media ${Math.round(avg*1000)} ms.`)}else msg($('#rhythmStatus'),'No registramos pulsos. Vuelve a intentarlo.')}
  function startRhythm(){if(rhythmActive){stopRhythm();return}if(metroRunning)stopMetro();const ctx=audioContext();rhythmActive=true;rhythmHits=[];rhythmLastBeat=-1;rhythmStart=ctx.currentTime+.45;$('#rhythmHit').disabled=false;$('#rhythmStart').textContent='Detener desafío';msg($('#rhythmScore'),'12 pulsos a 100 BPM');msg($('#rhythmStatus'),'Escucha los clics y toca siguiendo el ritmo.');for(let i=0;i<12;i++)beep(i%4===0?950:680,rhythmStart+i*.6,.05,.12);rhythmTimer=setInterval(()=>{if(ctx.currentTime>rhythmStart+7.6)stopRhythm()},100)}
  function initGames(){$('#hearNote').addEventListener('click',()=>{if(!gameTarget||$$('#noteAnswers button').every(b=>b.disabled))newEarGame();else playEarNote()});$('#fretNext').addEventListener('click',nextFret);$('#rhythmStart').addEventListener('click',startRhythm);$('#rhythmHit').addEventListener('click',hitRhythm);document.addEventListener('keydown',(e)=>{if(e.code!=='Space'||!rhythmActive||e.repeat)return;const target=e.target;if(target instanceof HTMLElement&&target.closest('input,textarea,select,button,[contenteditable]'))return;e.preventDefault();hitRhythm()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&rhythmActive)stopRhythm()});}
  // Edición fotográfica: todas las operaciones son locales en canvas.
  let photoSource=null,photoBlobUrl=null,photoCropRatio=null;const editIds=['brightness','contrast','saturate','hue','blurPhoto'];
  function getPhotoFilter(){return `brightness(${$('#brightness').value}%) contrast(${$('#contrast').value}%) saturate(${$('#saturate').value}%) hue-rotate(${$('#hue').value}deg) blur(${$('#blurPhoto').value}px)`;}
  function paintPhoto(){
    const canvas=$('#photoCanvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!photoSource)return;
    const originalRatio=photoSource.width/photoSource.height;
    const desiredRatio=photoCropRatio||originalRatio;
    let sw=photoSource.width,sh=photoSource.height,sx=0,sy=0;
    if(originalRatio>desiredRatio){sw=photoSource.height*desiredRatio;sx=(photoSource.width-sw)/2;}
    else if(originalRatio<desiredRatio){sh=photoSource.width/desiredRatio;sy=(photoSource.height-sh)/2;}
    const scale=Math.min(1,1200/sw,850/sh);
    canvas.width=Math.max(1,Math.round(sw*scale));canvas.height=Math.max(1,Math.round(sh*scale));
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.filter=getPhotoFilter();
    ctx.drawImage(photoSource,sx,sy,sw,sh,0,0,canvas.width,canvas.height);ctx.filter='none';
    const temp=Number($('#temperature')?.value||0),shadows=Number($('#shadows')?.value||0),lights=Number($('#highlights')?.value||0),vignette=Number($('#vignette')?.value||0)/100;
    if(temp||shadows||lights||vignette){const data=ctx.getImageData(0,0,canvas.width,canvas.height),d=data.data,w=canvas.width,h=canvas.height;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=(y*w+x)*4,luma=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])/255;
        const lift=(shadows*.48)*(1-luma)*(1-luma)+(lights*.48)*luma*luma;
        const dx=x/w-.5,dy=y/h-.5,edge=Math.min(1,(dx*dx+dy*dy)*2.8),shade=1-vignette*.63*edge*edge;
        d[i]=Math.max(0,Math.min(255,(d[i]+lift+temp*.65)*shade));
        d[i+1]=Math.max(0,Math.min(255,(d[i+1]+lift+temp*.08)*shade));
        d[i+2]=Math.max(0,Math.min(255,(d[i+2]+lift-temp*.65)*shade));
      }
      ctx.putImageData(data,0,0);
    }
    msg($('#photoDimension'),`${canvas.width} × ${canvas.height} px`);
    editIds.forEach((id,i)=>msg($('#'+['brightValue','contrastValue','saturateValue','hueValue','blurValue'][i]),$('#'+id).value+(['%','%','%','°',' px'][i])));
    [['temperature','tempValue'],['shadows','shadowValue'],['highlights','highlightValue'],['vignette','vignetteValue']].forEach(([id,out])=>msg($('#'+out),$('#'+id)?.value||'0'));
    renderHistogram();
  }
  window.NOCTURNA_PHOTO_SET_CROP = ratio =>{photoCropRatio=ratio;paintPhoto()};
  window.NOCTURNA_PHOTO_RENDER = paintPhoto;
  window.NOCTURNA_PHOTO_HAS_IMAGE = ()=>!!photoSource;

  function renderHistogram(){const src=$('#photoCanvas'),ctx=src.getContext('2d',{willReadFrequently:true}),data=ctx.getImageData(0,0,src.width,src.height).data;const hist=new Uint32Array(64),sampleStep=Math.max(1,Math.floor(data.length/(4*70000))),swatches=new Map();for(let i=0;i<data.length;i+=4*sampleStep){const r=data[i],g=data[i+1],b=data[i+2];hist[Math.floor((.2126*r+.7152*g+.0722*b)/4)]++;const key=[Math.round(r/51)*51,Math.round(g/51)*51,Math.round(b/51)*51].map(v=>Math.min(v,255));const k=key.join(',');swatches.set(k,(swatches.get(k)||0)+1)}const canvas=$('#histogramCanvas'),c=canvas.getContext('2d'),height=canvas.height,width=canvas.width,max=Math.max(1,...hist);c.clearRect(0,0,width,height);c.fillStyle='#c6a2ee';for(let x=0;x<64;x++){const h=hist[x]/max*(height-7);c.fillRect(x*width/64,height-h,width/64-1,h)}const palette=$('#colorPalette');palette.replaceChildren();[...swatches].sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([key])=>{const span=document.createElement('span');span.style.backgroundColor=`rgb(${key})`;span.title='RGB '+key;palette.append(span)})}
  async function readPhoto(file){if(file.size>12*1024*1024){notify('Foto demasiado grande. Máximo 12 MB.');return}if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notify('Usa JPEG, PNG o WebP.');return}if(photoBlobUrl)URL.revokeObjectURL(photoBlobUrl);photoBlobUrl=URL.createObjectURL(file);const img=new Image();img.onload=()=>{photoSource=img;paintPhoto();msg($('#photoStatus'),'Imagen cargada y procesada en este navegador. No se subió a internet.')};img.onerror=()=>notify('No se pudo leer la imagen.');img.src=photoBlobUrl;}
  function resetPhoto(){editIds.forEach(id=>$('#'+id).value=({brightness:100,contrast:100,saturate:100,hue:0,blurPhoto:0}[id]));['temperature','shadows','highlights','vignette'].forEach(id=>{if($('#'+id))$('#'+id).value=0});photoCropRatio=null;$$('[data-ratio]').forEach(b=>b.classList.toggle('active',b.dataset.ratio==='original'));paintPhoto()}
  function expCalc(){const n=+$('#expAperture').value,s=+$('#expShutter').value,iso=+$('#expISO').value;const ev=Math.log2(n*n/s*100/iso);msg($('#evResult'),ev.toFixed(1))}
  function photoExample(){const c=$('#photoCanvas'),ctx=c.getContext('2d');ctx.fillStyle='#191420';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#d2b6f2';ctx.textAlign='center';ctx.font='22px sans-serif';ctx.fillText('Carga una imagen para comenzar',c.width/2,c.height/2);}
  function initPhoto(){$('#photoFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)readPhoto(f)});editIds.forEach(id=>$('#'+id).addEventListener('input',paintPhoto));['temperature','shadows','highlights','vignette'].forEach(id=>$('#'+id)?.addEventListener('input',paintPhoto));$('#photoReset').addEventListener('click',resetPhoto);$$('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{const v={original:[100,100,100,0,0],noir:[92,135,0,0,0],analog:[105,85,75,-8,0],dream:[112,80,125,17,1.2]}[btn.dataset.preset];editIds.forEach((id,i)=>$('#'+id).value=v[i]);paintPhoto()}));$('#thirdsToggle').addEventListener('change',e=>$('#ruleThirds').hidden=!e.target.checked);
    $('#photoDownload').addEventListener('click',()=>{if(!photoSource){notify('Carga primero una fotografía para descargar tu edición.');return;}$('#photoCanvas').toBlob(blob=>{if(!blob){notify('No se pudo crear la foto.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nocturna-edicion.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)},'image/jpeg',.92)});
    ['expAperture','expShutter','expISO'].forEach(id=>$('#'+id).addEventListener('change',expCalc));expCalc();photoExample();window.addEventListener('pagehide',()=>{if(photoBlobUrl)URL.revokeObjectURL(photoBlobUrl)})}
  // Selección real de productos y recursos; el sitio no cobra ni finge inventario o precios.
  function loadCart(){try{const data=JSON.parse(localStorage.getItem('nocturna-shop-cart')||'{}');if(data && typeof data==='object' && !Array.isArray(data))cart=Object.fromEntries(Object.entries(data).filter(([id,n])=>shopItems.some(p=>p.id===id)&&n===1))}catch(_){cart={}}}
  function renderShop(){
    const wrap=$('#shopGrid');wrap.replaceChildren();
    shopItems.filter(p=>shopFilter==='todo'||p.cat===shopFilter).forEach(p=>{
      const el=document.createElement('article');el.className='product-card';
      const visual=document.createElement('div');visual.className='product-visual';
      const poster=document.createElement('img');poster.src=p.image||({musica:'assets/guitar-study.svg',foto:'assets/lens-study.svg',curso:'assets/sound-study.svg'}[p.cat]);poster.alt=p.image?`Imagen de referencia del modelo ${p.name}`:'';poster.loading='lazy';
      poster.addEventListener('error',()=>{poster.onerror=null;poster.src=p.cat==='foto'?'assets/lens-study.svg':'assets/guitar-study.svg';poster.alt='Ilustración de categoría, no fotografía del producto';},{once:true});visual.append(poster);
      const copy=document.createElement('div');copy.className='product-copy';
      const cat=document.createElement('span');cat.className='product-category';cat.textContent=p.badge;
      const title=document.createElement('h3');title.textContent=p.name;
      const description=document.createElement('p');description.className='product-desc';description.textContent=p.desc;
      const actions=document.createElement('div');actions.className='product-bottom';
      const see=document.createElement('a');see.className='button button-outline';see.href=p.url;see.target='_blank';see.rel='noopener noreferrer';see.textContent=p.cat==='curso'?'Abrir recurso ↗':'Ficha oficial ↗';see.setAttribute('aria-label',`Abrir fuente de ${p.name} en otra pestaña`);
      const save=document.createElement('button');save.type='button';save.className='button button-quiet';save.textContent=cart[p.id]?'✓ Guardado':'+ Guardar';save.setAttribute('aria-pressed',String(!!cart[p.id]));save.addEventListener('click',()=>{if(cart[p.id])delete cart[p.id];else cart[p.id]=1;save.textContent=cart[p.id]?'✓ Guardado':'+ Guardar';save.setAttribute('aria-pressed',String(!!cart[p.id]));updateCart();});
      actions.append(see,save);copy.append(cat,title,description,actions);el.append(visual,copy);wrap.append(el);
    });
  }
  function updateCart(){const entries=Object.keys(cart).filter(id=>cart[id]&&shopItems.some(p=>p.id===id));msg($('#cartCount'),`${entries.length} guardados`);msg($('#cartTotal'),`${entries.length} referencias`);msg($('#cartSummary'),entries.length?entries.map(id=>shopItems.find(p=>p.id===id).name).join(' · '):'Reúne el equipo o los recursos que te interesen. Cada ficha enlaza a su fuente oficial.');try{localStorage.setItem('nocturna-shop-cart',JSON.stringify(cart))}catch(_){} }
  function initShop(){loadCart();$$('.shop-filter').forEach(btn=>btn.addEventListener('click',()=>{shopFilter=btn.dataset.shop;$$('.shop-filter').forEach(b=>b.classList.toggle('active',b===btn));renderShop()}));
    $('#cartClear').addEventListener('click',()=>{cart={};updateCart();renderShop()});
    $('#cartCheckout').addEventListener('click',()=>{const products=Object.keys(cart).filter(id=>cart[id]).map(id=>shopItems.find(p=>p.id===id));if(!products.length){notify('Primero guarda al menos una referencia.');return;}
      const list='Mi selección NOCTURNA\n\n'+products.map(p=>p.name+'\n'+p.url).join('\n\n');if(navigator.clipboard?.writeText){navigator.clipboard.writeText(list).then(()=>notify('La selección y sus enlaces se copiaron.')).catch(()=>notify('No se pudo copiar. Revisa los permisos del navegador.'));}else{notify('La copia requiere HTTPS o localhost.');}
    });
    renderShop();updateCart();
  }
  if ($('#demoAudio')) initPlayer();
  if ($('#tunerToggle')) { initTabs(); initTuner(); initMetro(); initBpm(); initChords(); initCircle(); }
  if ($('#hearNote')) initGames();
  if ($('#photoFile')) initPhoto();
  if ($('#shopGrid')) initShop();
})();
