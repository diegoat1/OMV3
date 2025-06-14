// Funcionalidad para la página de entrenamiento

document.addEventListener('DOMContentLoaded', function() {
    // ----- TIMER DE DESCANSO -----
    let timerInterval;
    let timeLeft = 0;
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('timer-start');
    const resetBtn = document.getElementById('timer-reset');
    const add30sBtn = document.getElementById('timer-add-30s');

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    function startTimer() {
        // Si ya está corriendo, lo detenemos
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            startBtn.textContent = 'Iniciar';
            startBtn.classList.remove('btn-danger');
            startBtn.classList.add('btn-start');
            return;
        }

        // Si no hay tiempo configurado, establecer 60 segundos por defecto
        if (timeLeft === 0) {
            timeLeft = 60; // Descanso predeterminado de 1 minuto
        }

        startBtn.textContent = 'Pausar';
        startBtn.classList.remove('btn-start');
        startBtn.classList.add('btn-danger');

        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                timeLeft = 0;
                
                // Notificación sonora y visual cuando termina el tiempo
                const audio = new Audio('/static/assets/media/timer-end.mp3');
                audio.play().catch(e => console.log('Error al reproducir sonido:', e));
                
                timerDisplay.classList.add('animate-pulse');
                setTimeout(() => timerDisplay.classList.remove('animate-pulse'), 2000);
                
                startBtn.textContent = 'Iniciar';
                startBtn.classList.remove('btn-danger');
                startBtn.classList.add('btn-start');
            }
        }, 1000);
    }

    function resetTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timeLeft = 0;
        updateTimerDisplay();
        startBtn.textContent = 'Iniciar';
        startBtn.classList.remove('btn-danger');
        startBtn.classList.add('btn-start');
    }

    function add30Seconds() {
        timeLeft += 30;
        updateTimerDisplay();
    }

    if (startBtn && resetBtn && add30sBtn) {
        startBtn.addEventListener('click', startTimer);
        resetBtn.addEventListener('click', resetTimer);
        add30sBtn.addEventListener('click', add30Seconds);
        updateTimerDisplay();
    }

    // ----- MANEJO DE SERIES -----
    const setBoxes = document.querySelectorAll('.set-box');
    
    setBoxes.forEach(box => {
        box.addEventListener('click', function() {
            // Si ya está completada, la desactivamos
            if (this.classList.contains('completed')) {
                this.classList.remove('completed');
                return;
            }

            // Si está activa, la marcamos como completada
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                this.classList.add('completed');
                
                // Si era la última serie, preguntamos si quieren iniciar el descanso
                const parentContainer = this.closest('.sets-container');
                const allSetsInExercise = parentContainer.querySelectorAll('.set-box');
                const completedSets = parentContainer.querySelectorAll('.set-box.completed');
                
                if (completedSets.length === allSetsInExercise.length) {
                    // Todas las series completadas
                    const exerciseCard = this.closest('.exercise-card');
                    const exerciseCheckbox = exerciseCard.querySelector('.ejercicio-checkbox');
                    if (exerciseCheckbox) {
                        exerciseCheckbox.checked = true;
                        exerciseCard.classList.add('completed');
                    }
                } else if (!timerInterval && completedSets.length < allSetsInExercise.length) {
                    // Iniciar timer de descanso automáticamente
                    timeLeft = 90;
                    updateTimerDisplay();
                    startTimer();
                    
                    // Marcar como activa la siguiente serie
                    const nextSet = [...allSetsInExercise].find(set => 
                        !set.classList.contains('completed') && !set.classList.contains('active')
                    );
                    if (nextSet) {
                        nextSet.classList.add('active');
                    }
                }
            } else {
                // Si no está activa ni completada, la marcamos como activa
                // Primero quitamos la clase active de todos los sets en este ejercicio
                const parentContainer = this.closest('.sets-container');
                parentContainer.querySelectorAll('.set-box.active').forEach(activeSet => {
                    activeSet.classList.remove('active');
                });
                
                this.classList.add('active');
            }
        });
    });

    // ----- SERIES DE CALENTAMIENTO -----
    const generateWarmupBtn = document.querySelectorAll('.generate-warmup');
    
    generateWarmupBtn.forEach(btn => {
        btn.addEventListener('click', function() {
            const exerciseCard = this.closest('.exercise-card');
            const weightInfo = exerciseCard.querySelector('.weight-info');
            const workingWeight = parseFloat(weightInfo.dataset.weight || 0);
            const warmupContainer = exerciseCard.querySelector('.warmup-container');
            
            if (!workingWeight || workingWeight <= 0) {
                alert('No se puede generar calentamiento sin un peso de trabajo válido');
                return;
            }
            
            // Limpiar series de calentamiento existentes
            const existingWarmups = warmupContainer.querySelector('.warmup-series');
            if (existingWarmups) {
                existingWarmups.remove();
            }
            
            // Calcular series de calentamiento (60% y 80% del peso de trabajo)
            // Redondear a múltiplos de 2.5kg para facilitar la carga de pesos
            const warmup60 = Math.round((workingWeight * 0.6) * 2) / 2; // Redondear a 0.5kg más cercano
            const warmup80 = Math.round((workingWeight * 0.8) * 2) / 2; // Redondear a 0.5kg más cercano
            
            // Crear el contenedor para las series de calentamiento
            const warmupSeries = document.createElement('div');
            warmupSeries.className = 'warmup-series';
            
            // HTML para las series de calentamiento
            warmupSeries.innerHTML = `
                <div class="warmup-title">
                    <i class="fa fa-fire warmup-icon"></i>
                    Series de calentamiento
                    <i class="fa fa-question-circle tooltip-icon" data-toggle="tooltip" 
                       title="Realiza estas series de calentamiento antes de las series principales para preparar los músculos"></i>
                </div>
                <div class="warmup-sets">
                    <div class="warmup-set">
                        <input type="checkbox" class="warmup-checkbox">
                        <span>10 reps con ${warmup60}kg (60%)</span>
                    </div>
                    <div class="warmup-set">
                        <input type="checkbox" class="warmup-checkbox">
                        <span>8 reps con ${warmup80}kg (80%)</span>
                    </div>
                </div>
            `;
            
            // Añadir las series al contenedor
            warmupContainer.appendChild(warmupSeries);
            warmupContainer.style.display = 'block';
            
            // Inicializar tooltips
            if (typeof $ !== 'undefined' && typeof $.fn.tooltip !== 'undefined') {
                $('[data-toggle="tooltip"]').tooltip();
            }
            
            // Configurar los checkboxes de calentamiento
            warmupContainer.querySelectorAll('.warmup-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const warmupSet = this.closest('.warmup-set');
                    if (this.checked) {
                        warmupSet.style.textDecoration = 'line-through';
                        warmupSet.style.opacity = '0.7';
                    } else {
                        warmupSet.style.textDecoration = 'none';
                        warmupSet.style.opacity = '1';
                    }
                });
            });
            
            // Ocultar el botón después de generar las series
            this.style.display = 'none';
        });
    });

    // ----- CONTROLAR VISIBILIDAD DEL SELECTOR DE INCREMENTO DE PESO -----
    document.querySelectorAll('.test-reps').forEach(select => {
        const actualizarVisibilidadIncremento = () => {
            const repeticiones = parseInt(select.value);
            const contenedorIncremento = select.closest('.test-fields').querySelector('.incremento-peso-container');
            
            if (repeticiones === 10) {
                contenedorIncremento.style.display = 'block';
            } else {
                contenedorIncremento.style.display = 'none';
            }
        };
        
        // Verificar estado inicial
        actualizarVisibilidadIncremento();
        
        // Escuchar cambios en el selector de repeticiones
        select.addEventListener('change', actualizarVisibilidadIncremento);
    });
    
    // ----- BOTÓN PARA AVANZAR AL SIGUIENTE DÍA -----
    const btnAvanzarDia = document.getElementById('btn-avanzar-dia');
    if (btnAvanzarDia) {
        btnAvanzarDia.addEventListener('click', function() {
            // Recopilar ejercicios y su estado de completado o no completado
            const ejerciciosCompletados = [];
            const datosTest = {};
            const sesionesCompletadas = {};
            
            // Recopilar todos los ejercicios
            document.querySelectorAll('.ejercicio-checkbox').forEach(checkbox => {
                const ejercicio = checkbox.dataset.ejercicio;
                const nombreEjercicio = ejercicio.split(':')[0].trim();
                
                // Añadir todos los ejercicios al array
                ejerciciosCompletados.push(ejercicio);
                
                // Guardar si fue completado o no
                sesionesCompletadas[nombreEjercicio] = checkbox.checked;
                
                // Buscar campos de TEST asociados
                const testFields = document.querySelector(`.test-fields[data-ejercicio="${nombreEjercicio}"]`);
                
                // Solo procesar datos de TEST si el ejercicio fue completado
                if (testFields && checkbox.checked) {
                    const reps = parseInt(testFields.querySelector('.test-reps').value) || 0;
                    const incrementoPeso = parseFloat(testFields.querySelector('.test-peso-incremento').value) || 0;
                    datosTest[nombreEjercicio] = {
                        repeticiones: reps,
                        incrementoPeso: incrementoPeso
                    };
                } else if (testFields && !checkbox.checked) {
                    // Si es un test no completado 
                    const reps = parseInt(testFields.querySelector('.test-reps').value) || 0;
                    const decrementoPeso = -2.5; // Valor por defecto
                    datosTest[nombreEjercicio] = {
                        repeticiones: reps,
                        incrementoPeso: decrementoPeso 
                    };
                }
            });
            
            // Mostrar confirmación antes de avanzar
            if (confirm("¿Confirmas que deseas completar este entrenamiento y avanzar al siguiente día?")) {
                // Siempre enviamos los ejercicios y su estado
                if (ejerciciosCompletados.length > 0) {
                    // Mostrar indicador de carga
                    btnAvanzarDia.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Procesando...';
                    btnAvanzarDia.disabled = true;
                    
                    fetch('/registrar_sesion', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        },
                        body: JSON.stringify({
                            ejercicios: ejerciciosCompletados,
                            datosTest: datosTest,
                            sesionesCompletadas: sesionesCompletadas
                        })
                    })
                    .then(() => {
                        // Luego de registrar la sesión, avanzar al día siguiente
                        avanzarAlDiaSiguiente();
                    })
                    .catch(error => {
                        console.error('Error al registrar sesión:', error);
                        alert('Error al registrar la sesión, pero intentaremos avanzar al siguiente día.');
                        avanzarAlDiaSiguiente(); // Avanzar de todos modos
                    });
                } else {
                    // Si no hay ejercicios, simplemente avanzar al siguiente día
                    avanzarAlDiaSiguiente();
                }
            }
            
            function avanzarAlDiaSiguiente() {
                // Enviar solicitud al servidor para avanzar día
                fetch('/avanzar_dia', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({})
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Recargar la página sin mostrar alerta
                        window.location.reload();
                    } else {
                        console.error('Error al avanzar día:', data.message);
                        alert('Error al avanzar al siguiente día: ' + data.message);
                        window.location.reload(); // Recargar de todas formas
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al comunicarse con el servidor.');
                    window.location.reload(); // Recargar de todas formas
                });
            }
        });
    }

    // Inicializar todos los tooltips
    if (typeof $ !== 'undefined' && typeof $.fn.tooltip !== 'undefined') {
        $('[data-toggle="tooltip"]').tooltip();
    }
});
