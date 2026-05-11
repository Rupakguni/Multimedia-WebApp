/**
 * Media Module - Gestiona la visualización de vídeos y audios por municipio
 * Soporta: YouTube embeds, enlaces externos, y playlists
 */

const MediaModule = (() => {
  /**
   * Renderiza la sección de media (vídeos y audios) para un municipio
   * @param {Object} municipality - Objeto municipio con datos de media
   * @param {string} containerId - ID del contenedor donde insertar
   */
  function renderMediaSection(municipality, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !municipality.media) return;

    const mediaHTML = createMediaHTML(municipality);
    container.innerHTML = mediaHTML;
    
    // Inicializar event listeners para embeds interactivos
    initializeMediaListeners(container, municipality);
  }

  /**
   * Crea el HTML para la sección de media
   * @param {Object} municipality
   * @returns {string} HTML string
   */
  function createMediaHTML(municipality) {
    const { name, media } = municipality;
    let html = `
      <section class="media-section" id="media-${municipality.id}">
        <div class="container px-4 px-lg-5">
          <h2 class="text-center mb-5">Contenido Multimedia de ${name}</h2>
          
          <div class="row gx-4 gx-lg-5">
    `;

    // Sección de Vídeos
    if (media.videos && media.videos.length > 0) {
      html += createVideosSection(media.videos, municipality.id);
    }

    // Sección de Audios
    if (media.audios && media.audios.length > 0) {
      html += createAudiosSection(media.audios, municipality.id);
    }

    html += `
          </div>
        </div>
      </section>
    `;

    return html;
  }

  /**
   * Crea la sección de vídeos
   * @param {Array} videos - Array de objetos vídeo
   * @param {number} municipalityId - ID del municipio
   * @returns {string} HTML string
   */
  function createVideosSection(videos, municipalityId) {
    let html = `
      <div class="col-lg-6 mb-5">
        <div class="media-container">
          <h3 class="section-title"><i class="bi bi-play-circle"></i> Vídeos</h3>
          <div class="videos-list">
    `;

    videos.forEach((video, index) => {
      html += createVideoCard(video, municipalityId, index);
    });

    html += `
          </div>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Crea una tarjeta de vídeo individual con soporte HTML5 nativo y múltiples formatos
   * @param {Object} video - Objeto vídeo
   * @param {number} municipalityId - ID del municipio
   * @param {number} index - Índice del vídeo
   * @returns {string} HTML string
   */
  function createVideoCard(video, municipalityId, index) {
    const typeIcon = getTypeIcon(video.tipo);
    const videoId = `video-${municipalityId}-${index}`;

    let html = `
      <div class="video-card mb-4 p-3 border rounded" data-video-id="${video.id}">
        <div class="video-header d-flex align-items-start justify-content-between">
          <div class="flex-grow-1">
            <h5 class="video-title mb-2">
              <i class="bi ${typeIcon}"></i> ${video.titulo}
            </h5>
            <p class="video-description text-muted small mb-3">${video.descripcion}</p>
          </div>
        </div>
        <div class="video-content">
    `;

    // Si es video HTML5 nativo (con archivos locales/externos)
    if (video.videoSources && Array.isArray(video.videoSources) && video.videoSources.length > 0) {
      html += createHTML5VideoElement(video, videoId);
    }
    // Si es embed (YouTube), mostrar iframe responsive
    else if (video.embed && video.youtubeId) {
      html += createResponsiveYoutubeEmbed(video);
    }
    // Si es Vimeo
    else if (video.vimeoId) {
      html += createResponsiveVimeoEmbed(video);
    }

    // Botón para acceder al contenido original
    html += `
          <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary mt-3">
            <i class="bi bi-box-arrow-up-right"></i> Ver en ${getVideoSource(video.url)}
          </a>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Crea un elemento <video> HTML5 nativo con múltiples formatos
   * @param {Object} video - Objeto vídeo
   * @param {string} videoId - ID único del video
   * @returns {string} HTML string
   */
  function createHTML5VideoElement(video, videoId) {
    let html = `
      <div class="video-embed mb-3">
        <video 
          id="${videoId}"
          class="w-100 rounded video-player"
          controls
          preload="metadata"
          playsinline
          ${video.poster ? `poster="${video.poster}"` : ''}
          aria-label="${video.titulo}"
          ${video.autoplay ? 'autoplay' : ''}
          ${video.loop ? 'loop' : ''}
          ${video.muted ? 'muted' : ''}>
    `;

    // Múltiples fuentes para compatibilidad entre navegadores
    video.videoSources.forEach(source => {
      const type = source.type || getVideoMimeType(source.src);
      html += `
          <source src="${source.src}" type="${type}">
      `;
    });

    html += `
          <p>Tu navegador no soporta videos HTML5. 
            <a href="${video.url}" target="_blank" rel="noopener noreferrer">Descargar vídeo</a>
          </p>
        </video>
      </div>
    `;

    return html;
  }

  /**
   * Crea un iframe responsive de YouTube
   * @param {Object} video - Objeto vídeo
   * @returns {string} HTML string
   */
  function createResponsiveYoutubeEmbed(video) {
    return `
      <div class="video-embed mb-3">
        <div class="youtube-container">
          <iframe 
            src="https://www.youtube.com/embed/${video.youtubeId}" 
            title="${video.titulo}"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            loading="lazy"
            aria-label="${video.titulo}">
          </iframe>
        </div>
      </div>
    `;
  }

  /**
   * Crea un iframe responsive de Vimeo
   * @param {Object} video - Objeto vídeo
   * @returns {string} HTML string
   */
  function createResponsiveVimeoEmbed(video) {
    return `
      <div class="video-embed mb-3">
        <div class="vimeo-container">
          <iframe 
            src="https://player.vimeo.com/video/${video.vimeoId}" 
            title="${video.titulo}"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
            loading="lazy"
            aria-label="${video.titulo}">
          </iframe>
        </div>
      </div>
    `;
  }

  /**
   * Obtiene el MIME type basado en la extensión del archivo
   * @param {string} filename - Nombre o URL del archivo
   * @returns {string} MIME type
   */
  function getVideoMimeType(filename) {
    if (filename.includes('.mp4')) return 'video/mp4';
    if (filename.includes('.webm')) return 'video/webm';
    if (filename.includes('.ogv') || filename.includes('.ogg')) return 'video/ogg';
    if (filename.includes('.mov')) return 'video/quicktime';
    return 'video/mp4';
  }

  /**
   * Crea la sección de audios
   * @param {Array} audios - Array de objetos audio
   * @param {number} municipalityId - ID del municipio
   * @returns {string} HTML string
   */
  function createAudiosSection(audios, municipalityId) {
    let html = `
      <div class="col-lg-6 mb-5">
        <div class="media-container">
          <h3 class="section-title"><i class="bi bi-music-note-beamed"></i> Audios y Podcasts</h3>
          <div class="audios-list">
    `;

    audios.forEach((audio, index) => {
      html += createAudioCard(audio, municipalityId, index);
    });

    html += `
          </div>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Crea una tarjeta de audio individual con soporte HTML5 nativo
   * @param {Object} audio - Objeto audio
   * @param {number} municipalityId - ID del municipio
   * @param {number} index - Índice del audio
   * @returns {string} HTML string
   */
  function createAudioCard(audio, municipalityId, index) {
    const typeIcon = getTypeIcon(audio.tipo);
    const platformBadge = getPlatformBadge(audio.plataforma);
    const audioId = `audio-${municipalityId}-${index}`;

    let html = `
      <div class="audio-card mb-4 p-3 border rounded" data-audio-id="${audio.id}">
        <div class="audio-header d-flex align-items-start justify-content-between">
          <div class="flex-grow-1">
            <h5 class="audio-title mb-2">
              <i class="bi ${typeIcon}"></i> ${audio.titulo}
            </h5>
            <p class="audio-description text-muted small mb-3">${audio.descripcion}</p>
            <div class="audio-meta">
              <span class="badge bg-info">${platformBadge}</span>
              <span class="badge bg-secondary">${capitalizeFirst(audio.tipo)}</span>
            </div>
          </div>
        </div>
        <div class="audio-content mt-3">
    `;

    // Si es audio HTML5 nativo (con archivos locales/externos)
    if (audio.audioSources && Array.isArray(audio.audioSources) && audio.audioSources.length > 0) {
      html += createHTML5AudioElement(audio, audioId);
    }
    // Si es enlace a plataforma externa
    else {
      html += `
          <a href="${audio.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-box-arrow-up-right"></i> Acceder
          </a>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Crea un elemento <audio> HTML5 nativo con múltiples formatos
   * @param {Object} audio - Objeto audio
   * @param {string} audioId - ID único del audio
   * @returns {string} HTML string
   */
  function createHTML5AudioElement(audio, audioId) {
    let html = `
      <div class="audio-player-container mb-3">
        <audio 
          id="${audioId}"
          class="w-100 audio-player"
          controls
          preload="metadata"
          aria-label="${audio.titulo}"
          ${audio.autoplay ? 'autoplay' : ''}
          ${audio.loop ? 'loop' : ''}
          ${audio.muted ? 'muted' : ''}>
    `;

    // Múltiples fuentes para compatibilidad entre navegadores
    audio.audioSources.forEach(source => {
      const type = source.type || getAudioMimeType(source.src);
      html += `
          <source src="${source.src}" type="${type}">
      `;
    });

    html += `
          Tu navegador no soporta audios HTML5. 
          <a href="${audio.url}" target="_blank" rel="noopener noreferrer">Descargar audio</a>
        </audio>
      </div>
      <a href="${audio.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary mt-2">
        <i class="bi bi-box-arrow-up-right"></i> Ver en plataforma original
      </a>
    `;

    return html;
  }

  /**
   * Obtiene el MIME type basado en la extensión del archivo de audio
   * @param {string} filename - Nombre o URL del archivo
   * @returns {string} MIME type
   */
  function getAudioMimeType(filename) {
    if (filename.includes('.mp3')) return 'audio/mpeg';
    if (filename.includes('.ogg') || filename.includes('.oga')) return 'audio/ogg';
    if (filename.includes('.wav')) return 'audio/wav';
    if (filename.includes('.webm')) return 'audio/webm';
    if (filename.includes('.m4a') || filename.includes('.aac')) return 'audio/mp4';
    if (filename.includes('.flac')) return 'audio/flac';
    return 'audio/mpeg';
  }

  /**
   * Obtiene el icono Bootstrap para un tipo de contenido
   * @param {string} tipo - Tipo de contenido
   * @returns {string} Clase de icono Bootstrap
   */
  function getTypeIcon(tipo) {
    const iconMap = {
      'canal': 'bi-youtube',
      'documental': 'bi-film',
      'turismo': 'bi-compass',
      'eventos': 'bi-calendar-event',
      'cultura': 'bi-palette',
      'patrimonio': 'bi-building',
      'radio': 'bi-broadcast',
      'podcast': 'bi-mic-fill',
      'actas': 'bi-file-text',
      'plenos': 'bi-megaphone',
      'economia': 'bi-graph-up',
      'tradiciones': 'bi-music-note-beamed',
      'ambiente': 'bi-sound'
    };
    return iconMap[tipo] || 'bi-play-circle';
  }

  /**
   * Obtiene el nombre de la plataforma para mostrar
   * @param {string} plataforma - Identificador de plataforma
   * @returns {string} Nombre de plataforma
   */
  function getPlatformBadge(plataforma) {
    const platformMap = {
      'spotify': 'Spotify',
      'youtube': 'YouTube',
      'ivoox': 'Ivoox',
      'web': 'Web Oficial',
      'freesound': 'FreeSound'
    };
    return platformMap[plataforma] || 'Plataforma Externa';
  }

  /**
   * Obtiene el nombre del sitio desde una URL
   * @param {string} url - URL
   * @returns {string} Nombre del sitio
   */
  function getVideoSource(url) {
    if (url.includes('youtube.com')) return 'YouTube';
    if (url.includes('vimeo.com')) return 'Vimeo';
    return 'Sitio Externo';
  }

  /**
   * Capitaliza la primera letra
   * @param {string} str - String a capitalizar
   * @returns {string} String capitalizado
   */
  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Inicializa event listeners para elementos de media
   * @param {HTMLElement} container - Contenedor
   * @param {Object} municipality - Datos del municipio
   */
  function initializeMediaListeners(container, municipality) {
    // Event delegation para clicks en vídeos/audios
    container.addEventListener('click', (e) => {
      const videoCard = e.target.closest('.video-card');
      const audioCard = e.target.closest('.audio-card');
      
      if (videoCard) {
        const videoId = videoCard.dataset.videoId;
        // Analytics o tracking si es necesario
        console.log('Video clicked:', videoId);
      }
      
      if (audioCard) {
        const audioId = audioCard.dataset.audioId;
        // Analytics o tracking si es necesario
        console.log('Audio clicked:', audioId);
      }
    });
  }

  /**
   * Renderiza media para todos los municipios en una página
   * @param {Array} municipalities - Array de municipios
   */
  function renderAllMedia(municipalities) {
    municipalities.forEach((municipality) => {
      const containerId = `media-container-${municipality.id}`;
      // Solo renderizar si el contenedor existe
      if (document.getElementById(containerId)) {
        renderMediaSection(municipality, containerId);
      }
    });
  }

  /**
   * Crea HTML multimedia para mostrar en el modal del municipio
   * Incluye video/audio HTML5 nativo + YouTube/Vimeo embeds
   * @param {Object} media - Objeto con videos y audios
   * @param {string} municipalityId - ID del municipio para atributos
   * @returns {string} HTML para insertar en modal
   */
  function createModalMediaHTML(media, municipalityId = 0) {
    if (!media) return '';
    
    let html = '';
    
    // Sección de Vídeos
    if (media.videos && media.videos.length > 0) {
      html += '<div class="mb-4">';
      html += '<strong class="d-block mb-3"><i class="bi bi-play-circle"></i> Vídeos:</strong>';
      
      media.videos.forEach((video, index) => {
        const videoId = `modal-video-${municipalityId}-${index}`;
        const typeIcon = getTypeIcon(video.tipo);
        
        html += `<div class="mb-3 p-3 border rounded bg-light">`;
        html += `<h6 class="mb-2"><i class="bi ${typeIcon}"></i> ${video.titulo}</h6>`;
        html += `<p class="small text-muted mb-2">${video.descripcion}</p>`;
        
        // Video HTML5 nativo si tiene videoSources
        if (video.videoSources && Array.isArray(video.videoSources) && video.videoSources.length > 0) {
          html += `<video id="${videoId}" class="w-100 rounded mb-2" style="background: #000; max-height: 300px;" controls preload="metadata" playsinline ${video.poster ? `poster="${video.poster}"` : ''} aria-label="${video.titulo}">`;
          video.videoSources.forEach(source => {
            const type = source.type || getVideoMimeType(source.src);
            html += `<source src="${source.src}" type="${type}">`;
          });
          html += `</video>`;
        }
        // YouTube embed
        else if (video.youtubeId && video.embed) {
          html += `<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; margin-bottom: 8px; border-radius: 6px;">`;
          html += `<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube.com/embed/${video.youtubeId}" title="${video.titulo}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" aria-label="${video.titulo}"></iframe>`;
          html += `</div>`;
        }
        // Vimeo embed
        else if (video.vimeoId && video.embed) {
          html += `<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; margin-bottom: 8px; border-radius: 6px;">`;
          html += `<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://player.vimeo.com/video/${video.vimeoId}" title="${video.titulo}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" aria-label="${video.titulo}"></iframe>`;
          html += `</div>`;
        }
        
        // Botón para ir al original
        html += `<a href="${video.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">`;
        html += `<i class="bi bi-box-arrow-up-right"></i> Ver en ${getVideoSource(video.url)}`;
        html += `</a>`;
        
        html += `</div>`;
      });
      
      html += '</div>';
    }
    
    // Sección de Audios
    if (media.audios && media.audios.length > 0) {
      html += '<div class="mb-4">';
      html += '<strong class="d-block mb-3"><i class="bi bi-music-note-beamed"></i> Audios/Podcasts:</strong>';
      
      media.audios.forEach((audio, index) => {
        const audioId = `modal-audio-${municipalityId}-${index}`;
        const typeIcon = getTypeIcon(audio.tipo);
        const platformBadge = getPlatformBadge(audio.plataforma);
        
        html += `<div class="mb-3 p-3 border rounded bg-light">`;
        html += `<h6 class="mb-2"><i class="bi ${typeIcon}"></i> ${audio.titulo}</h6>`;
        html += `<p class="small text-muted mb-2">${audio.descripcion}</p>`;
        html += `<div class="mb-2"><span class="badge bg-info">${platformBadge}</span> <span class="badge bg-secondary">${capitalizeFirst(audio.tipo)}</span></div>`;
        
        // Audio HTML5 nativo si tiene audioSources
        if (audio.audioSources && Array.isArray(audio.audioSources) && audio.audioSources.length > 0) {
          html += `<div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 8px;">`;
          html += `<audio id="${audioId}" class="w-100" style="height: 40px;" controls preload="metadata" aria-label="${audio.titulo}">`;
          audio.audioSources.forEach(source => {
            const type = source.type || getAudioMimeType(source.src);
            html += `<source src="${source.src}" type="${type}">`;
          });
          html += `</audio>`;
          html += `</div>`;
        }
        
        // Botón para ir al original
        html += `<a href="${audio.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary">`;
        html += `<i class="bi bi-box-arrow-up-right"></i> Acceder a ${platformBadge}`;
        html += `</a>`;
        
        html += `</div>`;
      });
      
      html += '</div>';
    }
    
    return html;
  }

  // Public API
  return {
    render: renderMediaSection,
    renderAll: renderAllMedia,
    createModalMedia: createModalMediaHTML
  };
})();

// Auto-inicialización si el DOM está cargado
document.addEventListener('DOMContentLoaded', () => {
  // Cargar municipios y renderizar media si existe el JSON
  fetch('./data/ayuntamiento.json')
    .then(response => response.json())
    .then(data => {
      // Renderizar automáticamente si hay contenedores media en la página
      const mediaContainers = document.querySelectorAll('[id^="media-container-"]');
      if (mediaContainers.length > 0) {
        MediaModule.renderAll(data.municipalities);
      }
    })
    .catch(error => console.error('Error loading municipalities:', error));
});
