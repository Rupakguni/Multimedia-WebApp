const MediaModule = (() => {
  function renderMediaSection(municipality, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !municipality?.media) {
      return;
    }

    container.replaceChildren(...createMediaSectionNodes(municipality));
  }

  function createMediaSectionNodes(municipality) {
    const section = createElement('section', 'media-section');
    section.id = `media-${municipality.id}`;

    const container = createElement('div', 'container px-4 px-lg-5');
    const title = createElement('h2', 'text-center mb-5');
    title.textContent = `Contenido Multimedia de ${municipality.name}`;

    const row = createElement('div', 'row gx-4 gx-lg-5');
    if (Array.isArray(municipality.media.videos) && municipality.media.videos.length > 0) {
      row.appendChild(createVideosSectionNode(municipality.media.videos, municipality.id));
    }

    if (Array.isArray(municipality.media.audios) && municipality.media.audios.length > 0) {
      row.appendChild(createAudiosSectionNode(municipality.media.audios, municipality.id));
    }

    container.append(title, row);
    section.appendChild(container);
    return [section];
  }

  function createVideosSectionNode(videos, municipalityId) {
    const column = createElement('div', 'col-lg-6 mb-5');
    const wrapper = createElement('div', 'media-container');
    const heading = createElement('h3', 'section-title');
    heading.appendChild(createIcon('bi-play-circle'));
    heading.appendChild(document.createTextNode(' Vídeos'));

    const list = createElement('div', 'videos-list');
    videos.forEach((video, index) => {
      list.appendChild(createVideoCardNode(video, municipalityId, index));
    });

    wrapper.append(heading, list);
    column.appendChild(wrapper);
    return column;
  }

  function createAudiosSectionNode(audios, municipalityId) {
    const column = createElement('div', 'col-lg-6 mb-5');
    const wrapper = createElement('div', 'media-container');
    const heading = createElement('h3', 'section-title');
    heading.appendChild(createIcon('bi-music-note-beamed'));
    heading.appendChild(document.createTextNode(' Audios y Podcasts'));

    const list = createElement('div', 'audios-list');
    audios.forEach((audio, index) => {
      list.appendChild(createAudioCardNode(audio, municipalityId, index));
    });

    wrapper.append(heading, list);
    column.appendChild(wrapper);
    return column;
  }

  function createVideoCardNode(video, municipalityId, index) {
    const card = createElement('div', 'video-card mb-4 p-3 border rounded');
    card.dataset.videoId = video.id;

    const header = createElement('div', 'video-header d-flex align-items-start justify-content-between');
    const content = createElement('div', 'flex-grow-1');

    const title = createElement('h5', 'video-title mb-2');
    title.appendChild(createIcon(getTypeIcon(video.tipo)));
    title.appendChild(document.createTextNode(` ${video.titulo}`));

    const description = createElement('p', 'video-description text-muted small mb-3');
    description.textContent = video.descripcion || '';

    content.append(title, description);
    header.appendChild(content);

    const playerWrapper = createElement('div', 'video-content');
    const videoId = `video-${municipalityId}-${index}`;

    if (Array.isArray(video.videoSources) && video.videoSources.length > 0) {
      playerWrapper.appendChild(createHTML5VideoElement(video, videoId));
    } else if (video.embed && video.youtubeId) {
      playerWrapper.appendChild(createResponsiveYoutubeEmbed(video));
    } else if (video.vimeoId) {
      playerWrapper.appendChild(createResponsiveVimeoEmbed(video));
    }

    const link = createElement('a', 'btn btn-sm btn-primary mt-3');
    link.href = video.url || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.appendChild(createIcon('bi-box-arrow-up-right'));
    link.appendChild(document.createTextNode(` ${i18next.t('media.ver_en')} ${getVideoSource(video.url)}`));

    playerWrapper.appendChild(link);
    card.append(header, playerWrapper);
    return card;
  }

  function createHTML5VideoElement(video, videoId) {
    const wrapper = createElement('div', 'video-embed mb-3');
    const player = document.createElement('video');
    player.id = videoId;
    player.className = 'w-100 rounded video-player';
    player.controls = true;
    player.preload = 'metadata';
    player.playsInline = true;
    player.setAttribute('aria-label', video.titulo);

    if (video.poster) {
      player.poster = video.poster;
    }

    if (video.autoplay) {
      player.autoplay = true;
    }

    if (video.loop) {
      player.loop = true;
    }

    if (video.muted) {
      player.muted = true;
    }

    video.videoSources.forEach((source) => {
      const sourceNode = document.createElement('source');
      sourceNode.src = source.src;
      sourceNode.type = source.type || getVideoMimeType(source.src);
      player.appendChild(sourceNode);
    });

    const fallback = document.createElement('p');
    fallback.textContent = 'Tu navegador no soporta videos HTML5. ';
    const fallbackLink = document.createElement('a');
    fallbackLink.href = video.url || '#';
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.textContent = 'Descargar vídeo';
    fallback.appendChild(fallbackLink);

    wrapper.append(player, fallback);
    return wrapper;
  }

  function createResponsiveYoutubeEmbed(video) {
    const wrapper = createElement('div', 'video-embed mb-3');
    const container = createElement('div', 'youtube-container');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${video.youtubeId}`;
    iframe.title = video.titulo;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.loading = 'lazy';
    iframe.setAttribute('aria-label', video.titulo);

    container.appendChild(iframe);
    wrapper.appendChild(container);
    return wrapper;
  }

  function createResponsiveVimeoEmbed(video) {
    const wrapper = createElement('div', 'video-embed mb-3');
    const container = createElement('div', 'vimeo-container');
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${video.vimeoId}`;
    iframe.title = video.titulo;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.loading = 'lazy';
    iframe.setAttribute('aria-label', video.titulo);

    container.appendChild(iframe);
    wrapper.appendChild(container);
    return wrapper;
  }

  function createAudioCardNode(audio, municipalityId, index) {
    const card = createElement('div', 'audio-card mb-4 p-3 border rounded');
    card.dataset.audioId = audio.id;

    const header = createElement('div', 'audio-header d-flex align-items-start justify-content-between');
    const content = createElement('div', 'flex-grow-1');

    const title = createElement('h5', 'audio-title mb-2');
    title.appendChild(createIcon(getTypeIcon(audio.tipo)));
    title.appendChild(document.createTextNode(` ${audio.titulo}`));

    const description = createElement('p', 'audio-description text-muted small mb-3');
    description.textContent = audio.descripcion || '';

    const meta = createElement('div', 'audio-meta');
    const platformBadge = createElement('span', 'badge bg-info');
    platformBadge.textContent = getPlatformBadge(audio.plataforma);
    const typeBadge = createElement('span', 'badge bg-secondary');
    typeBadge.textContent = capitalizeFirst(audio.tipo);
    meta.append(platformBadge, typeBadge);

    content.append(title, description, meta);
    header.appendChild(content);

    const audioWrapper = createElement('div', 'audio-content mt-3');
    const audioId = `audio-${municipalityId}-${index}`;

    if (Array.isArray(audio.audioSources) && audio.audioSources.length > 0) {
      audioWrapper.appendChild(createHTML5AudioElement(audio, audioId));
    } else {
      const link = createElement('a', 'btn btn-sm btn-outline-primary');
      link.href = audio.url || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(createIcon('bi-box-arrow-up-right'));
      link.appendChild(document.createTextNode(' Acceder'));
      audioWrapper.appendChild(link);
    }

    card.append(header, audioWrapper);
    return card;
  }

  function createHTML5AudioElement(audio, audioId) {
    const wrapper = createElement('div', 'audio-player-container mb-3');
    const player = document.createElement('audio');
    player.id = audioId;
    player.className = 'w-100 audio-player';
    player.controls = true;
    player.preload = 'metadata';
    player.setAttribute('aria-label', audio.titulo);

    if (audio.autoplay) {
      player.autoplay = true;
    }

    if (audio.loop) {
      player.loop = true;
    }

    if (audio.muted) {
      player.muted = true;
    }

    audio.audioSources.forEach((source) => {
      const sourceNode = document.createElement('source');
      sourceNode.src = source.src;
      sourceNode.type = source.type || getAudioMimeType(source.src);
      player.appendChild(sourceNode);
    });

    const fallback = document.createTextNode('Tu navegador no soporta audios HTML5. ');
    const fallbackLink = document.createElement('a');
    fallbackLink.href = audio.url || '#';
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.textContent = 'Descargar audio';

    wrapper.append(player, fallback, fallbackLink);

    const originalLink = createElement('a', 'btn btn-sm btn-outline-primary mt-2');
    originalLink.href = audio.url || '#';
    originalLink.target = '_blank';
    originalLink.rel = 'noopener noreferrer';
    originalLink.appendChild(createIcon('bi-box-arrow-up-right'));
    originalLink.appendChild(document.createTextNode(' Ver en plataforma original'));

    wrapper.appendChild(originalLink);
    return wrapper;
  }

  function createMediaCarouselNode(images, municipalityName, municipalityId) {
    const section = createElement('div', 'modal-media-carousel-wrapper mb-4');
    const heading = createElement('strong', 'd-block mb-3');
    heading.appendChild(createIcon('bi-images'));
    heading.appendChild(document.createTextNode(' Imágenes:'));

    const carousel = createElement('div', 'carousel slide modal-media-carousel');
    carousel.id = `modal-media-carousel-${municipalityId}`;
    carousel.setAttribute('data-bs-ride', 'carousel');

    const indicators = createElement('div', 'carousel-indicators modal-media-indicators');
    const slides = createElement('div', 'carousel-inner rounded modal-media-inner');

    images.forEach((image, index) => {
      const indicator = createElement('button', '');
      indicator.type = 'button';
      indicator.setAttribute('data-bs-target', `#${carousel.id}`);
      indicator.setAttribute('data-bs-slide-to', String(index));
      indicator.setAttribute('aria-label', `Ver imagen ${index + 1}`);
      if (index === 0) {
        indicator.className = 'active';
        indicator.setAttribute('aria-current', 'true');
      }
      indicators.appendChild(indicator);

      const slide = createElement('div', index === 0 ? 'carousel-item active modal-media-item' : 'carousel-item modal-media-item');
      const mediaFrame = createElement('div', 'modal-media-frame');
      mediaFrame.appendChild(createPictureElement(image, municipalityName, image.alt || image.titulo || municipalityName));

      const caption = createElement('div', 'carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded px-3 py-2');
      const captionTitle = createElement('h5', '');
      captionTitle.textContent = image.titulo || `Imagen ${index + 1}`;
      const captionText = createElement('p', 'mb-0 small');
      captionText.textContent = image.descripcion || '';
      caption.append(captionTitle, captionText);

      slide.append(mediaFrame, caption);
      slides.appendChild(slide);
    });

    const prevButton = createElement('button', 'carousel-control-prev');
    prevButton.type = 'button';
    prevButton.setAttribute('data-bs-target', `#${carousel.id}`);
    prevButton.setAttribute('data-bs-slide', 'prev');

    const prevIcon = createElement('span', 'carousel-control-prev-icon');
    prevIcon.setAttribute('aria-hidden', 'true');
    const prevLabel = createElement('span', 'visually-hidden');
    prevLabel.textContent = 'Anterior';
    prevButton.append(prevIcon, prevLabel);

    const nextButton = createElement('button', 'carousel-control-next');
    nextButton.type = 'button';
    nextButton.setAttribute('data-bs-target', `#${carousel.id}`);
    nextButton.setAttribute('data-bs-slide', 'next');

    const nextIcon = createElement('span', 'carousel-control-next-icon');
    nextIcon.setAttribute('aria-hidden', 'true');
    const nextLabel = createElement('span', 'visually-hidden');
    nextLabel.textContent = 'Siguiente';
    nextButton.append(nextIcon, nextLabel);

    carousel.append(indicators, slides, prevButton, nextButton);
    section.append(heading, carousel);
    return section;
  }

  function createPictureElement(image, municipalityName, altText) {
    const basePrefix = municipalityName
      ? `${municipalityName}-${image.imageName || image.id}`
      : image.imageName || image.id;
    const picture = document.createElement('picture');
    picture.className = 'modal-media-picture';

    const avif = document.createElement('source');
    avif.type = 'image/avif';
    avif.srcset = `./assets/img/${basePrefix}-400.avif 400w, ./assets/img/${basePrefix}-800.avif 800w, ./assets/img/${basePrefix}-1280.avif 1280w`;
    avif.sizes = '(max-width: 768px) 100vw, 50vw';

    const webp = document.createElement('source');
    webp.type = 'image/webp';
    webp.srcset = `./assets/img/${basePrefix}-400.webp 400w, ./assets/img/${basePrefix}-800.webp 800w, ./assets/img/${basePrefix}-1280.webp 1280w`;
    webp.sizes = '(max-width: 768px) 100vw, 50vw';

    const img = document.createElement('img');
    img.src = `./assets/img/${basePrefix}-800.jpg`;
    img.srcset = `./assets/img/${basePrefix}-400.jpg 400w, ./assets/img/${basePrefix}-800.jpg 800w, ./assets/img/${basePrefix}-1280.jpg 1280w`;
    img.sizes = '(max-width: 768px) 100vw, 50vw';
    img.alt = altText;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.className = 'modal-media-image';

    picture.append(avif, webp, img);
    return picture;
  }

  function createVideosSectionBlock(videos, municipalityId) {
    const block = createElement('div', 'mb-4');
    const heading = createElement('strong', 'd-block mb-3');
    heading.appendChild(createIcon('bi-play-circle'));
    heading.appendChild(document.createTextNode(' Vídeos:'));
    const list = createElement('div', '');

    videos.forEach((video, index) => {
      list.appendChild(createModalVideoCardNode(video, municipalityId, index));
    });

    block.append(heading, list);
    return block;
  }

  function createModalVideoCardNode(video, municipalityId, index) {
    const card = createElement('div', 'mb-3 p-3 border rounded bg-light');
    const title = createElement('h6', 'mb-2');
    title.appendChild(createIcon(getTypeIcon(video.tipo)));
    title.appendChild(document.createTextNode(` ${video.titulo}`));

    const description = createElement('p', 'small text-muted mb-2');
    description.textContent = video.descripcion || '';

    const player = createElement('div', '');
    const videoId = `modal-video-${municipalityId}-${index}`;

    if (Array.isArray(video.videoSources) && video.videoSources.length > 0) {
      player.appendChild(createHTML5VideoElement(video, videoId));
    } else if (video.embed && video.youtubeId) {
      player.appendChild(createResponsiveYoutubeEmbed(video));
    } else if (video.vimeoId) {
      player.appendChild(createResponsiveVimeoEmbed(video));
    }

    const link = createElement('a', 'btn btn-sm btn-primary');
    link.href = video.url || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.appendChild(createIcon('bi-box-arrow-up-right'));
    link.appendChild(document.createTextNode(` ${i18next.t('media.ver_en')} ${getVideoSource(video.url)}`));

    card.append(title, description, player, link);
    return card;
  }

  function createAudiosSectionBlock(audios, municipalityId) {
    const block = createElement('div', 'mb-4');
    const heading = createElement('strong', 'd-block mb-3');
    heading.appendChild(createIcon('bi-music-note-beamed'));
    heading.appendChild(document.createTextNode(' Audios/Podcasts:'));
    const list = createElement('div', '');

    audios.forEach((audio, index) => {
      list.appendChild(createModalAudioCardNode(audio, municipalityId, index));
    });

    block.append(heading, list);
    return block;
  }

  function createModalAudioCardNode(audio, municipalityId, index) {
    const card = createElement('div', 'mb-3 p-3 border rounded bg-light');
    const title = createElement('h6', 'mb-2');
    title.appendChild(createIcon(getTypeIcon(audio.tipo)));
    title.appendChild(document.createTextNode(` ${audio.titulo}`));

    const description = createElement('p', 'small text-muted mb-2');
    description.textContent = audio.descripcion || '';

    const meta = createElement('div', 'mb-2');
    const platformBadge = createElement('span', 'badge bg-info');
    platformBadge.textContent = getPlatformBadge(audio.plataforma);
    const typeBadge = createElement('span', 'badge bg-secondary');
    typeBadge.textContent = capitalizeFirst(audio.tipo);
    meta.append(platformBadge, typeBadge);

    const audioContainer = createElement('div', '');
    const audioId = `modal-audio-${municipalityId}-${index}`;

    if (Array.isArray(audio.audioSources) && audio.audioSources.length > 0) {
      const playerWrapper = createElement('div', '');
      const player = document.createElement('audio');
      player.id = audioId;
      player.className = 'w-100';
      player.controls = true;
      player.preload = 'metadata';
      player.setAttribute('aria-label', audio.titulo);

      if (audio.autoplay) { player.autoplay = true; }
      if (audio.loop) { player.loop = true; }
      if (audio.muted) { player.muted = true; }

      audio.audioSources.forEach((source) => {
        const sourceNode = document.createElement('source');
        sourceNode.src = source.src;
        sourceNode.type = source.type || getAudioMimeType(source.src);
        player.appendChild(sourceNode);
      });

      playerWrapper.appendChild(player);
      audioContainer.appendChild(playerWrapper);
    }

    const link = createElement('a', 'btn btn-sm btn-outline-primary');
    link.href = audio.url || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.appendChild(createIcon('bi-box-arrow-up-right'));
    link.appendChild(document.createTextNode(` ${i18next.t('media.acceder_a')} ${getPlatformBadge(audio.plataforma)}`));

    card.append(title, description, meta, audioContainer, link);
    return card;
  }

  function createElement(tag, className = '') {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    return element;
  }

  function createIcon(iconClass) {
    const icon = document.createElement('i');
    icon.className = `bi ${iconClass}`;
    return icon;
  }

  function getVideoMimeType(filename) {
    if (filename.includes('.mp4')) { return 'video/mp4'; }
    if (filename.includes('.webm')) { return 'video/webm'; }
    if (filename.includes('.ogv') || filename.includes('.ogg')) { return 'video/ogg'; }
    if (filename.includes('.mov')) { return 'video/quicktime'; }
    return 'video/mp4';
  }

  function getAudioMimeType(filename) {
    if (filename.includes('.mp3')) { return 'audio/mpeg'; }
    if (filename.includes('.ogg') || filename.includes('.oga')) { return 'audio/ogg'; }
    if (filename.includes('.wav')) { return 'audio/wav'; }
    if (filename.includes('.webm')) { return 'audio/webm'; }
    if (filename.includes('.m4a') || filename.includes('.aac')) { return 'audio/mp4'; }
    if (filename.includes('.flac')) { return 'audio/flac'; }
    return 'audio/mpeg';
  }

  function getTypeIcon(tipo) {
    const iconMap = {
      canal: 'bi-youtube',
      documental: 'bi-film',
      turismo: 'bi-compass',
      eventos: 'bi-calendar-event',
      cultura: 'bi-palette',
      patrimonio: 'bi-building',
      radio: 'bi-broadcast',
      podcast: 'bi-mic-fill',
      actas: 'bi-file-text',
      plenos: 'bi-megaphone',
      economia: 'bi-graph-up',
      tradiciones: 'bi-music-note-beamed',
      ambiente: 'bi-sound',
      ayuntamiento: 'bi-building'
    };

    return iconMap[tipo] || 'bi-play-circle';
  }

  function getPlatformBadge(plataforma) {
    const platformMap = {
      spotify: 'Spotify',
      youtube: 'YouTube',
      ivoox: 'Ivoox',
      web: 'Web Oficial',
      freesound: 'FreeSound'
    };

    return platformMap[plataforma] || 'Plataforma Externa';
  }

  function getVideoSource(url) {
    if (url?.includes('youtube.com')) { return 'YouTube'; }
    if (url?.includes('vimeo.com')) { return 'Vimeo'; }
    return 'Sitio Externo';
  }

  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function initializeMediaListeners(container, municipality) {
    container.addEventListener('click', (event) => {
      const videoCard = event.target.closest('.video-card');
      const audioCard = event.target.closest('.audio-card');

      if (videoCard) {
        const videoId = videoCard.dataset.videoId;
        console.log('Video clicked:', videoId);
      }

      if (audioCard) {
        const audioId = audioCard.dataset.audioId;
        console.log('Audio clicked:', audioId);
      }
    });
  }

  function renderAllMedia(municipalities) {
    municipalities.forEach((municipality) => {
      const containerId = `media-container-${municipality.id}`;
      if (document.getElementById(containerId)) {
        renderMediaSection(municipality, containerId);
      }
    });
  }

  function createModalMedia(media, municipalityId = 0) {
    const fragment = document.createDocumentFragment();
    if (!media) {
      return fragment;
    }

    if (Array.isArray(media.images) && media.images.length > 0) {
      fragment.appendChild(createMediaCarouselNode(media.images, media.municipalityName || '', municipalityId));
    }

    if (Array.isArray(media.videos) && media.videos.length > 0) {
      fragment.appendChild(createVideosSectionBlock(media.videos, municipalityId));
    }

    if (Array.isArray(media.audios) && media.audios.length > 0) {
      fragment.appendChild(createAudiosSectionBlock(media.audios, municipalityId));
    }

    return fragment;
  }

  return {
    render: renderMediaSection,
    renderAll: renderAllMedia,
    createModalMedia
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  fetch('./data/ayuntamiento.json')
    .then((response) => response.json())
    .then((data) => {
      const mediaContainers = document.querySelectorAll('[id^="media-container-"]');
      if (mediaContainers.length > 0) {
        MediaModule.renderAll(data.municipalities);
      }
    })
    .catch((error) => console.error('Error loading municipalities:', error));
});