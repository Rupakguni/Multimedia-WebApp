/*!
* Ayuntamientos de Mallorca - Main JavaScript Functions
* Roberto García Martínez & Rupak Guni Thapaliya
* 
* AJAX/Fetch con JSON, gestión de estados y render dinámico
*/

let map; // Variable global para el mapa

// Estado global de la aplicación
const appState = {
    municipalities: [],
    events: [], // Nuevo: Almacén para los eventos del JSON externo
    status: 'idle'
};

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', event => {
    initializeApp();
});

// Main initialization function
async function initializeApp() {
    // Navbar shrink function
    const navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }
    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink, { passive: true });

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    }

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // Listener para el buscador
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filtrarMunicipios();
        });
    }

    // CAMBIO IMPORTANTE: Cargar datos dinámicamente desde JSON
    // Los favoritos se rehidratarán después de que carguen los datos
    await cargarDatosIniciales();
}


async function cargarDatosIniciales() {
    try {
        appState.status = 'loading';
        
        // Cargamos los 3 archivos en paralelo
        const [resMunicipios, resEventos] = await Promise.all([
            fetch('./data/ayuntamiento.json'),
            fetch('./data/eventos.json')
        ]);

        const datosMunicipios = await resMunicipios.json();
        const datosEventos = await resEventos.json();
        // El quiz se gestiona en su propio script, pero lo cargamos aquí para asegurar sincronía
        await cargarPreguntasQuiz(); 

        appState.municipalities = datosMunicipios.municipalities;
        appState.events = datosEventos.events; // Guardamos los eventos por separado
        appState.status = 'success';

        renderizarMunicipios(appState.municipalities);
        generarFiltrosDinamicos();
        rehidratarFavoritos()

        inicializarMapa();
    } catch (error) {
        console.error("Error cargando bases de datos:", error);
        appState.status = 'error';
    }
}

/**
 * Renderizar municipios dinámicamente en el DOM
 * Usa DocumentFragment para una sola inserción en el DOM
 */
function renderizarMunicipios(municipios) {
    const container = document.getElementById('municipalities-container');
    
    if (!container) {
        console.error('Contenedor de municipios no encontrado (ID: municipalities-container)');
        return;
    }

    // Limpiar contenedor
    container.innerHTML = '';

    // Usar DocumentFragment para evitar múltiples reflows
    const fragment = document.createDocumentFragment();

    municipios.forEach(municipio => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-6 col-lg-4 mb-4';

        const card = document.createElement('div');
        card.className = 'card h-100 municipality-card';
        card.setAttribute('data-municipality', municipio.name);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');

        const imageUrl = municipio.imagenes && municipio.imagenes[0] ? municipio.imagenes[0].url : './assets/img/default.jpg'; 

        // Construir el contenido de la tarjeta
        card.innerHTML = `
            <img src="${imageUrl}" class="card-img-top" alt="Imagen de ${municipio.name}" 
                    style="height: 200px; object-fit: cover;">
            <div class="card-body">
                <h5 class="card-title">${municipio.name}</h5>
                <p class="card-text text-muted small">${municipio.description}</p>
                <button class="btn btn-primary btn-sm" 
                        data-bs-toggle="modal" 
                        data-bs-target="#municipalityModal" 
                        onclick="loadMunicipalityDetails('${municipio.name}')">
                    Ver Detalles
                </button>
                <button class="btn btn-outline-primary btn-sm ms-2" 
                        onclick="toggleFavorite('${municipio.name}')" 
                        aria-label="Añadir ${municipio.name} a favoritos">
                    <i class="bi bi-heart"></i>
                </button>
            </div>
        `;

        colDiv.appendChild(card);
        fragment.appendChild(colDiv);
    });

    // Una sola inserción en el DOM
    container.appendChild(fragment);

}

/**
 * Estados de UI - Loading
 */
function mostrarLoadingState() {
    const container = document.getElementById('municipalities-container');
    
    if (!container) return;

    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando municipios...</span>
            </div>
            <p class="mt-3 text-muted">Cargando datos de municipios...</p>
        </div>
    `;
}

/**
 * Estados de UI - Error
 */
function mostrarErrorState(error) {
    const container = document.getElementById('municipalities-container');
    
    if (!container) return;

    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading"><i class="bi bi-exclamation-circle"></i> Error al cargar los datos</h4>
                <p class="mb-2"><strong>Detalles:</strong> ${error.message}</p>
                <hr>
                <p class="mb-0">
                    Por favor, verifica tu conexión a internet e intenta de nuevo.
                    <button class="btn btn-danger btn-sm ms-2" onclick="cargarDatosIniciales()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </p>
            </div>
        </div>
    `;
}

/**
 * Rehidratar favoritos después de renderizar
 */
function rehidratarFavoritos() {
    const favorites = JSON.parse(localStorage.getItem('favoritesMallorca')) || [];
    
    favorites.forEach(favName => {
        const card = document.querySelector(`[data-municipality="${favName}"]`);
        if (card) {
            const btn = card.querySelector('.btn-outline-primary');
            if (btn) {
                btn.classList.add('active');
                btn.style.backgroundColor = 'var(--bs-primary)';
                btn.style.color = 'white';
            }
        }
    });

    updateFavoritesDisplay();
}

/**
 * Filtrar municipios combinando el buscador de texto y los checkboxes de servicios
 */
function filtrarMunicipios() {
    const termino = document.getElementById('search-input').value.toLowerCase();
    const feedback = document.getElementById('search-feedback');
    
    // Obtener valores de todos los checkboxes marcados
    const checkboxes = document.querySelectorAll('.service-filter-check:checked');
    const filtrosActivos = Array.from(checkboxes).map(cb => cb.value);

    const municipiosFiltrados = appState.municipalities.filter(municipio => {
        const coincideNombre = municipio.name.toLowerCase().includes(termino);
        
        // El municipio debe tener TODOS los servicios seleccionados en los filtros
        const tieneServicios = filtrosActivos.every(f => 
            municipio.servicios && municipio.servicios.includes(f)
        );

        return coincideNombre && tieneServicios;
    });

    renderizarMunicipios(municipiosFiltrados);

    // 5. Mostrar mensaje si no hay resultados
    if (municipiosFiltrados.length === 0 && (termino || filtrosActivos.length > 0)) {
        feedback.innerHTML = `
            <div class="alert alert-warning small py-2">
                <i class="bi bi-exclamation-triangle"></i> 
                No hay municipios que coincidan con estos filtros.
            </div>`;
        feedback.classList.remove('d-none');
    } else {
        feedback.classList.add('d-none');
    }
}

// Toggle favorite status
function toggleFavorite(municipalityName) {
    let favorites = JSON.parse(localStorage.getItem('favoritesMallorca')) || [];
    
    if (favorites.includes(municipalityName)) {
        favorites = favorites.filter(name => name !== municipalityName);
    } else {
        favorites.push(municipalityName);
    }
    
    localStorage.setItem('favoritesMallorca', JSON.stringify(favorites));
    
    // Update button state
    const card = document.querySelector(`[data-municipality="${municipalityName}"]`);
    if (card) {
        const btn = card.querySelector('.btn-outline-primary');
        if (favorites.includes(municipalityName)) {
            btn.classList.add('active');
            btn.style.backgroundColor = 'var(--bs-primary)';
            btn.style.color = 'white';
        } else {
            btn.classList.remove('active');
            btn.style.backgroundColor = 'white';
            btn.style.color = 'var(--bs-primary)';
        }
    }
    
    updateFavoritesDisplay();
}

// Toggle favorite from modal — usa data-attribute del modal, no textContent.split()
function toggleFavoriteFromModal() {
    const modal = document.getElementById('municipalityModal');
    const municipalityName = modal.dataset.currentMunicipality;
    if (!municipalityName) return;
    toggleFavorite(municipalityName);

    // Feedback en UI (sin alert bloqueante)
    const btn = document.getElementById('modal-favorite-btn');
    const favorites = JSON.parse(localStorage.getItem('favoritesMallorca')) || [];
    const esFavorito = favorites.includes(municipalityName);
    btn.textContent = esFavorito ? '❤️ En Favoritos' : 'Añadir a Favoritos';
}

/**
 * Actualiza la sección de visualización de favoritos
 * Optimizada para rendimiento eliminando bucles de borrado manual
 */
function updateFavoritesDisplay() {
    const favorites = JSON.parse(localStorage.getItem('favoritesMallorca')) || [];
    const container = document.getElementById('favorites-container');
    
    if (!container) return;
    
    // Si no hay favoritos, mostramos el mensaje inicial y salimos
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="col-lg-10 text-center">
                <p class="text-white-75">Selecciona municipios para añadirlos a tu lista de favoritos</p>
            </div>`;
        return;
    }

    // Generamos el HTML directamente. 
    // Al asignar container.innerHTML, el navegador elimina automáticamente lo anterior.
    const html = favorites.map(name => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card favorite-card favorite-active h-100">
                <div class="card-body text-center d-flex flex-column justify-content-center">
                    <h5 class="card-title">${name}</h5>
                    <button class="btn btn-sm btn-danger mt-2" onclick="removeFavorite('${name}')">
                        <i class="bi bi-heart-fill"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Remove favorite
function removeFavorite(municipalityName) {
    toggleFavorite(municipalityName);
}

/**
 * Cargar detalles del municipio en el modal
 * Busca en los datos cargados desde JSON
 */
/**
 * Cargar detalles del municipio en el modal
 * Busca en los datos cargados desde JSON (Municipios y Eventos separados)
 */
function loadMunicipalityDetails(municipalityName) {
    const municipalityData = getMunicipalityData(municipalityName);
    
    if (!municipalityData) {
        console.warn(`Municipio ${municipalityName} no encontrado`);
        return;
    }

    // Guardar el nombre en el modal para que toggleFavoriteFromModal lo use
    const modal = document.getElementById('municipalityModal');
    modal.dataset.currentMunicipality = municipalityName;

    // Actualizar texto del botón favorito según estado actual
    const favorites = JSON.parse(localStorage.getItem('favoritesMallorca')) || [];
    const btnFav = document.getElementById('modal-favorite-btn');
    btnFav.textContent = favorites.includes(municipalityName) ? '❤️ En Favoritos' : 'Añadir a Favoritos';

    // Actualizar imagen del modal
    const modalImg = document.getElementById('modal-img');
    if (modalImg && municipalityData.imagenes && municipalityData.imagenes[0]) {
        modalImg.src = municipalityData.imagenes[0].url;
        modalImg.alt = municipalityData.name;
    }

    // Rellenar modal con datos básicos
    document.getElementById('modal-title').textContent = municipalityData.name;
    document.getElementById('modal-description').textContent = municipalityData.description;
    
    // Información de contacto formateada
    const contact = `
        <strong>Teléfono:</strong> ${municipalityData.phone}<br>
        <strong>Email:</strong> <a href="mailto:${municipalityData.email}">${municipalityData.email}</a><br>
        <strong>Web:</strong> <a href="${municipalityData.website}" target="_blank" rel="noopener">${municipalityData.website}</a>
    `;
    document.getElementById('modal-contact').innerHTML = contact;
    
    // Información geográfica
    const location = `
        <strong>Coordenadas:</strong> ${municipalityData.latitude}° N, ${municipalityData.longitude}° E<br>
        <strong>Población:</strong> ${municipalityData.population.toLocaleString('es-ES')} habitantes<br>
        <strong>Fundación:</strong> ${municipalityData.founded}
    `;
    document.getElementById('modal-location').innerHTML = location;
    
    // Servicios como badges
    const servicesContainer = document.getElementById('modal-services');
    if (municipalityData.servicios && Array.isArray(municipalityData.servicios)) {
        const badges = municipalityData.servicios
            .map(servicio => `<span class="badge bg-primary me-2">${servicio}</span>`)
            .join('');
        servicesContainer.innerHTML = badges;
    }
    
    /**
     * LÓGICA DE EVENTOS SEPARADOS
     * Filtramos los eventos del appState.events usando el ID del municipio
     */
    const eventosRelacionados = appState.events.filter(e => e.municipalityId === municipalityData.id);
    
    const eventsList = eventosRelacionados.length > 0
        ? '<ul class="small mb-0">' + 
          eventosRelacionados.map(e => `<li><strong>${e.date}:</strong> ${e.name} (${e.type})</li>`).join('') + 
          '</ul>'
        : '<p class="small text-muted mb-0">No hay eventos registrados para este municipio</p>';
    
    document.getElementById('modal-events').innerHTML = eventsList;

    updateWeather(municipalityData.latitude, municipalityData.longitude); // Actualizar clima cada vez que se abre el modal con un municipio diferente
}

/**
 * Obtener datos del municipio desde appState.municipalities
 * Busca por nombre en los datos cargados desde JSON
 */
function getMunicipalityData(municipalityName) {
    return appState.municipalities.find(m => m.name === municipalityName);
}

function generarFiltrosDinamicos() {
    const container = document.getElementById('dynamic-service-filters');
    if (!container) return;

    // 1. Extraer todos los servicios únicos de todos los municipios
    const todosLosServicios = [];
    appState.municipalities.forEach(m => {
        if (m.servicios) {
            m.servicios.forEach(s => {
                if (!todosLosServicios.includes(s)) todosLosServicios.push(s);
            });
        }
    });

    // Ordenar alfabéticamente
    todosLosServicios.sort();

    // 2. Crear el HTML de los checkboxes
    container.innerHTML = ''; // Limpiar mensaje de carga
    todosLosServicios.forEach((servicio, index) => {
        const div = document.createElement('div');
        div.className = 'form-check mb-2';
        div.innerHTML = `
            <input class="form-check-input service-filter-check" type="checkbox" value="${servicio}" id="service-${index}">
            <label class="form-check-label small" for="service-${index}">
                ${servicio}
            </label>
        `;
        container.appendChild(div);
        
        // 3. Añadir el listener a cada nuevo checkbox
        div.querySelector('input').addEventListener('change', filtrarMunicipios);
    });
}

const WEATHER_API_KEY = '9cdd88eda0cd75d0cc6e2c84f9de2c29';

async function updateWeather(lat, lon) {
    const weatherContainer = document.getElementById('modal-weather');
    
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`);
        
        if (!response.ok) throw new Error('Error al conectar con el servicio meteorológico');
        
        const data = await response.json();
        
        // Icono oficial de OpenWeather
        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        
        weatherContainer.innerHTML = `
            <img src="${iconUrl}" alt="${data.weather[0].description}" style="width: 50px;">
            <div class="ms-2">
                <span class="fw-bold fs-5">${Math.round(data.main.temp)}°C</span> - 
                <span class="text-capitalize">${data.weather[0].description}</span><br>
                <small>Humedad: ${data.main.humidity}% | Viento: ${data.wind.speed} m/s</small>
            </div>
        `;
        weatherContainer.className = "alert alert-warning d-flex align-items-center shadow-sm";

    } catch (error) {
        console.error("Weather Error:", error);
        // En lugar de un error crítico, ponemos un mensaje de "próximamente" o lo ocultamos
        weatherContainer.innerHTML = `<i class="bi bi-info-circle me-2"></i> El servicio meteorológico estará disponible en unos minutos.`;
        weatherContainer.className = "alert alert-light border d-flex align-items-center small";
    }
}

function inicializarMapa() {
    // 1. Crear el mapa centrado en Mallorca
    map = L.map('map').setView([39.6, 2.9], 9);

    // 2. Añadir la capa de diseño (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 3. Dibujar los marcadores de los municipios que ya tenemos en appState
    dibujarMarcadores();
}

function dibujarMarcadores() {
    if (!map || appState.municipalities.length === 0) return;

    appState.municipalities.forEach(muni => {
        // Crear el marcador
        const marker = L.marker([muni.latitude, muni.longitude]).addTo(map);
        
        // Añadir popup con botón para abrir el modal
        marker.bindPopup(`
            <div class="text-center">
                <h6 class="mb-1">${muni.name}</h6>
                <button class="btn btn-primary btn-sm mt-1" 
                        data-bs-toggle="modal" 
                        data-bs-target="#municipalityModal" 
                        onclick="loadMunicipalityDetails('${muni.name}')">
                    Ver Detalles
                </button>
            </div>
        `);
    });
}

/**
 * FORMS API — Validación del formulario de contacto
 * Usa Constraint Validation API: checkValidity, reportValidity, setCustomValidity
 * novalidate en el HTML desactiva la UI nativa y la controlamos aquí
 */
(function inicializarFormularioContacto() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const nameEl    = document.getElementById('name');
    const emailEl   = document.getElementById('email');
    const messageEl = document.getElementById('message');
    const feedback  = document.getElementById('form-feedback');

    // Feedback inmediato mientras escribe (input event)
    [nameEl, emailEl, messageEl].forEach(el => {
        el.addEventListener('input', () => {
            // Limpiamos custom validity para que el navegador re-evalúe
            el.setCustomValidity('');
            if (el.validity.valid) {
                el.classList.remove('is-invalid');
                el.classList.add('is-valid');
            } else {
                el.classList.remove('is-valid');
                el.classList.add('is-invalid');
            }
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validación extra: nombre no puede ser solo espacios
        if (nameEl.value.trim().length < 2) {
            nameEl.setCustomValidity('El nombre debe tener al menos 2 caracteres reales.');
        } else {
            nameEl.setCustomValidity('');
        }

        // reportValidity() muestra los mensajes .invalid-feedback y devuelve true/false
        const esValido = form.reportValidity();

        if (!esValido) {
            feedback.textContent = '❌ Por favor, completa todos los campos correctamente.';
            feedback.className = 'alert alert-danger';
            feedback.removeAttribute('hidden');
            feedback.classList.remove('d-none');
            return;
        }

        // Formulario válido — mostrar confirmación en UI
        feedback.textContent = `✅ Mensaje enviado correctamente. Gracias, ${nameEl.value.trim()}.`;
        feedback.className = 'alert alert-success';
        feedback.removeAttribute('hidden');
        feedback.classList.remove('d-none');

        form.reset();
        [nameEl, emailEl, messageEl].forEach(el => el.classList.remove('is-valid', 'is-invalid'));

        // Ocultar feedback tras 5 segundos
        setTimeout(() => {
            feedback.classList.add('d-none');
        }, 5000);
    });
})();
