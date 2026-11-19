/*
  NOCTURNA · JavaScript puro (sin React ni compilación).
  Los permisos de publicación NO dependen de estas comprobaciones del navegador:
  Supabase aplica las políticas RLS de supabase/schema.sql.
*/
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const LABELS = { fotografia: 'Fotografía', guitarra: 'Guitarras', musica: 'Música' };
  const FALLBACKS = {
    fotografia: 'assets/photo-study.svg',
    guitarra: 'assets/guitar-study.svg',
    musica: 'assets/sound-study.svg'
  };
  const PAGE_SIZE = 12;
  const MAX_IMAGE = 8 * 1024 * 1024;
  const MAX_AUDIO = 15 * 1024 * 1024;
  const IMAGE_MIMES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const AUDIO_MIMES = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg', 'audio/webm': 'webm' };
  // Archivo editorial: fotografías de Unsplash y Wikimedia Commons, audios originales y grabaciones Creative Commons.
  // Las fuentes y autores se documentan en CREDITOS_Y_LICENCIAS.md.
  const SAMPLE = [
    {
        "id": "foto-01",
        "titulo": "Cruce bajo la lluvia",
        "categoria": "fotografia",
        "tema": "urbana",
        "nombre_autor": "ayumi kubo",
        "descripcion": "Peatones con paraguas atraviesan una calle luminosa de Tokio, reflejada en el pavimento mojado.",
        "texto_alternativo": "Personas con paraguas cruzan una calle japonesa iluminada por rótulos de neón",
        "imagen_demo": "https://images.unsplash.com/photo-1601625603937-fbf7d3ea94b3?auto=format&fit=crop&w=960&q=82",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/photos/people-with-umbrellas-cross-a-wet-street-at-night-8nigJItHxkU"
    },
    {
        "id": "foto-02",
        "titulo": "Un instante en Shinjuku",
        "categoria": "fotografia",
        "tema": "urbana",
        "nombre_autor": "Walter SUN",
        "descripcion": "El movimiento urbano de Tokio capturado entre gente, vehículos y luces al anochecer.",
        "texto_alternativo": "Una persona sentada observa el tránsito nocturno en un cruce de Tokio",
        "imagen_demo": "https://images.unsplash.com/photo-1730075711139-7fc9dc5e67af?auto=format&fit=crop&w=960&q=82",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/photos/a-group-of-people-standing-on-a-street-next-to-tall-buildings-gvlIDuHaZQ4"
    },
    {
        "id": "foto-03",
        "titulo": "Geometría en blanco y negro",
        "categoria": "fotografia",
        "tema": "arquitectura",
        "nombre_autor": "Matthew Henry",
        "descripcion": "El movimiento de las líneas convergentes en edificios de gran altura.",
        "texto_alternativo": "Vista en contrapicado de edificios altos de cristal en blanco y negro",
        "imagen_demo": "https://images.unsplash.com/photo-1429667947446-3c93a979b7e0?auto=format&fit=crop&w=960&q=82",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/photos/worms-eye-view-of-buildings-nvFpb_MMRj8"
    },
    {
        "id": "foto-04",
        "titulo": "Retrato en magenta",
        "categoria": "fotografia",
        "tema": "retrato",
        "nombre_autor": "Eduardo Pastor",
        "descripcion": "Un retrato nocturno dominado por matices púrpura y reflejos de la ciudad.",
        "texto_alternativo": "Retrato de una mujer iluminada por luces rosas y azules",
        "imagen_demo": "https://images.unsplash.com/photo-1594526048378-5a20fc01f959?auto=format&fit=crop&w=960&q=82",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/photos/woman-in-black-denim-jacket-PpN5PJohk5k"
    },
    {
        "id": "foto-05",
        "titulo": "Amanecer en el lago",
        "categoria": "fotografia",
        "tema": "paisaje",
        "nombre_autor": "Rich Martello",
        "descripcion": "Los últimos tonos cálidos del amanecer sobre las montañas reflejadas en el agua.",
        "texto_alternativo": "Cordillera iluminada de naranja reflejada en un lago turquesa",
        "imagen_demo": "https://images.unsplash.com/photo-1725457309501-36be56b8bea5?auto=format&fit=crop&w=960&q=82",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/photos/a-mountain-lake-surrounded-by-trees-and-rocks-AvJ3mJ9NvPQ"
    },
    {
        "id": "foto-06",
        "titulo": "El gesto de fotografiar",
        "categoria": "fotografia",
        "tema": "retrato",
        "nombre_autor": "Igor Rand",
        "descripcion": "Un retrato monocromático donde la propia cámara se convierte en protagonista.",
        "texto_alternativo": "Mujer con una cámara Canon cubriendo parte de su rostro, fotografía en blanco y negro",
        "imagen_demo": "https://images.unsplash.com/photo-1653258532352-4a8e1f00eac1?auto=format&fit=crop&w=960&q=82",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/photos/a-woman-holding-a-camera-up-to-her-face-O5PrXvwj7HM"
    },
    {
        "id": "foto-07",
        "titulo": "Neón y silencio",
        "categoria": "fotografia",
        "tema": "retrato",
        "nombre_autor": "Maximilian Bungart",
        "descripcion": "Una figura cruza un paisaje urbano iluminado de color.",
        "texto_alternativo": "Persona caminando bajo luces nocturnas violetas",
        "imagen_demo": "https://images.unsplash.com/photo-1761775915877-5b282e59b0b7?auto=format&fit=crop&w=1050&q=85",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/photos/person-walks-down-a-neon-lit-city-street-at-night-M462tyue39Y"
    },
    {
        "id": "foto-08",
        "titulo": "Una mirada a la calle",
        "categoria": "fotografia",
        "tema": "urbana",
        "nombre_autor": "Ravindradevi mint",
        "descripcion": "Fotografía documental publicada bajo dedicación CC0.",
        "texto_alternativo": "Escena de fotografía callejera",
        "imagen_demo": "https://commons.wikimedia.org/wiki/Special:Redirect/file/A_street_photography.jpg?width=900",
        "licencia": "CC0 1.0",
        "source_url": "https://commons.wikimedia.org/wiki/File:A_street_photography.jpg"
    },
    {
        "id": "foto-09",
        "titulo": "Líneas de la ciudad",
        "categoria": "fotografia",
        "tema": "arquitectura",
        "nombre_autor": "Wangming1992",
        "descripcion": "Composición de ciudad con perspectiva y texturas urbanas.",
        "texto_alternativo": "Escena exterior de ciudad y arquitectura",
        "imagen_demo": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Street_photography.jpg?width=900",
        "licencia": "CC BY-SA 3.0",
        "source_url": "https://commons.wikimedia.org/wiki/File:Street_photography.jpg"
    },
    {
        "id": "foto-10",
        "titulo": "Palermo industrial",
        "categoria": "fotografia",
        "tema": "arquitectura",
        "nombre_autor": "Diego Gelvis",
        "descripcion": "Fotografía industrial de Palermo, Sicilia.",
        "texto_alternativo": "Paisaje industrial fotografiado en Palermo",
        "imagen_demo": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Street_Photography.jpg?width=900",
        "licencia": "CC BY-SA 4.0",
        "source_url": "https://commons.wikimedia.org/wiki/File:Street_Photography.jpg"
    },
    {
        "id": "foto-11",
        "titulo": "Eje Central",
        "categoria": "fotografia",
        "tema": "urbana",
        "nombre_autor": "Autor acreditado en Wikimedia Commons",
        "descripcion": "Una mirada nocturna a Eje Central y Ayuntamiento, Ciudad de México.",
        "texto_alternativo": "Avenida de la Ciudad de México iluminada de noche",
        "imagen_demo": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Eje_Central_CDMX.jpg?width=900",
        "licencia": "Consulta licencia en la fuente",
        "source_url": "https://commons.wikimedia.org/wiki/File:Eje_Central_CDMX.jpg"
    },
    {
        "id": "foto-12",
        "titulo": "Al anochecer",
        "categoria": "fotografia",
        "tema": "urbana",
        "nombre_autor": "Autor acreditado en Wikimedia Commons",
        "descripcion": "Un estudio de luz nocturna disponible en el repositorio abierto.",
        "texto_alternativo": "Farola iluminando una calle durante la noche",
        "imagen_demo": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Street_light_at_night.jpg?width=900",
        "licencia": "CC BY 4.0",
        "source_url": "https://commons.wikimedia.org/wiki/File:Street_light_at_night.jpg"
    },
    {
        "id": "foto-13",
        "titulo": "Luz de la calle",
        "categoria": "fotografia",
        "tema": "urbana",
        "nombre_autor": "Autor acreditado en Wikimedia Commons",
        "descripcion": "Una calle retratada de noche desde una perspectiva documental.",
        "texto_alternativo": "Calle fotografiada durante la noche",
        "imagen_demo": "https://commons.wikimedia.org/wiki/Special:Redirect/file/A_Street_at_Night.jpg?width=900",
        "licencia": "CC BY-SA 4.0",
        "source_url": "https://commons.wikimedia.org/wiki/File:A_Street_at_Night.jpg"
    },
    {
        "id": "foto-14",
        "titulo": "Ritmo urbano",
        "categoria": "fotografia",
        "tema": "urbana",
        "nombre_autor": "Autor acreditado en Wikimedia Commons",
        "descripcion": "Los ritmos y signos de la ciudad convertidos en imagen.",
        "texto_alternativo": "Vista de una calle nocturna",
        "imagen_demo": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Street_at_night.jpg?width=900",
        "licencia": "CC BY-SA 4.0",
        "source_url": "https://commons.wikimedia.org/wiki/File:Street_at_night.jpg"
    },
    {
        "id": "foto-15",
        "titulo": "Fotografiar la noche",
        "categoria": "fotografia",
        "tema": "urbana",
        "nombre_autor": "Autor acreditado en Wikimedia Commons",
        "descripcion": "La ciudad como escenario para un estudio de sombra y luz.",
        "texto_alternativo": "Paisaje urbano de noche",
        "imagen_demo": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Street_at_night_image.jpg?width=900",
        "licencia": "CC BY-SA 4.0",
        "source_url": "https://commons.wikimedia.org/wiki/File:Street_at_night_image.jpg"
    },
    {
        "id": "foto-16",
        "titulo": "Nueva York después de la lluvia",
        "categoria": "fotografia",
        "tema": "retrato",
        "nombre_autor": "Autor acreditado en Unsplash",
        "descripcion": "Un fotógrafo en la ciudad entre reflejos y luces de neón.",
        "texto_alternativo": "Fotógrafo con cámara sentado en la acera bajo letreros de neón",
        "imagen_demo": "https://images.unsplash.com/photo-1633535601237-1749994e65b9?auto=format&fit=crop&w=1000&q=85",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/it/foto/un-uomo-seduto-su-un-marciapiede-che-scatta-una-foto-con-una-macchina-fotografica-A0hJyfauHG8"
    },
    {
        "id": "foto-17",
        "titulo": "El gesto de mirar",
        "categoria": "fotografia",
        "tema": "retrato",
        "nombre_autor": "Autor acreditado en Unsplash",
        "descripcion": "Un retrato espontáneo con cámara y luces desenfocadas.",
        "texto_alternativo": "Mujer sosteniendo una cámara en una calle oscura",
        "imagen_demo": "https://images.unsplash.com/photo-1663387776158-5add50dfd9a2?auto=format&fit=crop&w=1000&q=85",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/photos/a-woman-holding-a-camera-GPYWkRH0Ec8"
    },
    {
        "id": "foto-18",
        "titulo": "Autorretrato callejero",
        "categoria": "fotografia",
        "tema": "retrato",
        "nombre_autor": "Autor acreditado en Unsplash",
        "descripcion": "Un fotógrafo crea un retrato frente al paisaje de luces de la ciudad.",
        "texto_alternativo": "Joven sosteniendo una cámara frente a luces urbanas",
        "imagen_demo": "https://images.unsplash.com/photo-1722218530046-481e9be0cb37?auto=format&fit=crop&w=1000&q=85",
        "licencia": "Licencia Unsplash",
        "source_url": "https://unsplash.com/photos/a-man-taking-a-picture-of-himself-with-a-camera-2jb8Vy87yuw"
    }
];
  window.NOCTURNA_PHOTOS = SAMPLE;

  const state = {
    db: null,
    user: null,
    works: [],
    demo: true,
    page: 0,
    hasMore: false,
    loading: false,
    filter: 'todas',
    mineOnly: false,
    galleryView: '',
    subsetWorks: [],
    selected: null,
    recovering: false,
    previewUrl: null,
    toastTimer: null
  };

  function setMessage(el, message, error = false) {
    el.textContent = message || '';
    el.classList.toggle('error', Boolean(error));
  }
  function announce(message) { $('#srAnnouncements').textContent = message; }
  function toast(message) {
    const el = $('#toast');
    clearTimeout(state.toastTimer);
    el.textContent = message;
    el.hidden = false;
    state.toastTimer = setTimeout(() => { el.hidden = true; }, 5000);
  }
  function localGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function localSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* Navegación privada */ } }

  function initPreferences() {
    if (localGet('nocturna-contrast') === 'on') setPreference('contrast', true);
    if (localGet('nocturna-font') === 'large') setPreference('font', true);
    $('#contrastBtn').addEventListener('click', () => setPreference('contrast', !document.body.classList.contains('high-contrast')));
    $('#fontBtn').addEventListener('click', () => setPreference('font', !document.documentElement.classList.contains('large-text')));
  }
  function setPreference(pref, enabled) {
    const contrast = pref === 'contrast';
    (contrast ? document.body : document.documentElement).classList.toggle(contrast ? 'high-contrast' : 'large-text', enabled);
    const button = $(contrast ? '#contrastBtn' : '#fontBtn');
    button.setAttribute('aria-pressed', String(enabled));
    const wording = contrast ? (enabled ? 'Desactivar alto contraste' : 'Activar alto contraste') : (enabled ? 'Restaurar tamaño de letra' : 'Aumentar tamaño de letra');
    button.setAttribute('aria-label', wording);
    button.title = wording;
    localSet(contrast ? 'nocturna-contrast' : 'nocturna-font', contrast ? (enabled ? 'on' : 'off') : (enabled ? 'large' : 'normal'));
    announce(wording.replace('Activar', 'Opción: '));
  }

  function initDialogs() {
    $$('[data-close]').forEach(btn => btn.addEventListener('click', () => {
      const dialog = document.getElementById(btn.dataset.close);
      if (dialog?.open) dialog.close();
    }));
    $$('.dialog').forEach(dialog => dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    }));
    $('#detailDialog')?.addEventListener('close', () => {
      const audio = $('#detailAudio');
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      window.dispatchEvent(new CustomEvent('nocturna:detailClose'));
    });
  }
  function showDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog && !dialog.open) dialog.showModal();
  }
  function closeDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog?.open) dialog.close();
  }

  function isConfigured() {
    const cfg = window.NOCTURNA_CONFIG || {};
    return typeof cfg.supabaseUrl === 'string' && /^https:\/\/[^\s/]+/i.test(cfg.supabaseUrl)
      && typeof cfg.supabaseAnonKey === 'string' && cfg.supabaseAnonKey.trim().length > 20;
  }
  function redirectUrl() { return window.location.origin + window.location.pathname; }
  function friendlyError(error) {
    const text = (error?.message || '').toLowerCase();
    if (text.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (text.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
    if (text.includes('user already registered')) return 'Ya existe una cuenta con ese correo.';
    if (text.includes('rate limit') || text.includes('too many')) return 'Hay demasiados intentos. Inténtalo más tarde.';
    if (text.includes('fetch') || text.includes('network')) return 'No se pudo conectar. Comprueba tu conexión a internet y la configuración de Supabase.';
    if (text.includes('row-level security') || text.includes('permission denied')) return 'Permiso denegado. Comprueba las políticas SQL de Supabase.';
    if (text.includes('bucket not found')) return 'No existe el depósito de archivos. Ejecuta el SQL del proyecto.';
    if (text.includes('payload too large') || text.includes('maximum allowed size')) return 'El archivo supera el límite permitido.';
    return error?.message || 'Ocurrió un error inesperado.';
  }

  function loadSupabaseSdk() {
    // La demo es totalmente local: solo descargamos la librería cuando hay credenciales.
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('No se pudo descargar la librería de Supabase.'));
      document.head.append(script);
    });
  }

  async function initSupabase() {
    if (!isConfigured()) {
      activateDemo('');
      return;
    }
    try {
      if (!window.supabase?.createClient) await loadSupabaseSdk();
      if (!window.supabase?.createClient) throw new Error('La librería de Supabase no se inicializó.');
      state.db = window.supabase.createClient(window.NOCTURNA_CONFIG.supabaseUrl, window.NOCTURNA_CONFIG.supabaseAnonKey, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
      });
      state.demo = false;
      if ($('#setupNotice')) $('#setupNotice').hidden = true;
      window.dispatchEvent(new CustomEvent('nocturna:connected'));
      // Evitar consultas async dentro de la devolución de llamada de Auth.
      state.db.auth.onAuthStateChange((event, session) => {
        setTimeout(() => {
          state.user = session?.user || null;
          updateAccountUI();
          window.dispatchEvent(new CustomEvent('nocturna:user'));
          if (event === 'PASSWORD_RECOVERY') {
            state.recovering = true;
            switchAuth('newPassword');
            showDialog('authDialog');
          }
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            if (event === 'SIGNED_IN' && !state.recovering) closeDialog('authDialog');
            if (state.mineOnly) renderGallery();
          }
        }, 0);
      });
      const { data, error } = await state.db.auth.getUser();
      if (error && !/auth session missing/i.test(error.message)) console.warn('Auth:', friendlyError(error));
      state.user = data?.user || null;
      updateAccountUI();
      await loadWorks(true);
      applyGalleryUrl();
    } catch (error) {
      console.error(error);
      state.db = null;
      activateDemo('El archivo no está disponible temporalmente.');
    }
  }
  function activateDemo(message) {
    state.demo = true;
    state.db = null;
    state.user = null;
    state.works = SAMPLE;
    state.page = 0;
    state.hasMore = false;
    if ($('#setupNotice')) $('#setupNotice').hidden = true;
    updateAccountUI();
    renderGallery();
    applyGalleryUrl();
    window.dispatchEvent(new CustomEvent('nocturna:demo'));
  }
  function updateAccountUI() {
    const hasUser = Boolean(state.user);
    $('#authBtn').hidden = hasUser;
    $('#accountArea').hidden = !hasUser;
    $('#myWorksLink').hidden = !hasUser;
    $('#savedWorksLink').hidden = !hasUser;
    if (hasUser) {
      const alias = getArtistName();
      $('.account-avatar').textContent = alias[0].toUpperCase();
      $('#accountBtn').setAttribute('aria-label', `Cerrar sesión de ${alias}`);
      $('#accountBtn').title = `Conectado como ${alias}. Cerrar sesión`;
    } else if (state.mineOnly) {
      state.mineOnly = false;
    }
  }
  function getArtistName() {
    const alias = state.user?.user_metadata?.display_name;
    return typeof alias === 'string' && alias.trim().length >= 2 ? alias.trim().slice(0, 32) : 'Artista';
  }
  async function loadWorks(reset = false) {
    if (!$('#galleryGrid') || !state.db || state.loading) return;
    state.loading = true;
    const loadButton = $('#loadMoreBtn');
    loadButton.disabled = true;
    $('#galleryStatus').textContent = 'Cargando obras...';
    try {
      const pageToLoad = reset ? 0 : state.page + 1;
      const from = pageToLoad * PAGE_SIZE;
      const { data, error } = await state.db.from('obras').select('id,autor_id,nombre_autor,titulo,descripcion,categoria,texto_alternativo,imagen_path,audio_path,creado_en').order('creado_en', { ascending: false }).range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      state.works = reset ? (data || []) : [...state.works, ...(data || [])];
      state.page = pageToLoad;
      state.hasMore = (data || []).length === PAGE_SIZE;
      renderGallery();
    } catch (error) {
      console.error('Error al cargar galería:', error);
      $('#galleryStatus').textContent = 'No fue posible cargar la galería.';
      toast(friendlyError(error));
      if (reset) { state.works = []; renderGallery(); }
    } finally {
      state.loading = false;
      loadButton.disabled = false;
    }
  }
  function getImageUrl(work) {
    if (work.imagen_demo) return work.imagen_demo;
    if (!state.db || !work.imagen_path) return FALLBACKS[work.categoria] || FALLBACKS.fotografia;
    return state.db.storage.from('obras-imagenes').getPublicUrl(work.imagen_path).data.publicUrl;
  }
  function getAudioUrl(work) {
    if (work.audio_demo) return work.audio_demo;
    if (!work.audio_path || !state.db) return '';
    return state.db.storage.from('obras-audio').getPublicUrl(work.audio_path).data.publicUrl;
  }
  function createNode(tag, cls, content) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content !== undefined) el.textContent = content;
    return el;
  }
  function renderGallery() {
    if (!$('#galleryGrid')) return;
    const query = $('#searchInput').value.trim().toLocaleLowerCase('es');
    const baseWorks = state.galleryView ? state.subsetWorks : (state.demo ? state.works : (state.mineOnly ? state.works : [...state.works, ...SAMPLE]));
    const visible = baseWorks.filter(work => {
      if (work.categoria !== 'fotografia') return false;
      if (state.mineOnly && work.autor_id !== state.user?.id) return false;
      if (state.filter !== 'todas' && work.tema !== state.filter) return false;
      if (!query) return true;
      return [work.titulo, work.descripcion, work.nombre_autor].some(value => (value || '').toLocaleLowerCase('es').includes(query));
    });
    $('#clearViewBtn').hidden = !state.galleryView && !state.mineOnly;
    const grid = $('#galleryGrid');
    grid.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const work of visible) {
      const article = createNode('article', 'art-card');
      const button = createNode('button', 'art-open');
      button.type = 'button';
      button.setAttribute('aria-label', `Ver obra ${work.titulo}, ${LABELS[work.categoria]}, por ${work.nombre_autor}`);
      const thumb = createNode('span', 'art-thumb');
      const image = document.createElement('img');
      image.src = getImageUrl(work);
      image.alt = work.texto_alternativo;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => {
        image.remove();thumb.classList.add('art-thumb-unavailable');
        const unavailable=createNode('span','photo-fallback-text','Fotografía no disponible · '+work.nombre_autor);
        thumb.prepend(unavailable);
      }, { once: true });
      thumb.append(image, createNode('span', 'art-type', (work.tema || 'Fotografía').toUpperCase()));
      if (work.audio_path || work.audio_demo) thumb.append(createNode('span', 'art-audio-mark', '♫'));
      const meta = createNode('span', 'art-meta');
      meta.append(createNode('span', 'art-name', work.titulo), createNode('span', 'art-arrow', '↗'));
      button.append(thumb, meta, createNode('span', 'art-creator', `por ${work.nombre_autor}`));
      button.addEventListener('click', () => openDetail(work));
      article.append(button);
      if(work.imagen_demo) article.classList.add('is-demo');
      fragment.append(article);
    }
    grid.append(fragment);
    const hasResults = visible.length > 0;
    $('#emptyState').hidden = hasResults;
    $('#loadMoreBtn').hidden = state.demo || !!state.galleryView || !state.hasMore || (state.mineOnly && !state.user);
    $('#allCount').textContent = String(baseWorks.length).padStart(2, '0') + (state.hasMore ? '+' : '');
    $('#galleryStatus').textContent = `${visible.length} ${visible.length === 1 ? 'obra' : 'obras'} en esta colección${state.mineOnly ? ' · mis publicaciones' : ''}${state.galleryView ? ' · ' + state.galleryView : ''}`;
  }
  function selectFilter(category) {
    state.filter = category;
    $$('.filter-pill').forEach(btn => {
      const active = btn.dataset.filter === category;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    renderGallery();
  }
  function clearFilters() {
    state.mineOnly = false;
    state.galleryView = '';
    state.subsetWorks = [];
    $('#searchInput').value = '';
    selectFilter('todas');
  }
  function openDetail(work) {
    state.selected = work;
    $('#detailTitle').textContent = work.titulo;
    $('#detailCategory').textContent = LABELS[work.categoria] || 'Arte';
    $('#detailAuthor').textContent = `Obra de ${work.nombre_autor}`;
    $('#detailDescription').textContent = work.descripcion;
    const image = $('#detailImage');
    image.src = getImageUrl(work);
    image.alt = work.texto_alternativo;
    image.onerror = () => {image.onerror=null;image.hidden=true;
      const hint=$('#detailImageUnavailable');if(hint){hint.hidden=false;hint.textContent='La fotografía no se pudo cargar. Puedes visitar la fuente original desde el enlace de licencia.';}
    };const hint=$('#detailImageUnavailable');if(hint){hint.hidden=true;}image.hidden=false;
    const audioUrl = getAudioUrl(work);
    $('#detailAudioWrap').hidden = !audioUrl;
    if (audioUrl) $('#detailAudio').src = audioUrl;
    const owner = !!state.user && !state.demo && state.user.id === work.autor_id;
    $('#deleteBtn').hidden = !owner;
    $('#editWorkBtn').hidden = !owner;
    const credit = $('#detailCredit');
    credit.hidden = !work.licencia;
    credit.href = work.source_url || 'creditos.html';
    credit.textContent = work.licencia ? `Fuente y licencia: ${work.licencia} ↗` : '';
    showDialog('detailDialog');
    window.dispatchEvent(new CustomEvent('nocturna:detail', {detail: {work}}));
  }

  function switchAuth(mode) {
    const forms = { login: '#loginForm', signup: '#signupForm', reset: '#resetForm', newPassword: '#newPasswordForm' };
    for (const [key, selector] of Object.entries(forms)) $(selector).hidden = key !== mode;
    const showTabs = mode === 'login' || mode === 'signup';
    $('.auth-tabs').hidden = !showTabs;
    $('#tabLogin').classList.toggle('active', mode === 'login');
    $('#tabSignup').classList.toggle('active', mode === 'signup');
    $('#tabLogin').setAttribute('aria-pressed', String(mode === 'login'));
    $('#tabSignup').setAttribute('aria-pressed', String(mode === 'signup'));
    $('#authTitle').textContent = mode === 'reset' ? 'Recuperar contraseña' : mode === 'newPassword' ? 'Nueva contraseña' : 'Tu espacio en NOCTURNA.';
    setMessage($('#authMessage'), '');
  }
  function openAuth() {
    if (state.demo) { toast('El registro y el acceso a cuentas estarán disponibles próximamente.'); return; }
    switchAuth('login');
    showDialog('authDialog');
  }
  function openPublish() {
    if (state.demo) { toast('Las publicaciones de la comunidad estarán disponibles próximamente.'); return; }
    if (!state.user) { openAuth(); toast('Inicia sesión para compartir una obra.'); return; }
    setMessage($('#publishMessage'), '');
    showDialog('publishDialog');
  }
  function busy(button, active, waitingText, original) {
    button.disabled = active;
    button.textContent = active ? waitingText : original;
  }
  async function login(event) {
    event.preventDefault();
    const button = $('#loginSubmit');
    const original = button.textContent;
    busy(button, true, 'Entrando...', original);
    setMessage($('#authMessage'), '');
    try {
      const { error } = await state.db.auth.signInWithPassword({ email: $('#loginEmail').value.trim(), password: $('#loginPassword').value });
      if (error) throw error;
      closeDialog('authDialog');
      $('#loginForm').reset();
      toast('Has iniciado sesión. ¡Bienvenido a tu estudio!');
    } catch (error) { setMessage($('#authMessage'), friendlyError(error), true); }
    finally { busy(button, false, '', original); }
  }
  async function signup(event) {
    event.preventDefault();
    const alias = $('#signupName').value.trim();
    if (alias.length < 2 || alias.length > 32) { setMessage($('#authMessage'), 'Tu alias debe tener entre 2 y 32 caracteres.', true); return; }
    const button = $('#signupSubmit');
    const original = button.textContent;
    busy(button, true, 'Creando cuenta...', original);
    setMessage($('#authMessage'), '');
    try {
      const { data, error } = await state.db.auth.signUp({
        email: $('#signupEmail').value.trim(), password: $('#signupPassword').value,
        options: { data: { display_name: alias }, emailRedirectTo: redirectUrl() }
      });
      if (error) throw error;
      $('#signupForm').reset();
      if (data.session) {
        closeDialog('authDialog');
        toast('Tu cuenta está lista. Ya puedes publicar una obra.');
      } else {
        setMessage($('#authMessage'), 'Si el correo es válido, recibirás un mensaje para confirmar tu cuenta. Revisa también spam.');
      }
    } catch (error) { setMessage($('#authMessage'), friendlyError(error), true); }
    finally { busy(button, false, '', original); }
  }
  async function resetPassword(event) {
    event.preventDefault();
    const button = $('#resetSubmit');
    const original = button.textContent;
    busy(button, true, 'Enviando...', original);
    try {
      const { error } = await state.db.auth.resetPasswordForEmail($('#resetEmail').value.trim(), { redirectTo: redirectUrl() });
      if (error) throw error;
      setMessage($('#authMessage'), 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.');
    } catch (error) { setMessage($('#authMessage'), friendlyError(error), true); }
    finally { busy(button, false, '', original); }
  }
  async function updatePassword(event) {
    event.preventDefault();
    const button = $('#newPasswordSubmit');
    const original = button.textContent;
    busy(button, true, 'Guardando...', original);
    try {
      const { error } = await state.db.auth.updateUser({ password: $('#newPassword').value });
      if (error) throw error;
      $('#newPasswordForm').reset();
      state.recovering = false;
      closeDialog('authDialog');
      toast('Contraseña actualizada correctamente.');
    } catch (error) { setMessage($('#authMessage'), friendlyError(error), true); }
    finally { busy(button, false, '', original); }
  }
  async function logout() {
    if (!state.db) return;
    try {
      const { error } = await state.db.auth.signOut();
      if (error) throw error;
      state.user = null;
      updateAccountUI();
      renderGallery();
      toast('Sesión cerrada.');
    } catch (error) { toast(friendlyError(error)); }
  }

  function clearPreview() {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
    $('#imagePreviewWrap').hidden = true;
    $('#imagePreview').removeAttribute('src');
  }
  function validateFile(file, mapping, limit, field) {
    if (!file) return `${field}: selecciona un archivo.`;
    if (!Object.hasOwn(mapping, file.type)) return `${field}: formato de archivo no permitido.`;
    if (!file.size || file.size > limit) return `${field}: tamaño no permitido (máximo ${Math.round(limit / 1024 / 1024)} MB).`;
    return '';
  }
  function onPreview() {
    clearPreview();
    const file = $('#artImage').files?.[0];
    if (!file || validateFile(file, IMAGE_MIMES, MAX_IMAGE, 'Imagen')) return;
    state.previewUrl = URL.createObjectURL(file);
    $('#imagePreview').src = state.previewUrl;
    $('#imagePreviewWrap').hidden = false;
  }
  async function publish(event) {
    event.preventDefault();
    if (!state.user || !state.db) { openAuth(); return; }
    const category = $('#artCategory').value;
    const imageFile = $('#artImage').files?.[0];
    const audioFile = $('#artAudio').files?.[0];
    const validation = validateFile(imageFile, IMAGE_MIMES, MAX_IMAGE, 'Imagen') || (audioFile ? validateFile(audioFile, AUDIO_MIMES, MAX_AUDIO, 'Audio') : '');
    if (validation) { setMessage($('#publishMessage'), validation, true); return; }
    if (!Object.hasOwn(LABELS, category)) { setMessage($('#publishMessage'), 'Elige una categoría válida.', true); return; }
    if (category === 'fotografia' && audioFile) { setMessage($('#publishMessage'), 'Para adjuntar audio, selecciona Música o Guitarras.', true); return; }
    if (!$('#originalCheck').checked) { setMessage($('#publishMessage'), 'Confirma que tienes permiso para publicar estos archivos.', true); return; }
    const title = $('#artTitle').value.trim();
    const description = $('#artDescription').value.trim();
    const alt = $('#artAlt').value.trim();
    if (title.length < 3 || description.length < 10 || alt.length < 10) { setMessage($('#publishMessage'), 'Completa título, historia y descripción de imagen con la longitud mínima indicada.', true); return; }
    const button = $('#publishSubmit');
    const original = button.textContent;
    busy(button, true, 'Subiendo archivos...', original);
    setMessage($('#publishMessage'), 'Estamos guardando tu publicación. No cierres esta ventana.');
    const imagePath = `${state.user.id}/${crypto.randomUUID()}.${IMAGE_MIMES[imageFile.type]}`;
    const audioPath = audioFile ? `${state.user.id}/${crypto.randomUUID()}.${AUDIO_MIMES[audioFile.type]}` : null;
    let imageUploaded = false;
    let audioUploaded = false;
    try {
      const img = await state.db.storage.from('obras-imagenes').upload(imagePath, imageFile, { upsert: false, contentType: imageFile.type });
      if (img.error) throw img.error;
      imageUploaded = true;
      if (audioFile) {
        busy(button, true, 'Subiendo audio...', original);
        const aud = await state.db.storage.from('obras-audio').upload(audioPath, audioFile, { upsert: false, contentType: audioFile.type });
        if (aud.error) throw aud.error;
        audioUploaded = true;
      }
      const { error } = await state.db.from('obras').insert({
        autor_id: state.user.id,
        nombre_autor: getArtistName(),
        titulo: title,
        descripcion: description,
        categoria: category,
        texto_alternativo: alt,
        imagen_path: imagePath,
        audio_path: audioPath
      });
      if (error) throw error;
      $('#publishForm').reset();
      clearPreview();
      closeDialog('publishDialog');
      toast('Tu obra fue publicada correctamente.');
      state.mineOnly = false;
      state.galleryView = '';
      state.subsetWorks = [];
      selectFilter('todas');
      if (!$('#galleryGrid')) { window.location.href = 'explorar.html'; return; }
      await loadWorks(true);
      document.getElementById('explorar').scrollIntoView({ behavior: 'smooth' });
      return;
    } catch (error) {
      console.error('Error al publicar:', error);
      setMessage($('#publishMessage'), friendlyError(error), true);
      // Limpieza compensatoria si falla un paso posterior a la subida.
      if (audioUploaded) await state.db.storage.from('obras-audio').remove([audioPath]);
      if (imageUploaded) await state.db.storage.from('obras-imagenes').remove([imagePath]);
    } finally { busy(button, false, '', original); }
  }
  async function deleteWork() {
    const work = state.selected;
    if (!work || !state.db || state.user?.id !== work.autor_id) return;
    if (!window.confirm(`¿Eliminar definitivamente «${work.titulo}»? Esta acción no se puede deshacer.`)) return;
    const button = $('#deleteBtn');
    const original = button.textContent;
    busy(button, true, 'Eliminando...', original);
    try {
      const { error } = await state.db.from('obras').delete().eq('id', work.id).eq('autor_id', state.user.id);
      if (error) throw error;
      // Borramos el registro primero: si Storage falla, no queda una publicación rota.
      // Archivos huérfanos por errores puntuales de red requieren limpieza administrativa.
      if (work.audio_path) await state.db.storage.from('obras-audio').remove([work.audio_path]);
      if (work.imagen_path) await state.db.storage.from('obras-imagenes').remove([work.imagen_path]);
      closeDialog('detailDialog');
      state.selected = null;
      toast('La publicación fue eliminada.');
      await loadWorks(true);
      applyGalleryUrl();
    } catch (error) { toast(friendlyError(error)); }
    finally { busy(button, false, '', original); }
  }

  async function loadSavedWorks() {
    if (!$('#galleryGrid')) { window.location.href = 'explorar.html?saved=1'; return; }
    if (!state.db || !state.user) return;
    try {
      const {data,error} = await state.db.from('favoritos').select('obra_id').eq('usuario_id',state.user.id).limit(100);
      if (error) throw error;
      const ids=(data||[]).map(row=>row.obra_id);
      const result=ids.length?await state.db.from('obras').select('id,autor_id,nombre_autor,titulo,descripcion,categoria,texto_alternativo,imagen_path,audio_path,creado_en').in('id',ids).order('creado_en',{ascending:false}):{data:[],error:null};
      if(result.error)throw result.error;
      state.galleryView='Mis favoritos';state.subsetWorks=result.data||[];state.mineOnly=false;
      $('#searchInput').value='';selectFilter('todas');$('#explorar').scrollIntoView({behavior:'smooth'});
    } catch(error){toast(friendlyError(error));}
  }
  async function loadPortfolio({id,alias}){
    if (!$('#galleryGrid')) {
      if (id) window.location.href = 'explorar.html?autor=' + encodeURIComponent(id) + '&nombre=' + encodeURIComponent(String(alias || 'Artista').slice(0,32));
      return;
    }
    if(!state.db || !id)return;
    try{
      const {data,error}=await state.db.from('obras').select('id,autor_id,nombre_autor,titulo,descripcion,categoria,texto_alternativo,imagen_path,audio_path,creado_en').eq('autor_id',id).order('creado_en',{ascending:false}).limit(100);
      if(error)throw error;
      state.galleryView=`Portafolio: ${String(alias||'Artista').slice(0,32)}`;
      state.subsetWorks=data||[];state.mineOnly=false;
      $('#searchInput').value='';selectFilter('todas');$('#explorar').scrollIntoView({behavior:'smooth'});
    }catch(error){toast(friendlyError(error));}
  }
  function openEdit(){
    const w=state.selected;if(!w || !state.user || w.autor_id!==state.user.id)return;
    $('#editWorkTitle').value=w.titulo;$('#editWorkDesc').value=w.descripcion;$('#editWorkAlt').value=w.texto_alternativo;
    setMessage($('#editStatus'),'');closeDialog('detailDialog');showDialog('editDialog');
  }
  async function saveEdit(event){
    event.preventDefault();const w=state.selected;
    if(!w || !state.db || w.autor_id!==state.user?.id)return;
    const data={titulo:$('#editWorkTitle').value.trim(),descripcion:$('#editWorkDesc').value.trim(),texto_alternativo:$('#editWorkAlt').value.trim()};
    if(data.titulo.length<3 || data.descripcion.length<10 || data.texto_alternativo.length<10){setMessage($('#editStatus'),'Completa los campos con la longitud mínima.',true);return;}
    const button=$('#editSubmit');button.disabled=true;
    try{
      const {error}=await state.db.from('obras').update(data).eq('id',w.id).eq('autor_id',state.user.id);
      if(error)throw error;
      closeDialog('editDialog');toast('Cambios guardados.');
      if(state.galleryView){state.subsetWorks=state.subsetWorks.map(p=>p.id===w.id?{...p,...data}:p);renderGallery();}
      else await loadWorks(true);
    }catch(error){setMessage($('#editStatus'),friendlyError(error),true)}
    finally{button.disabled=false}
  }

  function applyGalleryUrl() {
    if (!$('#galleryGrid')) return;
    const query = new URLSearchParams(window.location.search);
    const category = query.get('categoria');
    if (category && ['fotografia','guitarra','musica'].includes(category)) selectFilter(category);
    if (query.get('mine') === '1' && state.user) { state.mineOnly = true; state.galleryView=''; renderGallery(); }
    if (query.get('saved') === '1' && state.user && state.db) loadSavedWorks();
    const photoId = query.get('obra');
    if (photoId && /^[a-z0-9-]{1,40}$/i.test(photoId)) {const w = (state.demo ? SAMPLE : [...state.works,...SAMPLE]).find(x=>x.id===photoId); if(w) setTimeout(()=>openDetail(w),80);}
    const author = query.get('autor');
    if (author && /^[0-9a-f-]{36}$/i.test(author) && state.db) loadPortfolio({id: author, alias: query.get('nombre') || 'Artista'});
  }
  function initListeners() {
    // Respaldo de banners sin Javascript inline (compatible con CSP de Cloudflare).
    $$('img[data-photo-backup]').forEach(img=>img.addEventListener('error',()=>{
      img.src=img.dataset.photoBackup;
    },{once:true}));
    initPreferences();
    initDialogs();
    const bind = (selector, event, callback) => $(selector)?.addEventListener(event, callback);
    $$('.filter-pill').forEach(btn => btn.addEventListener('click', () => selectFilter(btn.dataset.filter)));
    bind('#searchInput', 'input', renderGallery);
    bind('#clearFiltersBtn', 'click', clearFilters);
    bind('#clearViewBtn', 'click', clearFilters);
    bind('#loadMoreBtn', 'click', () => loadWorks());
    bind('#myWorksLink', 'click', (event) => {
      if (!$('#galleryGrid')) return;
      event.preventDefault();
      state.galleryView=''; state.mineOnly=true; selectFilter('todas'); $('#searchInput').value=''; renderGallery();
      history.replaceState(null,'','explorar.html?mine=1');
    });
    bind('#savedWorksLink', 'click', event => {
      if (!$('#galleryGrid')) return;
      event.preventDefault(); loadSavedWorks();
      history.replaceState(null,'','explorar.html?saved=1');
    });
    window.addEventListener('nocturna:portfolio', e => loadPortfolio(e.detail));
    bind('#authBtn', 'click', openAuth);
    bind('#accountBtn', 'click', logout);
    ['heroPublish','publishBtn','endPublish'].forEach(id => document.getElementById(id)?.addEventListener('click',openPublish));
    bind('#tabLogin','click',()=>switchAuth('login'));
    bind('#tabSignup','click',()=>switchAuth('signup'));
    bind('#forgotBtn','click',()=>switchAuth('reset'));
    bind('#backLoginBtn','click',()=>switchAuth('login'));
    bind('#loginForm','submit',login);
    bind('#signupForm','submit',signup);
    bind('#resetForm','submit',resetPassword);
    bind('#newPasswordForm','submit',updatePassword);
    bind('#artImage','change',onPreview);
    bind('#artCategory','change',event=>{
      const isPhoto=event.target.value==='fotografia';
      $('#artAudio').disabled=isPhoto;
      if(isPhoto)$('#artAudio').value='';
    });
    bind('#publishForm','submit',publish);
    bind('#deleteBtn','click',deleteWork);
    bind('#editWorkBtn','click',openEdit);
    bind('#editForm','submit',saveEdit);
    bind('#publishDialog','close',clearPreview);
  }

  window.NOCTURNA_BRIDGE = { snapshot: () => ({ db: state.db, user: state.user, demo: state.demo }) };
  initListeners();
  initSupabase();
})();
