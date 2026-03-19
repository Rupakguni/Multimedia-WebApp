/*!
* Ayuntamientos de Mallorca - Main JavaScript Functions
* Roberto García Martínez & Rupak Guni Thapaliya
*/

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', event => {
    initializeApp();
});

// Main initialization function
function initializeApp() {
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

    addMunicipalityCardListeners();

    // Load favorites from localStorage
    loadFavorites();

    // Add event listeners to municipality cards
    addMunicipalityCardListeners();
}

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
    if (encontrados === 0) {
        feedback.innerHTML = `
            <div class="alert alert-warning small py-2">
                <i class="bi bi-exclamation-triangle"></i> 
                No hay resultados para "<strong>${termino}</strong>". <br>
                <span class="mt-2 d-block">Sugerencia: Intenta buscar municipios de Mallorca como <strong>Palma, Inca o Manacor</strong>.</span>
            </div>`;
        feedback.classList.remove('d-none');
    } else {
        feedback.classList.add('d-none');
    }
}

// Load favorites from localStorage
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favoritesMallorca')) || [];
    console.log('Favoritos cargados:', favorites);
    
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

// Load municipality details into modal
function loadMunicipalityDetails(municipalityName) {
    const municipalityData = getMunicipalityData(municipalityName);
    
    document.getElementById('modal-title').textContent = municipalityData.name;
    document.getElementById('modal-description').textContent = municipalityData.description;
    document.getElementById('modal-contact').textContent = municipalityData.contact;
    document.getElementById('modal-location').textContent = municipalityData.location;
    document.getElementById('modal-events').textContent = municipalityData.events || 'No hay eventos registrados';
}

// Get municipality data
function getMunicipalityData(municipality) {
    const data = {
        'Palma': {
            name: 'Palma',
            description: 'Capital de Mallorca, rica en patrimonio arquitectónico y cultural. Hogar de la majestuosa Catedral-Basílica de Santa María, la Lonja de Palma y el Palacio Real.',
            contact: 'Tel: +34 971 225 900\nEmail: ajuntament@palma.es',
            location: 'Latitud: 39.5696° N\nLongitud: 2.6502° E\nPoblación: ~423,000 habitantes',
            events: 'Festival de San Sebastián, Feria Medieval'
        },
        'Manacor': {
            name: 'Manacor',
            description: 'Centro económico del este de Mallorca, conocido por sus industrias artesanales de perlas y muebles. Ubicado en el Pla de Mallorca.',
            contact: 'Tel: +34 971 553 000\nEmail: info@manacor.es',
            location: 'Latitud: 39.2094° N\nLongitud: 3.2051° E\nPoblación: ~38,000 habitantes',
            events: 'Fiesta de San Jaime, Feria del Mueble'
        },
        'Inca': {
            name: 'Inca',
            description: 'Capital del cuero en Mallorca, famosa por su producción artesanal de marroquinería. Centro industrial importante en Mallorca.',
            contact: 'Tel: +34 971 505 000\nEmail: info@inca.es',
            location: 'Latitud: 39.3006° N\nLongitud: 2.9076° E\nPoblación: ~30,000 habitantes',
            events: 'Dijous Bou (Jueves de Buey), Feria del Calzado'
        },
        'Soller': {
            name: 'Sóller',
            description: 'Pueblo de montaña con arquitectura singular en la Serra de Tramuntana. Localidad costera con vistas espectaculares al mar Mediterráneo.',
            contact: 'Tel: +34 971 638 000\nEmail: info@soller.es',
            location: 'Latitud: 39.7698° N\nLongitud: 2.7293° E\nPoblación: ~13,000 habitantes',
            events: 'Fiesta de la Vila, Festival de Sóller'
        },
        'Alcudia': {
            name: 'Alcúdia',
            description: 'Destino turístico con murallas históricas bien conservadas y playas paradisíacas. Ubicado en el norte de Mallorca en la Bahía de Alcúdia.',
            contact: 'Tel: +34 971 892 000\nEmail: info@alcudia.es',
            location: 'Latitud: 39.8468° N\nLongitud: 3.1130° E\nPoblación: ~20,000 habitantes',
            events: 'Fiesta Mayor, Festival de Mar'
        },
        'Llucmajor': {
            name: 'Llucmajor',
            description: 'Municipio histórico situado en el centro-sur de Mallorca, con tradiciones culturales profundas y patrimonio arquitectónico relevante.',
            contact: 'Tel: +34 971 660 050\nEmail: oacllucmajor@llucmajor.org',
            location: 'Latitud: 39.3631° N\nLongitud: 2.8434° E\nPoblación: ~15,000 habitantes',
            events: 'Feria de Llucmajor, Procesión del Corpus'
        }
    };
    
    return data[municipality] || {
        name: municipality,
        description: 'Información del municipio de ' + municipality,
        contact: 'Información de contacto disponible',
        location: 'Ubicación geográfica disponible'
    };
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
