/* NOCTURNA — Publicación de música y descubrimiento de obras en Supabase.
   La autorización real y los límites de archivos se imponen en supabase/schema.sql. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const section = $('#musicUploadForm');
  if (!section) return;
  const imageFormats = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const audioFormats = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg', 'audio/webm': 'webm' };
  const MAX_COVER = 8 * 1024 * 1024;
  const MAX_AUDIO = 15 * 1024 * 1024;
  const $status = $('#uploadMusicStatus');
  const $access = $('#uploadMusicAccess');
  const $list = $('#communityMusicGrid');
  const $listStatus = $('#communityMusicStatus');
  const $submit = $('#uploadMusicSubmit');
  const $login = $('#uploadMusicLogin');
  let pending = false;
  let serial = 0;
  let tracks = [];
  let reactions = { liked: new Set(), saved: new Set() };

  function bridge() { return window.NOCTURNA_BRIDGE?.snapshot?.() || {}; }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function message(text, isError = false) {
    $status.textContent = text;
    $status.style.color = isError ? '#ffc5c5' : '';
  }
  function refreshAccess() {
    const {db, user} = bridge();
    if (!db) $access.textContent = 'Para activar las publicaciones, conecta Supabase en config.js y ejecuta el archivo SQL.';
    else if (!user) $access.textContent = 'Inicia sesión o crea una cuenta para poder subir tu música.';
    else $access.textContent = 'Tu cuenta está conectada. Ya puedes publicar tus canciones.';
    $login.hidden = !db || !!user;
  }
  function valid(file, formats, limit, label) {
    if (!file) throw new Error(`Elige un archivo para ${label}.`);
    if (!Object.hasOwn(formats, file.type)) throw new Error(`Formato no admitido para ${label}.`);
    if (file.size <= 0 || file.size > limit) throw new Error(`${label}: tamaño máximo ${Math.round(limit / 1048576)} MB.`);
    return formats[file.type];
  }
  function safeError(error) {
    const msg = String(error?.message || 'Ocurrió un error inesperado.');
    if (/row.level|permission|unauthoriz|policy/i.test(msg)) return 'No tienes permiso para subir estos archivos. Comprueba tu sesión y las políticas SQL de Supabase.';
    if (/fetch|network|Failed to send/i.test(msg)) return 'No se pudo conectar con Supabase. Comprueba tu conexión y la URL del proyecto.';
    if (/payload|too large|size limit|exceeded/i.test(msg)) return 'El archivo supera el límite permitido en Supabase.';
    return msg.slice(0, 250);
  }
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const { db, user } = bridge();
    if (!db) { message('Primero debes conectar Supabase para publicar música.', true); return; }
    if (!user || !user.email_confirmed_at) { message('Inicia sesión y verifica tu correo para publicar música.', true); $('#authBtn')?.click(); return; }
    const title = $('#uploadTrackTitle').value.trim();
    const description = $('#uploadTrackDescription').value.trim();
    const alt = $('#uploadCoverAlt').value.trim();
    const audio = $('#uploadAudio').files?.[0];
    const cover = $('#uploadCover').files?.[0];
    let audioExt, coverExt;
    try {
      audioExt = valid(audio, audioFormats, MAX_AUDIO, 'la canción');
      coverExt = valid(cover, imageFormats, MAX_COVER, 'la portada');
      if (title.length < 3 || title.length > 80 || description.length < 10 || description.length > 1000 || alt.length < 10 || alt.length > 180) throw Error('Completa el título, la descripción y el texto de portada.');
      if (!$('#uploadRights').checked) throw Error('Confirma que tienes permiso para publicar ambos archivos.');
    } catch (error) { message(error.message, true); return; }

    pending = true;
    $submit.disabled = true;
    const imagePath = `${user.id}/${crypto.randomUUID()}.${coverExt}`;
    const audioPath = `${user.id}/${crypto.randomUUID()}.${audioExt}`;
    let coverDone = false;
    let audioDone = false;
    try {
      $submit.textContent = 'Subiendo portada…';
      message('Subiendo archivos. No cierres esta pestaña.');
      const {error: imageError} = await db.storage.from('obras-imagenes').upload(imagePath, cover, {contentType: cover.type, upsert: false});
      if (imageError) throw imageError;
      coverDone = true;
      $submit.textContent = 'Subiendo canción…';
      const {error: audioError} = await db.storage.from('obras-audio').upload(audioPath, audio, {contentType: audio.type, upsert: false});
      if (audioError) throw audioError;
      audioDone = true;
      $submit.textContent = 'Publicando…';
      const artist = String(user.user_metadata?.display_name || 'Artista').trim().slice(0, 32);
      const {error} = await db.from('obras').insert({
        autor_id: user.id,
        nombre_autor: artist.length >= 2 ? artist : 'Artista',
        titulo: title,
        descripcion: description,
        categoria: 'musica',
        texto_alternativo: alt,
        imagen_path: imagePath,
        audio_path: audioPath
      });
      if (error) throw error;
      section.reset();
      message('¡Tu canción se publicó correctamente! Ya aparece en la comunidad y la galería.');
      await loadSongs();
    } catch (error) {
      console.error('NOCTURNA upload:', error);
      message('No se pudo publicar: ' + safeError(error), true);
      // Limpiar archivos huérfanos cuando falla la publicación, sin borrar publicaciones ajenas.
      if (audioDone) await db.storage.from('obras-audio').remove([audioPath]).catch(() => {});
      if (coverDone) await db.storage.from('obras-imagenes').remove([imagePath]).catch(() => {});
    } finally {
      pending = false;
      $submit.disabled = false;
      $submit.textContent = 'Publicar mi música ♫';
    }
  }

  async function loadReactions(db, user, ids) {
    reactions = { liked: new Set(), saved: new Set() };
    if (!user || ids.length === 0) return;
    const [likes, saved] = await Promise.all([
      db.from('me_gusta').select('obra_id').eq('usuario_id', user.id).in('obra_id', ids),
      db.from('favoritos').select('obra_id').eq('usuario_id', user.id).in('obra_id', ids)
    ]);
    if (likes.error || saved.error) throw likes.error || saved.error;
    reactions.liked = new Set((likes.data || []).map(row => row.obra_id));
    reactions.saved = new Set((saved.data || []).map(row => row.obra_id));
  }
  async function toggleReaction(work, field, button, feedback) {
    const {db, user} = bridge();
    if (!user || !db) {
      feedback.textContent = 'Inicia sesión para marcar canciones.';
      $('#authBtn')?.click();
      return;
    }
    const collection = field === 'liked' ? 'me_gusta' : 'favoritos';
    const selected = reactions[field].has(work.id);
    button.disabled = true;
    try {
      const query = selected
        ? db.from(collection).delete().eq('obra_id', work.id).eq('usuario_id', user.id)
        : db.from(collection).insert({obra_id: work.id, usuario_id: user.id});
      const {error} = await query;
      if (error) throw error;
      if (selected) reactions[field].delete(work.id);
      else reactions[field].add(work.id);
      updateReactions();
      feedback.textContent = selected ? 'Quitado de tu colección.' : 'Añadido a tu colección.';
      window.dispatchEvent(new Event('nocturna:music-community-updated'));
    } catch (error) { feedback.textContent = safeError(error); }
    finally { button.disabled = false; }
  }
  function updateReactions() {
    $list.querySelectorAll('article[data-work-id]').forEach(card => {
      for (const kind of ['liked', 'saved']) {
        const button = card.querySelector(`[data-reaction="${kind}"]`);
        const yes = reactions[kind].has(card.dataset.workId);
        button.setAttribute('aria-pressed', String(yes));
        button.textContent = kind === 'liked' ? (yes ? '♥ Te gusta' : '♡ Me gusta') : (yes ? '★ Guardada' : '☆ Guardar');
      }
    });
  }
  function renderSongs(db) {
    $list.replaceChildren();
    const editor=window.NOCTURNA_EDITOR;
    if (!tracks.length) { $listStatus.textContent = 'Todavía no hay canciones publicadas. Comparte la primera.'; return; }
    $listStatus.textContent = `${tracks.length} ${tracks.length === 1 ? 'canción reciente' : 'canciones recientes'} de la comunidad.`;
    for (const work of tracks) {
      const card = node('article', 'community-track');
      card.id = `cancion-${work.id}`;
      card.dataset.workId = work.id;
      const key='community:'+work.id+':';
      const cover = node('img');
      cover.src = db.storage.from('obras-imagenes').getPublicUrl(work.imagen_path).data.publicUrl;
      cover.src = editor?.get(key+'imagen',cover.src) ?? cover.src;
      editor?.field(cover,key+'imagen','image');
      cover.alt = work.texto_alternativo;
      cover.loading = 'lazy';
      cover.addEventListener('error', () => {cover.src = 'assets/sound-study.svg';}, {once: true});
      const name = node('h3', '', editor?.get(key+'titulo',work.titulo) ?? work.titulo);
      editor?.field(name,key+'titulo');
      const artist = node('p', 'community-track-author', 'Por ' + work.nombre_autor);
      const description = node('p','community-desc',editor?.get(key+'descripcion',work.descripcion) ?? work.descripcion);
      editor?.field(description,key+'descripcion');
      const player = node('audio');
      player.controls = true;
      player.preload = 'none';
      player.setAttribute('aria-label', 'Escuchar ' + work.titulo);
      player.src = db.storage.from('obras-audio').getPublicUrl(work.audio_path).data.publicUrl;
      player.src=editor?.get(key+'audio',player.src) ?? player.src;
      const audioEdit=node('span','inline-edit-only','Cambiar audio');
      editor?.field(audioEdit,key+'audio','audio');
      const buttons = node('div', 'music-social-actions');
      const feedback = node('span', 'sr-only');
      feedback.setAttribute('role', 'status');
      for (const [kind, label] of [['liked', '♡ Me gusta'], ['saved', '☆ Guardar']]) {
        const button = node('button', '', label);
        button.type = 'button';
        button.dataset.reaction = kind;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => toggleReaction(work, kind, button, feedback));
        buttons.append(button);
      }
      const link = node('a', '', 'Ver publicación en Galería ↗');
      link.href = `explorar.html?categoria=musica&obra=${encodeURIComponent(work.id)}`;
      card.append(cover, name, artist, description, player, audioEdit, buttons, feedback, link);
      $list.append(card);
    }
    updateReactions();
  }
  async function loadSongs() {
    const number = ++serial;
    const {db, user} = bridge();
    if (!db) {
      tracks = [];
      $list.replaceChildren();
      $listStatus.textContent = 'Conecta Supabase para cargar la música de la comunidad.';
      return;
    }
    $listStatus.textContent = 'Cargando las canciones de la comunidad…';
    try {
      const {data, error} = await db.from('obras')
        .select('id,autor_id,nombre_autor,titulo,descripcion,imagen_path,texto_alternativo,audio_path,creado_en')
        .eq('categoria', 'musica').not('audio_path', 'is', null)
        .order('creado_en', {ascending: false}).limit(12);
      if (error) throw error;
      if (number !== serial) return;
      tracks = data || [];
      await loadReactions(db, user, tracks.map(w => w.id));
      if (number !== serial) return;
      renderSongs(db);
    } catch (error) {
      if (number !== serial) return;
      $listStatus.textContent = 'No se pudieron cargar las canciones. Revisa la conexión y el SQL de Supabase.';
      console.error('NOCTURNA music feed:', error);
    }
  }
  $login.addEventListener('click', () => $('#authBtn')?.click());
  section.addEventListener('submit', submit);
  for (const name of ['nocturna:connected', 'nocturna:user', 'nocturna:demo']) {
    window.addEventListener(name, () => { refreshAccess(); loadSongs(); });
  }
  window.addEventListener('nocturna:edits', event => {
    const {db}=bridge();
    if (db && (!event.detail.key || event.detail.key.startsWith('community:'))) renderSongs(db);
  });
  refreshAccess();
  loadSongs();
})();
