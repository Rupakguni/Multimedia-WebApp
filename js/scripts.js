/*!
* Ayuntamientos de Mallorca - Main JavaScript Functions
* Roberto García Martínez & Rupak Guni Thapaliya
* 
* AJAX/Fetch con JSON, gestión de estados y render dinámico
*/

// Estado global de la aplicación
const appState = {
    municipalities: [],
    loading: false,
    error: null,
    status: 'idle' // idle | loading | success | error
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
    document.addEventListener('scroll', navbarShrink);

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
        searchInput.addEventListener('input', (e) => {
            filtrarMunicipios(e.target.value.toLowerCase());
        });
    }

    // CAMBIO IMPORTANTE: Cargar datos dinámicamente desde JSON
    // Los favoritos se rehidratarán después de que carguen los datos
    await cargarMunicipiosDesdeJSON();
}

/**
 * AJAX/FETCH: Cargar municípios desde el archivo JSON
 * Implementa async/await, try/catch y gestión de estados
 */
async function cargarMunicipiosDesdeJSON() {
    try {
        // Estado: loading
        appState.status = 'loading';
        appState.loading = true;
        mostrarLoadingState();

        // Fetch del JSON con validación HTTP
        const respuesta = await fetch('./data/ayuntamiento.json', {
            headers: { 'Accept': 'application/json' }
        });

        // Validar response.ok (no asumimos 200 automáticamente)
        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status} - ${respuesta.statusText}`);
        }

        // Parsear JSON a objeto JavaScript
        const datos = await respuesta.json();

        // Validación del contrato de datos
        if (!datos.municipalities || !Array.isArray(datos.municipalities)) {
            throw new Error('Formato JSON inválido: se espera un array "municipalities"');
        }

        if (datos.municipalities.length === 0) {
            appState.status = 'empty';
            mostrarEmptyState();
            return;
        }

        // Éxito: guardar datos y renderizar
        appState.municipalities = datos.municipalities;
        appState.status = 'success';
        appState.error = null;

        // Renderizar tarjetas dinámicamente
        renderizarMunicipios(appState.municipalities);

        // Rehidratar favoritos en las tarjetas nuevas
        rehidratarFavoritos();

    } catch (error) {
        // Gestión de errores
        appState.status = 'error';
        appState.loading = false;
        appState.error = error.message;

        console.error('Error al cargar municipios:', error);
        mostrarErrorState(error);
    } finally {
        appState.loading = false;
    }
}

/**
 * Renderizar municipios dinámicamente en el DOM
 * Usa DocumentFragment para una sola inserción en el DOM
 */
function renderizarMunicipios(municipios) {
    const container = document.querySelector('[data-municipalities-container]') 
        || document.querySelector('.col-lg-9 .row');  // Fallback al contenedor de tarjetas
    
    if (!container) {
        console.error('Contenedor de municipios no encontrado');
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

        // Construir el contenido de la tarjeta
        card.innerHTML = `
            <div class="card-body">
                <div class="card-img-placeholder bg-light mb-3"></div>
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

    // Re-asignar listeners (necesario porque se creó nuevo HTML)
    addMunicipalityCardListeners();
}

/**
 * Estados de UI - Loading
 */
function mostrarLoadingState() {
    const container = document.querySelector('[data-municipalities-container]') 
        || document.querySelector('.col-lg-9 .row');
    
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
    const container = document.querySelector('[data-municipalities-container]') 
        || document.querySelector('.col-lg-9 .row');
    
    if (!container) return;

    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading"><i class="bi bi-exclamation-circle"></i> Error al cargar los datos</h4>
                <p class="mb-2"><strong>Detalles:</strong> ${error.message}</p>
                <hr>
                <p class="mb-0">
                    Por favor, verifica tu conexión a internet e intenta de nuevo.
                    <button class="btn btn-danger btn-sm ms-2" onclick="cargarMunicipiosDesdeJSON()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </p>
            </div>
        </div>
    `;
}

/**
 * Estados de UI - Empty
 */
function mostrarEmptyState() {
    const container = document.querySelector('[data-municipalities-container]') 
        || document.querySelector('.col-lg-9 .row');
    
    if (!container) return;

    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
            <p class="text-muted">No hay municipios disponibles en este momento.</p>
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
 * Filtrar municipios por nombre
 */
function filtrarMunicipios(termino) {
    const cards = document.querySelectorAll('.municipality-card');
    const feedback = document.getElementById('search-feedback');
    let encontrados = 0;

    cards.forEach(card => {
        const nombre = card.getAttribute('data-municipality').toLowerCase();
        if (nombre.includes(termino)) {
            card.closest('.col-md-6').style.display = 'block';
            encontrados++;
        } else {
            card.closest('.col-md-6').style.display = 'none';
        }
    });

    // Gestión del mensaje de error explicativo 
    if (encontrados === 0 && termino) {
        feedback.innerHTML = `
            <div class="alert alert-warning small py-2">
                <i class="bi bi-exclamation-triangle"></i> 
                No hay resultados para "<strong>${termino}</strong>". <br>
                <span class="mt-2 d-block">Sugerencia: Intenta buscar municipios como <strong>Palma, Inca o Manacor</strong>.</span>
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

// Toggle favorite from modal
function toggleFavoriteFromModal() {
    const title = document.querySelector('#modal-title').textContent.split(' ')[0];
    toggleFavorite(title);
    alert('Municipio añadido/eliminado de favoritos');
}

// Update favorites display section
function updateFavoritesDisplay() {
    const favorites = JSON.parse(localStorage.getItem('favoritesMallorca')) || [];
    const container = document.getElementById('favorites-container');
    
    if (!container) return;
    
    // Clear existing favorites except the first message
    const existingCards = container.querySelectorAll('.favorite-card');
    existingCards.forEach(card => card.remove());
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="col-lg-10 text-center"><p class="text-white-75">Selecciona municipios para añadirlos a tu lista de favoritos</p></div>';
    } else {
        let html = '';
        favorites.forEach(name => {
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card favorite-card favorite-active">
                        <div class="card-body text-center">
                            <h5 class="card-title">${name}</h5>
                            <button class="btn btn-sm btn-danger" onclick="removeFavorite('${name}')">
                                <i class="bi bi-heart-fill"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
}

// Remove favorite
function removeFavorite(municipalityName) {
    toggleFavorite(municipalityName);
}

/**
 * Cargar detalles del municipio en el modal
 * Busca en los datos cargados desde JSON
 */
function loadMunicipalityDetails(municipalityName) {
    const municipalityData = getMunicipalityData(municipalityName);
    
    if (!municipalityData) {
        console.warn(`Municipio ${municipalityName} no encontrado`);
        return;
    }

    // Rellenar modal con datos del JSON
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
        <strong>Coordinates:</strong> ${municipalityData.latitude}° N, ${municipalityData.longitude}° E<br>
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
    
    // Eventos
    const eventsList = municipalityData.eventos && municipalityData.eventos.length > 0
        ? '<ul class="small mb-0">' + municipalityData.eventos.map(e => `<li>${e}</li>`).join('') + '</ul>'
        : '<p class="small text-muted mb-0">No hay eventos registrados</p>';
    document.getElementById('modal-events').innerHTML = eventsList;
}

/**
 * Obtener datos del municipio desde appState.municipalities
 * Busca por nombre en los datos cargados desde JSON
 */
function getMunicipalityData(municipalityName) {
    return appState.municipalities.find(m => m.name === municipalityName);
}

// Add event listeners to municipality cards for keyboard accessibility
function addMunicipalityCardListeners() {
    const cards = document.querySelectorAll('.municipality-card');
    
    cards.forEach(card => {
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const btn = card.querySelector('.btn-primary');
                if (btn) btn.click();
            }
        });
    });
}
