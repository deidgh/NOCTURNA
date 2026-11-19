# NOCTURNA — Galería, Radio Nocturna y comunidad creativa

Web estática con **HTML, CSS y JavaScript**, lista para usar en **Cloudflare Pages**. Usa **Supabase** para registro/inicio de sesión, perfiles, fotografías, música subida por usuarios, favoritos y me gusta.

## Qué incluye

- `index.html`: inicio y navegación.
- `explorar.html`: galería de fotografías editoriales y obras de usuarios registrados.
- `musica.html`: **exactamente ocho pistas preinstaladas** en Radio Nocturna, controles para **Me gusta / Guardar**, formulario de **subir música** (archivo y portada) y reproductor de obras que publique la comunidad. No utiliza Spotify.
- `perfil.html`: canciones guardadas o favoritas. Las ocho pistas se guardan en este navegador; las preferencias de música de la comunidad se guardan en Supabase con la cuenta iniciada.
- `fotografia.html`: estudio de edición fotográfica; `laboratorio.html`: herramientas de música y guitarra; `juegos.html`: juegos; `tienda.html`: catálogo orientativo, sin compras reales.
- `supabase/schema.sql`: crea las tablas, políticas de seguridad RLS y buckets `obras-imagenes` y `obras-audio`.
- `config.js`: credenciales **públicas** que necesita el navegador.
- `music-upload.js`: formulario real de publicación y lista de canciones de la comunidad.
- `_headers`: seguridad de la web (incluye Content Security Policy).

## 1. Ejecutarlo en tu computadora

Abre **toda la carpeta** en VS Code. Instala la extensión **Live Server**, abre `index.html` y selecciona **Open with Live Server**. No hace falta instalar Node.js, npm ni un framework.

## 2. Conectar Supabase (necesario para subir canciones)

1. En [supabase.com/dashboard](https://supabase.com/dashboard), crea un proyecto y espera a que termine de configurarse.
2. En el menú **SQL Editor → New query**, abre el archivo `supabase/schema.sql` de este ZIP, copia **todo su contenido** y pulsa **Run**. Esto crea la base de datos, los permisos y los buckets de almacenamiento. **No es necesario crear las tablas o buckets manualmente.**
3. En Supabase abre **Connect** o **Project Settings → API Keys**. Copia el **Project URL** (`https://...supabase.co`) y la clave pública **Publishable key** (`sb_publishable_...`). Puedes usar la vieja `anon key` si tu proyecto aún la tiene, pero se recomienda la publishable key actual.
4. Abre `config.js` en VS Code y colócalos dentro de `window.NOCTURNA_CONFIG`:

   ```js
   window.NOCTURNA_CONFIG = {
     supabaseUrl: 'https://TU-PROYECTO.supabase.co',
     supabaseAnonKey: 'sb_publishable_TU_CLAVE_PUBLICA'
   };
   ```

5. **No pongas** una `secret key`, `service_role`, contraseñas privadas ni claves de administrador en el código. Este es un sitio estático; `config.js` se sirve públicamente, por lo que ahí solo debe ir la clave de uso público. Supabase protege los datos mediante las políticas RLS incluidas.
6. En Supabase entra a **Authentication → Providers / Sign In → Email** y verifica que el acceso por email esté habilitado. Es recomendable exigir confirmación de correo.
7. En **Authentication → URL Configuration** configura la **Site URL** según tu entorno actual (por ejemplo, tu futuro `https://nombre.pages.dev`) y agrega las **Redirect URLs** que necesitas, por ejemplo:

   ```text
   http://127.0.0.1:5500/**
   http://localhost:5500/**
   https://nombre.pages.dev/**
   ```

   El puerto local debe coincidir con el de Live Server. Para producción usa tu URL real, no `nombre.pages.dev`.
8. Vuelve a `index.html` con Live Server. **Crea una cuenta**, inicia sesión y entra a **Música → Subir música**. Completa canción, portada, descripción y permisos; sube un audio de prueba. Comprueba que aparece en **Música → Música de la comunidad** y en la Galería. Las fotos y audios se alojan en Supabase Storage, **no** en GitHub ni en Cloudflare Pages.

**Restricciones**: canción MP3/WAV/OGG/WebM de hasta 15 MB; portada JPG/PNG/WebP de hasta 8 MB; título de 3–80 caracteres, descripción de 10–1000 y texto alternativo de 10–180. Supabase también impone límites en los buckets. Si tu servicio tiene un límite global menor, deberás respetarlo o ajustarlo.

### Seguridad antes de hacerlo público

Con dos cuentas distintas comprueba que ninguna pueda borrar archivos o publicaciones ajenas. Las publicaciones y archivos de la comunidad **son públicos**, incluso si sus autores no están conectados. Para abrirlo a muchos usuarios faltan moderación, reportes operativos, antispam, controles de abuso y política de privacidad. **No** subas música comercial, covers ni portadas sin derechos de distribución.

## 3. Publicar en Cloudflare Pages con GitHub (recomendado)

1. Crea un repositorio en GitHub, por ejemplo `nocturna`, y sube **los archivos que hay dentro de esta carpeta**, no la carpeta como una subcarpeta. En la vista principal del repositorio debe verse `index.html`, junto con `musica.html`, `config.js`, `styles.css`, `assets/`, etc.
2. Antes de subir, asegúrate de que `config.js` tiene únicamente la **URL de Supabase** y la **clave pública**, no secretos. Guarda tus cambios.
3. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages → Create application → Pages → Connect to Git** (el nombre del botón puede variar). Autoriza GitHub y selecciona el repositorio y rama `main`.
4. Configuración de compilación: **Framework preset: None / Sin framework**; **Build command: déjalo en blanco** (o `exit 0` si la interfaz lo exige); **Build output directory: `.`** (directorio raíz); **Root directory:** `/` o vacío si `index.html` está directamente en la raíz del repositorio.
5. Pulsa **Save and Deploy**. Abre `https://NOMBRE-QUE-ELEGISTE.pages.dev`. Comprueba `index.html` y luego `musica.html`.
6. Vuelve a Supabase → **Authentication → URL Configuration** y establece la Site URL de producción y el dominio Pages en Redirect URLs.
7. Cuando edites los archivos y subas cambios a GitHub, Cloudflare generará una nueva versión automáticamente.

**Importante:** La plataforma no necesita variables de entorno para este sitio sin compilación: **lee `config.js` directamente en el navegador**. Poner la URL/clave en *Environment Variables* de Cloudflare, sin cambiar el código, no conectará nada. Si Cloudflare muestra `404` al abrir `/`, casi siempre significa que `index.html` no está en la carpeta publicada o que el directorio de salida se configuró mal.

### Alternativa: subir un ZIP sin GitHub

También puedes crear un proyecto de Pages con **Direct Upload → Drag and drop** y subir este ZIP o la carpeta con `index.html` en la raíz. Para las actualizaciones necesitarás subir nuevos archivos manualmente. La modalidad Direct Upload y la integración con Git se eligen al crear el proyecto y no se cambian de forma directa dentro del mismo proyecto.

## 4. Pruebas antes de compartir el enlace

- Abrir la página principal y `musica.html`; verificar que hay **solo ocho pistas originales/preinstaladas**, no reproductores incrustados de terceros.
- Reproducir y pausar una pista; pulsar **Me gusta** y **Guardar**; comprobar que aparece en **Mi perfil** después de refrescar.
- Crear una cuenta de prueba en Supabase; subir una canción propia con su portada; revisar que aparece en Música de la comunidad y en la Galería.
- Probar las reacciones a una canción de la comunidad; revisar la sección **Mi perfil** con la misma cuenta en otro navegador.
- Repetir con otro usuario para comprobar RLS y que los archivos no pueden borrarse desde una cuenta ajena.
- Verificar la web en el teléfono, incluidos el menú, los formularios y los reproductores.

Las cuatro pistas WAV locales son originales generadas para este proyecto; las otras cuatro pistas OGG enlazadas externamente tienen sus fuentes y licencias en `CREDITOS_Y_LICENCIAS.md`. Algunos archivos externos necesitan internet y dependen del servidor original. No se han realizado pruebas con una instancia **real** de Supabase porque este ZIP no incluye las credenciales de tu proyecto.

Referencias oficiales: [Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys) · [Supabase Storage](https://supabase.com/docs/guides/storage/quickstart) · [Redirecciones de Auth](https://supabase.com/docs/guides/auth/redirect-urls) · [Cloudflare Pages para HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/) · [Cloudflare Pages/Git](https://developers.cloudflare.com/pages/get-started/git-integration/).
