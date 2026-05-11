/**
 * Voice Speech Module - Web Speech API Integration
 * TTS (SpeechSynthesis) y STT (SpeechRecognition)
 * Arquitectura: Voice as enhancement, opt-in, defensive design
 */

// ============================================================================
// FEATURE DETECTION
// ============================================================================

const VoiceFeatures = {
    hasTTS: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    hasSTT: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
};

// ============================================================================
// TTS CONTROLLER - Text-to-Speech
// ============================================================================

const TTSController = (() => {
    let state = {
        speaking: false,
        paused: false,
        currentUtterance: null,
        currentLang: 'es-ES',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
    };

    /**
     * Obtener voces disponibles de forma asíncrona
     * Las voces se cargan de forma diferida en el navegador
     */
    const getVoices = () => {
        return new Promise((resolve) => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                // Escuchar evento voiceschanged si no hay voces disponibles aún
                speechSynthesis.onvoiceschanged = () => {
                    resolve(speechSynthesis.getVoices());
                };
            }
        });
    };

    /**
     * Seleccionar voz con estrategia de fallback
     * Prioridad: voz exacta nube > voz exacta local > idioma fallback > defecto
     */
    const selectVoice = async (lang = 'es-ES') => {
        const voices = await getVoices();
        const voicesArray = Array.from(voices);

        // Estrategia de fallback en cadena
        return (
            voicesArray.find(v => v.lang === lang && !v.localService) ?? // nube exacta
            voicesArray.find(v => v.lang === lang) ?? // local exacta
            voicesArray.find(v => v.lang.startsWith(lang.split('-')[0])) ?? // idioma base
            voicesArray.find(v => v.default) ?? // voz por defecto
            voicesArray[0] // primera disponible
        );
    };

    /**
     * Hablar texto con gestión de cola y configuración
     */
    const speak = async (text, options = {}) => {
        if (!VoiceFeatures.hasTTS) {
            console.warn('TTS no soportado en este navegador');
            return false;
        }

        const { lang = state.currentLang, rate = state.rate, pitch = state.pitch, volume = state.volume } = options;

        // Cancelar síntesis anterior para evitar colas infinitas
        speechSynthesis.cancel();
        state.speaking = false;
        state.paused = false;

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = Math.max(0.1, Math.min(10, rate));
            utterance.pitch = Math.max(0, Math.min(2, pitch));
            utterance.volume = Math.max(0, Math.min(1, volume));

            // Seleccionar voz con estrategia de fallback
            const voice = await selectVoice(lang);
            if (voice) {
                utterance.voice = voice;
            }

            // Gestionar eventos del ciclo de vida
            utterance.onstart = () => {
                state.speaking = true;
                state.paused = false;
                updateTTSUI('speaking');
                dispatchCustomEvent('tts:start', { text });
            };

            utterance.onend = () => {
                state.speaking = false;
                state.paused = false;
                updateTTSUI('stopped');
                dispatchCustomEvent('tts:end', { text });
            };

            utterance.onerror = (event) => {
                console.error('TTS Error:', event.error);
                state.speaking = false;
                state.paused = false;
                updateTTSUI('error');
                dispatchCustomEvent('tts:error', { error: event.error });
            };

            utterance.onpause = () => {
                state.paused = true;
                updateTTSUI('paused');
                dispatchCustomEvent('tts:pause');
            };

            utterance.onresume = () => {
                state.paused = false;
                updateTTSUI('speaking');
                dispatchCustomEvent('tts:resume');
            };

            state.currentUtterance = utterance;
            speechSynthesis.speak(utterance);
            return true;
        } catch (error) {
            console.error('TTS Error:', error);
            return false;
        }
    };

    /**
     * Pausar síntesis actual
     */
    const pause = () => {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            return true;
        }
        return false;
    };

    /**
     * Reanudar síntesis pausada
     */
    const resume = () => {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
            return true;
        }
        return false;
    };

    /**
     * Detener síntesis y limpiar
     */
    const stop = () => {
        speechSynthesis.cancel();
        state.speaking = false;
        state.paused = false;
        updateTTSUI('stopped');
        return true;
    };

    /**
     * Actualizar UI de TTS
     */
    const updateTTSUI = (status) => {
        document.querySelectorAll('[data-tts-status]').forEach(el => {
            el.setAttribute('data-tts-status', status);
        });

        // Actualizar aria-pressed para botones
        document.querySelectorAll('[aria-label*="Leer"]').forEach(btn => {
            btn.setAttribute('aria-pressed', status === 'speaking' ? 'true' : 'false');
        });
    };

    /**
     * Método público para obtener estado actual
     */
    const getState = () => ({ ...state });

    /**
     * Cambiar idioma actual
     */
    const setLanguage = (lang) => {
        state.currentLang = lang;
    };

    // API Pública
    return {
        speak,
        pause,
        resume,
        stop,
        getState,
        setLanguage,
        getVoices,
        selectVoice,
        isSupported: () => VoiceFeatures.hasTTS
    };
})();

// ============================================================================
// STT CONTROLLER - Speech-to-Text
// ============================================================================

const STTController = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    const state = {
        listening: false,
        transcript: '',
        interim: '',
        lang: 'es-ES',
        error: null,
        lastFinalTranscript: '' // Guardar el último resultado final
    };

    let recognition = null;

    /**
     * Inicializar reconocimiento de voz con configuración defensiva
     */
    const init = () => {
        if (!VoiceFeatures.hasSTT) {
            console.warn('STT no soportado en este navegador');
            return false;
        }

        try {
            recognition = new SpeechRecognition();
            recognition.lang = state.lang;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            setupEventHandlers();
            return true;
        } catch (error) {
            console.error('Error inicializando STT:', error);
            return false;
        }
    };

    /**
     * Configurar manejadores de eventos del reconocimiento
     */
    const setupEventHandlers = () => {
        if (!recognition) return;

        recognition.onstart = () => {
            state.listening = true;
            state.error = null;
            updateSTTUI('listening');
            dispatchCustomEvent('stt:start');
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            // Iterar desde resultIndex para obtener solo los nuevos resultados
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                const isFinal = event.results[i].isFinal;

                if (isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            if (interim) {
                state.interim = interim;
                updateSTTUI('interim');
                dispatchCustomEvent('stt:interim', { interim });
            }

            if (final) {
                state.transcript = final.trim();
                state.lastFinalTranscript = final.trim(); // Guardar para usar en onend
                state.interim = '';
                updateSTTUI('final');
                dispatchCustomEvent('stt:final', { transcript: final.trim() });
            }
        };

        recognition.onerror = (event) => {
            state.error = event.error;
            console.error('STT Error:', event.error);

            // no-speech no es un error crítico, solo ignorar
            if (event.error !== 'no-speech') {
                updateSTTUI('error');
                dispatchCustomEvent('stt:error', { error: event.error });
            }
        };

        recognition.onend = () => {
            state.listening = false;
            
            // Si hay transcript guardado, procesar búsqueda AQUÍ cuando termine
            if (state.lastFinalTranscript) {
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = state.lastFinalTranscript;
                    filtrarMunicipios();

                    // Intentar procesar como comando
                    const result = STTController.processCommand(state.lastFinalTranscript);
                    
                    // Si no fue comando, decir "Buscando..."
                    if (!result.matched) {
                        TTSController.speak(`Buscando: ${state.lastFinalTranscript}`, { lang: 'es-ES' });
                    }
                }
                state.lastFinalTranscript = ''; // Limpiar después de procesar
            }
            
            // Si está en modo de escucha continuo y terminó, reiniciar
            if (state._continuous) {
                try {
                    recognition.start();
                } catch (e) {
                    console.warn('No se pudo reiniciar reconocimiento:', e);
                }
            } else {
                updateSTTUI('stopped');
            }
            dispatchCustomEvent('stt:end');
        };
    };

    /**
     * Iniciar escucha
     */
    const start = () => {
        if (!VoiceFeatures.hasSTT) {
            console.warn('STT no soportado');
            return false;
        }

        if (!recognition) {
            init();
        }

        try {
            // Limpiar estado anterior
            state.transcript = '';
            state.interim = '';
            state.error = null;
            state._continuous = true;

            recognition.start();
            return true;
        } catch (error) {
            console.error('Error iniciando STT:', error);
            return false;
        }
    };

    /**
     * Detener escucha
     * stop() espera al resultado final
     */
    const stop = () => {
        if (!recognition) return false;

        try {
            state._continuous = false;
            recognition.stop(); // Espera resultado final
            return true;
        } catch (error) {
            console.error('Error deteniendo STT:', error);
            return false;
        }
    };

    /**
     * Abortar escucha
     * abort() descarta resultados pendientes
     */
    const abort = () => {
        if (!recognition) return false;

        try {
            state._continuous = false;
            recognition.abort(); // Descarta inmediatamente
            state.listening = false;
            updateSTTUI('stopped');
            return true;
        } catch (error) {
            console.error('Error abortando STT:', error);
            return false;
        }
    };

    /**
     * Actualizar UI de STT
     */
    const updateSTTUI = (status) => {
        document.querySelectorAll('[data-stt-status]').forEach(el => {
            el.setAttribute('data-stt-status', status);
        });

        // Actualizar aria-pressed para botón de micrófono
        const micButton = document.getElementById('stt-mic-button');
        if (micButton) {
            micButton.setAttribute('aria-pressed', status === 'listening' ? 'true' : 'false');
        }

        // Actualizar área de feedback
        const feedback = document.getElementById('stt-feedback');
        if (feedback) {
            switch (status) {
                case 'listening':
                    feedback.textContent = '🎤 Escuchando...';
                    feedback.className = 'small text-success';
                    break;
                case 'interim':
                case 'final':
                    feedback.textContent = state.interim || state.transcript;
                    feedback.className = 'small text-primary';
                    break;
                case 'error':
                    feedback.textContent = `⚠️ Error: ${state.error}`;
                    feedback.className = 'small text-danger';
                    break;
                default:
                    feedback.textContent = '';
                    feedback.className = 'small';
            }
        }
    };

    /**
     * Normalizar transcript para comando
     */
    const normalize = (text) => {
        return text
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
            .replace(/[.,:!?;|¿]/g, '') // Eliminar puntuación
            .replace(/\s+/g, ' '); // Colapsar espacios
    };

    /**
     * Similitud difusa (Levenshtein) para comandos
     */
    const levenshtein = (a, b) => {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) =>
            Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
        );
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
        return dp[m][n];
    };

    const similarity = (a, b) => {
        const dist = levenshtein(a, b);
        const maxLen = Math.max(a.length, b.length);
        return maxLen === 0 ? 1 : 1 - dist / maxLen;
    };

    /**
     * Procesar comando por voz
     */
    const processCommand = (transcript) => {
        const normalized = normalize(transcript);

        // Comandos exactos (después de normalización)
        const exactCommands = {
            'parar lectura': () => TTSController.stop(),
            'pausar lectura': () => TTSController.pause(),
            'continuar lectura': () => TTSController.resume(),
            'limpiar filtros': () => clearFilters(),
            'ir arriba': () => window.scrollTo({ top: 0, behavior: 'smooth' }),
            'ir abajo': () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        };

        const exactMatch = exactCommands[normalized];
        if (exactMatch) {
            exactMatch();
            return { matched: true, command: normalized, type: 'exact' };
        }

        // Fuzzy matching para búsqueda de municipios
        const threshold = 0.75;
        const municipalities = appState.municipalities || [];

        let bestMatch = null;
        let bestScore = 0;

        municipalities.forEach(muni => {
            const normalized_name = normalize(muni.name);
            const score = similarity(normalized, normalized_name);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = muni.name;
            }
        });

        if (bestScore >= threshold) {
            // Mostrar detalles del municipio encontrado
            loadMunicipalityDetails(bestMatch);
            return { matched: true, command: bestMatch, type: 'fuzzy', score: bestScore };
        }

        // Si no coincide con nada
        dispatchCustomEvent('stt:nomatch', { transcript });
        return { matched: false };
    };

    /**
     * Método auxiliar para limpiar filtros
     */
    const clearFilters = () => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
            filtrarMunicipios();
        }
    };

    /**
     * Obtener estado actual
     */
    const getState = () => ({ ...state });

    /**
     * Cambiar idioma
     */
    const setLanguage = (lang) => {
        state.lang = lang;
        if (recognition) {
            recognition.lang = lang;
        }
    };

    // API Pública
    return {
        init,
        start,
        stop,
        abort,
        getState,
        setLanguage,
        normalize,
        processCommand,
        isSupported: () => VoiceFeatures.hasSTT
    };
})();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Disparar evento custom para que otros módulos escuchen
 */
function dispatchCustomEvent(eventName, detail = {}) {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
}

/**
 * Inicializar controles de voz en la interfaz
 */
function initializeVoiceControls() {
    // TTS: Inicializar botones de lectura
    if (VoiceFeatures.hasTTS) {
        initializeTTSButtons();
    } else {
        hideTTSControls();
    }

    // STT: Inicializar micrófono
    if (VoiceFeatures.hasSTT) {
        STTController.init();
        initializeSTTButton();
    } else {
        hideSTTControls();
    }

    // Escuchar eventos personalizados
    listenToVoiceEvents();
}

/**
 * Inicializar botones TTS (Leer)
 */
function initializeTTSButtons() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-tts-read]')) {
            const btn = e.target.closest('[data-tts-read]');
            const textToRead = btn.getAttribute('data-tts-read');
            const lang = btn.getAttribute('data-tts-lang') || 'es-ES';

            if (TTSController.getState().speaking) {
                TTSController.stop();
            } else {
                TTSController.speak(textToRead, { lang });
            }
        }
    });
}

/**
 * Inicializar botón STT (Micrófono)
 */
function initializeSTTButton() {
    const micButton = document.getElementById('stt-mic-button');
    if (!micButton) return;

    micButton.addEventListener('click', () => {
        if (STTController.getState().listening) {
            STTController.stop();
        } else {
            STTController.start();
        }
    });

    // La lógica de procesamiento ahora ocurre en STTController.onend
    // cuando el reconocimiento se completa totalmente

    // Escuchar errores de STT
    document.addEventListener('stt:error', (e) => {
        const error = e.detail.error;
        if (error === 'network' || error === 'service-unavailable') {
            TTSController.speak('Error de conexión. Por favor intenta de nuevo.', { lang: 'es-ES' });
        } else if (error === 'permission-denied') {
            TTSController.speak('Permiso de micrófono denegado.', { lang: 'es-ES' });
        }
    });
}

/**
 * Ocultar controles TTS si no está soportado
 */
function hideTTSControls() {
    document.querySelectorAll('[data-tts-read]').forEach(el => {
        el.style.display = 'none';
    });
}

/**
 * Ocultar controles STT si no está soportado
 */
function hideSTTControls() {
    const micButton = document.getElementById('stt-mic-button');
    if (micButton) {
        micButton.style.display = 'none';
    }
}

/**
 * Escuchar eventos de voz y actualizar UI
 */
function listenToVoiceEvents() {
    document.addEventListener('tts:start', () => {
        console.log('TTS iniciado');
    });

    document.addEventListener('tts:end', () => {
        console.log('TTS terminado');
    });

    document.addEventListener('tts:error', (e) => {
        console.error('Error TTS:', e.detail.error);
    });

    document.addEventListener('stt:start', () => {
        console.log('STT iniciado');
    });

    document.addEventListener('stt:final', (e) => {
        console.log('Resultado final STT:', e.detail.transcript);
    });

    document.addEventListener('stt:nomatch', (e) => {
        console.log('No se reconoció comando:', e.detail.transcript);
    });
}

// Exportar para uso global
window.VoiceFeatures = VoiceFeatures;
window.TTSController = TTSController;
window.STTController = STTController;
window.initializeVoiceControls = initializeVoiceControls;
