/* NOCTURNA · Ocho pistas de Radio Nocturna con Me gusta y Guardar.
   Los favoritos de las ocho sesiones se guardan en este navegador.
   Los de obras publicadas por usuarios se sincronizan por Supabase. */
(() => {
  'use strict';
  const STORAGE = 'nocturna-music-social-v1'; // mantener favoritas existentes
  const tracks = window.NOCTURNA_TRACKS || [];
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const node = (tag, className, text) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  };
  const catalog = new Map();
  tracks.forEach((track, index) => catalog.set(`local:${index + 1}`, {
    key: `local:${index + 1}`, kind: 'local',
    title: track.name, artist: track.artist,
    href: `musica.html?track=${index + 1}#escuchar`
  }));
  let stored = {};
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    if (data && typeof data === 'object' && !Array.isArray(data)) stored = data;
  } catch (_) { /* almacenamiento restringido */ }
  const remote = new Map();
  const controls = [];
  let activeView = 'saved';
  let remoteRequest = 0;
  const profileGrid = $('#profileMusicGrid');

  function bridge() { return window.NOCTURNA_BRIDGE?.snapshot?.() || {}; }
  function status(key, field) {
    return key.startsWith('remote:') ? !!remote.get(key)?.[field] : !!stored[key]?.[field];
  }
  function updateControls() {
    controls.forEach(({key, like, save}) => {
      const liked = status(key, 'liked');
      const saved = status(key, 'saved');
      like.textContent = liked ? '♥ Te gusta' : '♡ Me gusta';
      like.setAttribute('aria-pressed', String(liked));
      save.textContent = saved ? '★ Guardada' : '☆ Guardar';
      save.setAttribute('aria-pressed', String(saved));
    });
  }
  function saveLocal() {
    try { localStorage.setItem(STORAGE, JSON.stringify(stored)); } catch (_) { /* privado */ }
    window.dispatchEvent(new Event('nocturna:music-updated'));
  }
  async function toggle(key, field, message) {
    if (key.startsWith('remote:')) {
      const entry = remote.get(key);
      const {db, user} = bridge();
      if (!entry || !db || !user) {
        if (message) message.textContent = 'Inicia sesión para guardar publicaciones.';
        $('#authBtn')?.click();
        return;
      }
      const table = field === 'liked' ? 'me_gusta' : 'favoritos';
      const wasSet = !!entry[field];
      const response = wasSet
        ? await db.from(table).delete().eq('usuario_id', user.id).eq('obra_id', entry.id)
        : await db.from(table).insert({usuario_id: user.id, obra_id: entry.id});
      if (response.error) {
        if (message) message.textContent = 'No se pudo actualizar tu colección.';
        console.error('Nocturna music reactions:', response.error);
        return;
      }
      entry[field] = !wasSet;
      updateControls();
      renderProfile();
      window.dispatchEvent(new Event('nocturna:music-community-updated'));
      return;
    }
    if (!catalog.has(key)) return;
    const current = { ...(stored[key] || {}), [field]: !status(key, field) };
    if (!current.liked && !current.saved) delete stored[key];
    else stored[key] = {...catalog.get(key), ...current};
    saveLocal();
    updateControls();
    if (profileGrid) renderProfile();
  }
  function makeActions(data) {
    const outer = node('div', 'music-social-actions');
    const feedback = node('span', 'sr-only');
    feedback.setAttribute('role', 'status');
    const like = node('button', '', '♡ Me gusta');
    const save = node('button', '', '☆ Guardar');
    for (const [button, field, title] of [[like, 'liked', 'Me gusta'], [save, 'saved', 'Guardar']]) {
      button.type = 'button';
      button.setAttribute('aria-label', `${title}: ${data.title} por ${data.artist}`);
      button.addEventListener('click', () => toggle(data.key, field, feedback));
    }
    controls.push({key: data.key, like, save});
    outer.append(like, save, feedback);
    return outer;
  }
  $$('#trackList > .track-row').forEach((button, index) => {
    const data = catalog.get(`local:${index + 1}`);
    if (!data) return;
    const wrapper = node('div', 'track-entry');
    button.replaceWith(wrapper);
    wrapper.append(button, makeActions(data));
  });
  updateControls();
  // Seleccionar visualmente una pista compartida desde Mi perfil, sin reproducir automáticamente.
  const chosenTrack = Number(new URLSearchParams(location.search).get('track'));
  if (Number.isInteger(chosenTrack) && chosenTrack >= 1 && chosenTrack <= tracks.length) {
    const row = $$('#trackList .track-row')[chosenTrack - 1];
    if (row) {
      row.classList.add('from-collection');
      row.setAttribute('aria-description', 'Seleccionada desde tu perfil. Pulsa para escucharla.');
    }
  }
  if (!profileGrid) return;

  function renderProfile() {
    // Al cambiar de pestaña, desechar controles antiguos.
    controls.length = 0;
    const localEntries = [...catalog.values()]
      .filter(item => stored[item.key]?.liked || stored[item.key]?.saved)
      .map(item => ({...item, liked: !!stored[item.key]?.liked, saved: !!stored[item.key]?.saved}));
    const all = localEntries.concat([...remote.values()]);
    const liked = all.filter(item => item.liked);
    const saved = all.filter(item => item.saved);
    $('#profileMusicLikedCount').textContent = String(liked.length);
    $('#profileMusicSavedCount').textContent = String(saved.length);
    profileGrid.replaceChildren();
    const matches = activeView === 'saved' ? saved : liked;
    if (!matches.length) {
      profileGrid.append(node('p', 'micro-note', activeView === 'saved'
        ? 'Todavía no guardaste canciones. En Radio Nocturna pulsa ☆ Guardar.'
        : 'Todavía no marcaste canciones con Me gusta. Descubre nueva música en Radio Nocturna.'));
      return;
    }
    for (const item of matches) {
      const card = node('article', 'profile-music-card');
      card.append(node('span', 'section-kicker', item.kind === 'remote' ? 'NOCTURNA · COMUNIDAD' : 'NOCTURNA · SESIÓN'));
      card.append(node('h3', '', item.title), node('p', '', item.artist));
      if (item.kind === 'remote') {
        const player = node('audio');
        player.controls = true;
        player.preload = 'none';
        player.src = item.audioUrl;
        player.setAttribute('aria-label', 'Reproducir ' + item.title);
        player.style.width = '100%';
        card.append(player);
      } else {
        const link = node('a', '', '♫ Escuchar en Radio Nocturna ↗');
        link.href = item.href;
        card.append(link);
      }
      card.append(makeActions(item));
      profileGrid.append(card);
    }
    updateControls();
  }

  async function loadRemote() {
    const request = ++remoteRequest;
    const { db, user } = bridge();
    if (!db || !user) { remote.clear(); renderProfile(); return; }
    try {
      const [likesResult, savedResult] = await Promise.all([
        db.from('me_gusta').select('obra_id').eq('usuario_id', user.id).limit(500),
        db.from('favoritos').select('obra_id').eq('usuario_id', user.id).limit(500)
      ]);
      if (likesResult.error || savedResult.error) throw likesResult.error || savedResult.error;
      const liked = new Set((likesResult.data || []).map(row => row.obra_id));
      const saved = new Set((savedResult.data || []).map(row => row.obra_id));
      const ids = [...new Set([...liked, ...saved])];
      const newRemote = new Map();
      if (ids.length) {
        const {data: works, error} = await db.from('obras')
          .select('id,titulo,nombre_autor,audio_path').eq('categoria', 'musica')
          .not('audio_path', 'is', null).in('id', ids).limit(500);
        if (error) throw error;
        for (const work of works || []) {
          const key = `remote:${work.id}`;
          newRemote.set(key, {
            key, id: work.id, title: work.titulo, artist: work.nombre_autor,
            kind: 'remote', liked: liked.has(work.id), saved: saved.has(work.id),
            audioUrl: db.storage.from('obras-audio').getPublicUrl(work.audio_path).data.publicUrl
          });
        }
      }
      if (request !== remoteRequest) return;
      remote.clear();
      for (const [key, item] of newRemote) remote.set(key, item);
      renderProfile();
    } catch (error) { console.error('NOCTURNA saved music:', error); }
  }
  $$('.music-profile-tab').forEach(button => button.addEventListener('click', () => {
    activeView = button.dataset.musicView;
    $$('.music-profile-tab').forEach(tab => {
      tab.classList.toggle('active', tab === button);
      tab.setAttribute('aria-pressed', String(tab === button));
    });
    renderProfile();
  }));
  window.addEventListener('nocturna:music-updated', renderProfile);
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE) return;
    try { stored = JSON.parse(event.newValue || '{}') || {}; }
    catch (_) { stored = {}; }
    renderProfile();
  });
  ['nocturna:connected', 'nocturna:user', 'nocturna:demo', 'nocturna:music-community-updated']
    .forEach(event => window.addEventListener(event, loadRemote));
  renderProfile();
  loadRemote();
})();
