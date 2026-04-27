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
   * Crea una tarjeta de vídeo individual
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

    // Si es embed (YouTube), mostrar iframe embebido
    if (video.embed && video.youtubeId) {
      html += `
          <div class="video-embed mb-3">
            <div class="youtube-container">
              <iframe 
                width="100%" 
                height="315" 
                src="https://www.youtube.com/embed/${video.youtubeId}" 
                title="${video.titulo}"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                loading="lazy">
              </iframe>
            </div>
          </div>
      `;
    }

    // Botón para acceder al contenido
    html += `
          <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
            <i class="bi bi-box-arrow-up-right"></i> Ver en ${getVideoSource(video.url)}
          </a>
        </div>
      </div>
    `;

    return html;
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
   * Crea una tarjeta de audio individual
   * @param {Object} audio - Objeto audio
   * @param {number} municipalityId - ID del municipio
   * @param {number} index - Índice del audio
   * @returns {string} HTML string
   */
  function createAudioCard(audio, municipalityId, index) {
    const typeIcon = getTypeIcon(audio.tipo);
    const platformBadge = getPlatformBadge(audio.plataforma);

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
          <a href="${audio.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-box-arrow-up-right"></i> Acceder
          </a>
        </div>
      </div>
    `;

    return html;
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

  // Public API
  return {
    render: renderMediaSection,
    renderAll: renderAllMedia
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
