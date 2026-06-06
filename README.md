# Multimedia-WebApp: Ajuntaments Mallorca 🏛️

Este proyecto consiste en una plataforma web progresiva (PWA) e interactiva dedicada a la gestión, consulta y promoción de la información de los municipios de Mallorca. Desarrollada de forma nativa e integrada con múltiples APIs y optimizaciones avanzadas, la aplicación ofrece una experiencia de usuario fluida, accesible y de alto rendimiento.

## 👥 Autores y Repositorio
* **Rupak Guni Thapaliya**
* **Roberto Garcia Martinez**
* **Repositorio:** [github.com/Rupakguni/Multimedia-WebApp](https://github.com/Rupakguni/Multimedia-WebApp)
* **URL Pública:** [ayuntamientosmallorca.online](https://www.ayuntamientosmallorca.online/)

---

## 🚀 Características Principales y Funcionalidades

### 1. Optimización Avanzada y Rendimiento (Lighthouse 100/100)
* **Puntuación Excelente:** Alcanza un **100/100 en Escritorio** y entre **90-96 en Móvil** en las auditorías de Lighthouse.
* **Critical Path Optimization:** Inyección diferida del script de Google Identity y extracción de CSS crítico *inline* en el `<head>` para eliminar el bloqueo de renderizado.
* **Carga Eficiente de Imágenes:** Conversión por lotes a formatos modernos (`AVIF` y `WebP`) mediante ImageMagick, uso de `srcset` para variantes móviles ligeras, atributos `loading="lazy"` y prioridad `fetchpriority="high"` en el elemento LCP.

### 2. Capa de Datos y Gestión de Caché Multi-nivel
* **Carga Paralela y Fallback:** Implementación de `Promise.all` con `async/await` para descargar simultáneamente el JSON de municipios (propio) y el de eventos (externo de *fiestasmallorca.online*), integrando un bloque `.catch()` de respaldo local ante fallos de red.
* **Control de Caché Anti-Bucle:** Estrategia *network-first* corregida en el Service Worker mediante `{ cache: "no-cache" }` combinada con reglas estrictas en el `.htaccess` para asegurar la actualización en tiempo real de los ficheros JSON sin afectar los recursos estáticos.
* **Estructura Semántica:** Datos estructurados alineados con el vocabulario semántico de `schema.org` (JSON-LD validado para WebPage, Organization y GovernmentOrganization).

### 3. Integración de APIs (Nativas y Externas)
* **Web Speech API:** Módulo `STTController` encapsulado en una IIFE que ofrece control por voz (búsqueda y filtrado de municipios) utilizando tolerancia a fallos mediante el cálculo de distancia de similitud (algoritmo de Levenshtein con umbral de 0.6).
* **APIs de Terceros Funcionales:** Autenticación segura mediante *Google Identity Services*, mapas interactivos mediante *Leaflet/OpenStreetMap*, datos meteorológicos con *OpenWeatherMap*, persistencia de favoritos con *Web Storage*, y envío de formularios por *Formspree*.

### 4. PWA (Progressive Web App) y Accesibilidad
* **Soporte Offline:** Service Worker con estrategias *cache-first* para recursos estructurales y renderizado automático de una vista personalizada `offline.html` en ausencia de conexión.
* **Accesibilidad Total:** Navegación por teclado garantizada con foco visible en elementos interactivos, enlaces de salto (*skip-links*), y uso exhaustivo de atributos `aria-label`, `aria-pressed` y `aria-live` para lectores de pantalla.

---

## 🛠️ Tecnologías y Librerías Utilizadas
* **Lenguajes nativos:** HTML5 Semántico, CSS3 y JavaScript Moderno (ES6+ Módulos).
* **Maquetación UI:** Bootstrap con el tema *Start Bootstrap Creative*.
* **Internacionalización:** `i18next` junto con `i18next-http-backend` para traducción dinámica bajo demanda en tres idiomas (ES / CA / EN) sin recargar la página.
* **Control de calidad:** Análisis estático con **ESLint** (0 errores) y validación estructural con **JSONLint**.