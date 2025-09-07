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
            
            // Extraer peso del texto mostrado como alternativa
            const weightText = weightInfo.textContent.trim();
            const weightMatch = weightText.match(/(\d+\.?\d*)\s*kg/);
            let workingWeight = parseFloat(weightInfo.dataset.weight || 0);
            
            // Si el dataset no tiene el peso correcto, extraerlo del texto
            if ((!workingWeight || workingWeight <= 0) && weightMatch) {
                workingWeight = parseFloat(weightMatch[1]);
            }
            
            // Si aún no tenemos peso, buscar en todo el card
            if (!workingWeight || workingWeight <= 0) {
                const cardText = exerciseCard.textContent;
                const cardMatch = cardText.match(/(\d+\.?\d*)\s*kg/);
                if (cardMatch) {
                    workingWeight = parseFloat(cardMatch[1]);
                }
            }
            
            
            const warmupContainer = exerciseCard.querySelector('.warmup-container');
            
            if (!workingWeight || workingWeight <= 0) {
                alert(`No se puede generar calentamiento sin un peso de trabajo válido. Peso detectado: ${workingWeight}`);
                return;
            }
            
            // Limpiar series de calentamiento existentes
            const existingWarmups = warmupContainer.querySelector('.warmup-series');
            if (existingWarmups) {
                existingWarmups.remove();
            }
            
            // Calcular series de calentamiento (60% y 80% del peso de trabajo)
            // Redondear a múltiplos de 5kg para facilitar la carga de pesos
            const warmup60 = Math.round((workingWeight * 0.6) / 5) * 5; // Redondear a 5kg más cercano
            const warmup80 = Math.round((workingWeight * 0.8) / 5) * 5; // Redondear a 5kg más cercano
            
            console.log('Cálculos:', { workingWeight, warmup60, warmup80 });
            
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
    const setupTestRepsListeners = () => {
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
    };
    
    // Configurar listeners iniciales
    setupTestRepsListeners();

    // ----- CONVERTIR SESIÓN NORMAL A TEST -----
    document.querySelectorAll('.convert-to-test-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ejercicioNombre = this.dataset.ejercicio;
            const exerciseCard = this.closest('.exercise-card');
            
            // Confirmar la conversión
            if (confirm(`¿Estás seguro de convertir "${ejercicioNombre}" a una sesión de TEST al fallo?`)) {
                // Transformar la card a formato TEST
                transformToTestFormat(exerciseCard, ejercicioNombre, true);
            }
        });
    });

    // ----- FUNCIÓN PARA TRANSFORMAR A FORMATO TEST -----
    function transformToTestFormat(exerciseCard, ejercicioNombre, isConverted = false) {
        // Ocultar elementos de sesión normal
        const setsContainer = exerciseCard.querySelector('.sets-container');
        const generateWarmupBtn = exerciseCard.querySelector('.generate-warmup');
        const warmupContainer = exerciseCard.querySelector('.warmup-container');
        const convertBtn = exerciseCard.querySelector('.convert-to-test-btn');
        
        if (setsContainer) setsContainer.style.display = 'none';
        if (generateWarmupBtn) generateWarmupBtn.style.display = 'none';
        if (warmupContainer) warmupContainer.style.display = 'none';
        if (convertBtn) convertBtn.style.display = 'none';
        
        // Guardar información original del badge antes de convertir
        const exerciseBadge = exerciseCard.querySelector('.exercise-badge');
        if (exerciseBadge) {
            // Guardar el texto original del badge si no se ha guardado antes
            if (!exerciseBadge.dataset.originalText) {
                exerciseBadge.dataset.originalText = exerciseBadge.textContent.trim();
                exerciseBadge.dataset.originalClass = exerciseBadge.classList.contains('normal') ? 'normal' : 
                                                      exerciseBadge.classList.contains('test') ? 'test' : 'normal';
            }
            
            // Actualizar a TEST
            exerciseBadge.textContent = 'TEST';
            exerciseBadge.classList.remove('normal');
            exerciseBadge.classList.add('test');
        }
        
        // Marcar como convertido si aplica
        if (isConverted) {
            exerciseCard.classList.add('converted-to-test');
            exerciseCard.dataset.convertedToTest = 'true';
        }
        
        // Crear interfaz de TEST usando el mismo formato que los tests originales
        const testInterface = document.createElement('div');
        testInterface.className = 'test-interface mt-3';
        testInterface.innerHTML = `
            <div class="alert ${isConverted ? 'alert-warning' : 'alert-info'}">
                <i class="fa fa-bolt mr-2"></i>
                <strong>${isConverted ? 'Sesión convertida a TEST' : 'Sesión de TEST'}</strong>
                <p class="mb-0">Realiza 1 serie al fallo con el peso indicado</p>
            </div>
            <div class="test-fields" data-ejercicio="${ejercicioNombre}">
                <div class="form-group">
                    <label>
                        Repeticiones logradas:
                        <i class="fa fa-question-circle tooltip-icon" data-toggle="tooltip" 
                           title="Indica cuántas repeticiones pudiste realizar en tu serie al fallo"></i>
                    </label>
                    <select class="form-control form-control-sm test-reps">
                        ${Array.from({length: 10}, (_, i) => 
                            `<option value="${i+1}" ${i+1 === 5 ? 'selected' : ''}>${i+1}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group mt-1 incremento-peso-container" style="display: none;">
                    <label>
                        Incremento de peso (kg):
                        <i class="fa fa-question-circle tooltip-icon" data-toggle="tooltip" 
                           title="Si lograste 10 repeticiones, puedes incrementar el peso para el próximo ciclo"></i>
                    </label>
                    <select class="form-control form-control-sm test-peso-incremento">
                        <option value="0" selected>Sin cambio</option>
                        <option value="2.5">+2.5 kg</option>
                        <option value="5">+5 kg</option>
                        <option value="7.5">+7.5 kg</option>
                        <option value="10">+10 kg</option>
                    </select>
                </div>
            </div>
        `;
        
        // Insertar la interfaz de TEST después del weight-info
        const weightInfo = exerciseCard.querySelector('.weight-info');
        if (weightInfo) {
            weightInfo.parentNode.insertBefore(testInterface, weightInfo.nextSibling);
        }
        
        // Agregar botón de revertir si es convertido
        if (isConverted) {
            const revertBtn = document.createElement('button');
            revertBtn.className = 'btn btn-sm btn-outline-secondary mt-2 revert-test-btn';
            revertBtn.innerHTML = '<i class="fa fa-undo"></i> Volver a sesión normal';
            revertBtn.addEventListener('click', function() {
                revertToNormalFormat(exerciseCard, ejercicioNombre);
            });
            testInterface.appendChild(revertBtn);
        }
        
        // Configurar listeners
        setupTestRepsListeners();
        
        // Inicializar tooltips
        if (typeof $ !== 'undefined' && typeof $.fn.tooltip !== 'undefined') {
            $('[data-toggle="tooltip"]').tooltip();
        }
    }

    // ----- FUNCIÓN PARA REVERTIR A FORMATO NORMAL -----
    function revertToNormalFormat(exerciseCard, ejercicioNombre) {
        // Mostrar elementos de sesión normal
        const setsContainer = exerciseCard.querySelector('.sets-container');
        const generateWarmupBtn = exerciseCard.querySelector('.generate-warmup');
        const convertBtn = exerciseCard.querySelector('.convert-to-test-btn');
        
        if (setsContainer) setsContainer.style.display = 'block';
        if (generateWarmupBtn) generateWarmupBtn.style.display = 'inline-block';
        if (convertBtn) convertBtn.style.display = 'inline-block';
        
        // Remover interfaz de TEST
        const testInterface = exerciseCard.querySelector('.test-interface');
        if (testInterface) testInterface.remove();
        
        // Restaurar badge original usando datos guardados
        const exerciseBadge = exerciseCard.querySelector('.exercise-badge');
        if (exerciseBadge) {
            // Restaurar texto y clase originales
            if (exerciseBadge.dataset.originalText) {
                exerciseBadge.textContent = exerciseBadge.dataset.originalText;
                exerciseBadge.classList.remove('test');
                exerciseBadge.classList.add(exerciseBadge.dataset.originalClass || 'normal');
                
                // Limpiar datos guardados
                delete exerciseBadge.dataset.originalText;
                delete exerciseBadge.dataset.originalClass;
            } else {
                // Fallback: buscar información de sesión en el contenido
                const sessionInfo = exerciseCard.querySelector('.exercise-content').textContent.match(/Sesión (\d+)/);
                if (sessionInfo) {
                    exerciseBadge.textContent = `Sesión ${sessionInfo[1]}`;
                    exerciseBadge.classList.remove('test');
                    exerciseBadge.classList.add('normal');
                }
            }
        }
        
        // Remover marcadores de conversión
        exerciseCard.classList.remove('converted-to-test');
        exerciseCard.dataset.convertedToTest = 'false';
    }
    
    // ----- BOTÓN PARA AVANZAR AL SIGUIENTE DÍA -----
    const btnAvanzarDia = document.getElementById('btn-avanzar-dia');
    if (btnAvanzarDia) {
        btnAvanzarDia.addEventListener('click', function() {
            // Recopilar ejercicios y su estado de completado o no completado
            const ejerciciosCompletados = [];
            const datosTest = {};
            const sesionesCompletadas = {};
            
            // Verificar ejercicios marcados como completados
            document.querySelectorAll('.ejercicio-checkbox').forEach(checkbox => {
                const ejercicioTexto = checkbox.dataset.ejercicio;
                const ejercicioCard = checkbox.closest('.exercise-card');
                const isConvertedToTest = ejercicioCard && ejercicioCard.dataset.convertedToTest === 'true';
                
                if (checkbox.checked) {
                    ejerciciosCompletados.push(ejercicioTexto);
                }
                
                // Extraer nombre del ejercicio
                const nombreEjercicio = ejercicioTexto.includes(':') ? 
                    ejercicioTexto.split(':')[0].trim() : ejercicioTexto.trim();
                
                // Guardar estado de completado
                sesionesCompletadas[nombreEjercicio] = checkbox.checked;
                
                // Buscar campos de TEST (tanto originales como convertidos)
                let testFields = null;
                if (isConvertedToTest) {
                    // Para ejercicios convertidos, buscar en la interfaz de TEST
                    testFields = ejercicioCard.querySelector('.test-interface .test-fields');
                } else {
                    // Para tests originales, buscar en el área original
                    testFields = ejercicioCard.querySelector('.test-fields');
                }
                
                // Procesar datos de TEST (originales o convertidos)
                if (testFields && checkbox.checked) {
                    const reps = parseInt(testFields.querySelector('.test-reps').value) || 0;
                    const incrementoPeso = parseFloat(testFields.querySelector('.test-peso-incremento').value) || 0;
                    datosTest[nombreEjercicio] = {
                        repeticiones: reps,
                        incrementoPeso: incrementoPeso,
                        convertedToTest: isConvertedToTest
                    };
                } else if (testFields && !checkbox.checked) {
                    // Si es un test no completado 
                    const reps = parseInt(testFields.querySelector('.test-reps').value) || 0;
                    const decrementoPeso = -2.5;
                    datosTest[nombreEjercicio] = {
                        repeticiones: reps,
                        incrementoPeso: decrementoPeso,
                        convertedToTest: isConvertedToTest
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
