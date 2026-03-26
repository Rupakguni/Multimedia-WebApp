/*!
* Quiz de Ayuntamientos - Interactivo
* Roberto García Martínez & Rupak Guni Thapaliya
*/

// Estado global del quiz
const quizState = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    answered: false,
    started: false
};

// Generar preguntas dinámicamente basadas en los municipios
function generarPreguntasQuiz() {
    const municipios = appState.municipalities;
    
    if (!municipios || municipios.length === 0) {
        console.warn('No hay municipios cargados para generar preguntas');
        return;
    }

    quizState.questions = [
        {
            question: "¿Cuál es la capital de Mallorca?",
            correct: "Palma",
            options: ["Palma", "Inca", "Alcúdia", "Sóller"],
            category: "Geográfico"
        },
        {
            question: "¿Cuál es el municipio famoso por la industria del cuero?",
            correct: "Inca",
            options: ["Inca", "Manacor", "Llucmajor", "Sóller"],
            category: "Economía"
        },
        {
            question: "¿Cuál es el pueblo de montaña en la Serra de Tramuntana?",
            correct: "Sóller",
            options: ["Manacor", "Sóller", "Alcúdia", "Llucmajor"],
            category: "Geografía"
        },
        {
            question: "¿Cuál es el destino turístico con murallas históricas y playas paradisíacas?",
            correct: "Alcúdia",
            options: ["Palma", "Sóller", "Alcúdia", "Inca"],
            category: "Turismo"
        },
        {
            question: "¿Cuál es el centro económico del este de Mallorca, conocido por industrias artesanales?",
            correct: "Manacor",
            options: ["Llucmajor", "Inca", "Manacor", "Alcúdia"],
            category: "Economía"
        },
        {
            question: "¿Aproximadamente cuánta población tiene Palma?",
            correct: "Más de 400,000 habitantes",
            options: ["Menos de 30,000", "Entre 100,000 y 200,000", "Más de 400,000 habitantes", "Entre 50,000 y 100,000"],
            category: "Población"
        },
        {
            question: "¿En qué municipio encontramos los Jardines de Alfabia?",
            correct: "Sóller",
            options: ["Inca", "Sóller", "Manacor", "Llucmajor"],
            category: "Patrimonio"
        },
        {
            question: "¿Cuál es el municipio histórico con tradiciones culturales profundas?",
            correct: "Llucmajor",
            options: ["Manacor", "Alcúdia", "Llucmajor", "Inca"],
            category: "Cultura"
        },
        {
            question: "¿Cuál es la iglesia más importante de Palma?",
            correct: "Catedral-Basílica de Santa María",
            options: ["Iglesia de Santa María la Mayor", "Catedral-Basílica de Santa María", "Iglesia de San Miguel", "Iglesia Parroquial de Santa María"],
            category: "Patrimonio"
        },
        {
            question: "¿Cuál es el puerto natural más importante de Mallorca?",
            correct: "Puerto de Alcúdia",
            options: ["Puerto de Palma", "Puerto de Sóller", "Puerto de Alcúdia", "Puerto de Manacor"],
            category: "Geografía"
        }
    ];

    // Mezclar opciones de cada pregunta
    quizState.questions.forEach(q => {
        q.options = shuffleArray([...q.options]);
    });

    // Mezclar orden de preguntas
    quizState.questions = shuffleArray(quizState.questions);
}

// Función auxiliar para mezclar arrays
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Iniciar el quiz
function iniciarQuiz() {
    // Generar preguntas si no existen
    if (quizState.questions.length === 0) {
        generarPreguntasQuiz();
    }

    // Validar que hay preguntas
    if (quizState.questions.length === 0) {
        console.error('No se pudieron generar preguntas del quiz');
        // Feedback en UI sin alert bloqueante
        const startSection = document.getElementById('quiz-start');
        if (startSection) {
            const err = document.createElement('p');
            err.className = 'text-danger mt-3';
            err.textContent = 'No se pudieron cargar las preguntas. Por favor, recarga la página.';
            startSection.appendChild(err);
        }
        return;
    }

    quizState.currentQuestion = 0;
    quizState.score = 0;
    quizState.answered = false;
    quizState.started = true;

    // Ocultar pantalla de inicio
    document.getElementById('quiz-start').classList.add('d-none');
    document.getElementById('quiz-content').classList.remove('d-none');
    document.getElementById('quiz-result').classList.add('d-none');

    mostrarPregunta();
}

// Mostrar pregunta actual
function mostrarPregunta() {
    // Validar que hay preguntas
    if (!quizState.questions || quizState.questions.length === 0) {
        console.error('No hay preguntas en quizState');
        return;
    }

    const pregunta = quizState.questions[quizState.currentQuestion];
    
    if (!pregunta) {
        console.error(`Pregunta ${quizState.currentQuestion} no encontrada`);
        return;
    }
    
    // Actualizar número de pregunta
    document.getElementById('question-number').textContent = 
        `Pregunta ${quizState.currentQuestion + 1} de ${quizState.questions.length}`;
    
    // Actualizar barra de progreso
    const progreso = ((quizState.currentQuestion + 1) / quizState.questions.length) * 100;
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = progreso + '%';
    progressBar.setAttribute('aria-valuenow', Math.round(progreso));
    
    // Mostrar pregunta
    document.getElementById('question-text').textContent = pregunta.question;
    
    // Generar opciones
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    pregunta.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-primary btn-lg text-start p-3 option-btn';
        btn.type = 'button'; // evitar submit accidental si hubiera un form padre
        btn.textContent = option;
        btn.setAttribute('aria-label', `Opción ${index + 1}: ${option}`);
        btn.onclick = () => responderPregunta(option);
        optionsContainer.appendChild(btn);
    });
    
    quizState.answered = false;
}

function responderPregunta(respuesta) {
    if (quizState.answered) return;
    
    quizState.answered = true;
    const pregunta = quizState.questions[quizState.currentQuestion];
    const esCorrecta = respuesta === pregunta.correct;
    
    if (esCorrecta) quizState.score++;
    
    // Feedback visual en los botones
    const botones = document.querySelectorAll('.option-btn');
    botones.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === pregunta.correct) {
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-success');
            btn.setAttribute('aria-label', `Respuesta correcta: ${btn.textContent}`);
        } else if (btn.textContent === respuesta && !esCorrecta) {
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-danger');
            btn.setAttribute('aria-label', `Respuesta incorrecta: ${btn.textContent}`);
        }
    });

    // Anuncio accesible del resultado (aria-live)
    let feedbackEl = document.getElementById('quiz-answer-feedback');
    if (!feedbackEl) {
        feedbackEl = document.createElement('p');
        feedbackEl.id = 'quiz-answer-feedback';
        feedbackEl.setAttribute('role', 'status');
        feedbackEl.setAttribute('aria-live', 'polite');
        feedbackEl.className = 'mt-3 fw-bold';
        document.getElementById('options-container').insertAdjacentElement('afterend', feedbackEl);
    }
    feedbackEl.textContent = esCorrecta
        ? '✅ ¡Correcto!'
        : `❌ Incorrecto. La respuesta era: ${pregunta.correct}`;
    feedbackEl.className = `mt-3 fw-bold ${esCorrecta ? 'text-success' : 'text-danger'}`;

    setTimeout(() => { mostrarBotoSiguiente(); }, 800);
}

// Mostrar botón para ir a siguiente pregunta (se añade debajo, no borra las opciones)
function mostrarBotoSiguiente() {
    const optionsContainer = document.getElementById('options-container');

    // Eliminar botón "siguiente" anterior si ya existía (evitar duplicados al reiniciar)
    const btnExistente = document.getElementById('btn-siguiente');
    if (btnExistente) btnExistente.remove();

    const btnSiguiente = document.createElement('button');
    btnSiguiente.id = 'btn-siguiente';
    btnSiguiente.type = 'button';
    btnSiguiente.className = 'btn btn-primary btn-lg w-100 mt-3';

    if (quizState.currentQuestion < quizState.questions.length - 1) {
        btnSiguiente.textContent = 'Siguiente Pregunta →';
        btnSiguiente.onclick = () => {
            quizState.currentQuestion++;
            // Limpiar feedback de respuesta anterior
            const feedbackEl = document.getElementById('quiz-answer-feedback');
            if (feedbackEl) feedbackEl.textContent = '';
            mostrarPregunta();
        };
    } else {
        btnSiguiente.textContent = 'Ver Resultados';
        btnSiguiente.onclick = mostrarResultados;
    }

    // Insertar después del contenedor de opciones
    optionsContainer.insertAdjacentElement('afterend', btnSiguiente);
}

// Mostrar resultados finales
function mostrarResultados() {
    const totalPreguntas = quizState.questions.length;
    const porcentaje = Math.round((quizState.score / totalPreguntas) * 100);
    
    // Ocultar contenido del quiz
    document.getElementById('quiz-content').classList.add('d-none');
    document.getElementById('quiz-result').classList.remove('d-none');
    
    // Mostrar puntuación
    document.getElementById('final-score').textContent = quizState.score;
    
    // Generar mensaje personalizado
    let mensaje = '';
    if (porcentaje === 100) {
        mensaje = '¡Excelente! Eres un experto en los ayuntamientos de Mallorca 🏆';
    } else if (porcentaje >= 80) {
        mensaje = '¡Muy bien! Demuestras grandes conocimientos sobre Mallorca 👏';
    } else if (porcentaje >= 60) {
        mensaje = '¡Buen trabajo! Tienes buenos conocimientos de los municipios 👍';
    } else if (porcentaje >= 40) {
        mensaje = 'No está mal, pero intenta aprender más sobre Mallorca 📚';
    } else {
        mensaje = 'Sigue explorando los ayuntamientos para mejorar tus conocimientos 🔍';
    }
    
    document.getElementById('result-message').textContent = 
        `${mensaje}\nObtuviste ${quizState.score} de ${totalPreguntas} respuestas correctas (${porcentaje}%)`;
}

function reiniciarQuiz() {
    quizState.currentQuestion = 0;
    quizState.score = 0;
    quizState.answered = false;
    quizState.started = false;
    quizState.questions = [];

    // Limpiar elementos residuales del quiz anterior
    const btnSig = document.getElementById('btn-siguiente');
    if (btnSig) btnSig.remove();
    const feedbackEl = document.getElementById('quiz-answer-feedback');
    if (feedbackEl) feedbackEl.remove();

    document.getElementById('quiz-start').classList.remove('d-none');
    document.getElementById('quiz-content').classList.add('d-none');
    document.getElementById('quiz-result').classList.add('d-none');
}

// Generar preguntas cuando los municipios estén cargados
window.addEventListener('quizReady', () => {
    console.log('Evento quizReady disparado. Generando preguntas del quiz...');
    generarPreguntasQuiz();
    console.log(`Quiz preparado con ${quizState.questions.length} preguntas`);
});