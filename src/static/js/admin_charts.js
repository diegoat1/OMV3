function initializeAdminCharts(rawStrengthDataItems, rawMuscleGroupDataItems, chartIdPrefix, collapseSelector) {
    // console.log('Initializing Admin Charts - Version depuración');
    // console.log('Raw Strength Data:', rawStrengthDataItems);
    // console.log('Raw Muscle Group Data:', rawMuscleGroupDataItems);
    // console.log('Chart ID Prefix:', chartIdPrefix);
    // console.log('Collapse Selector:', collapseSelector);

    if (typeof ApexCharts === 'undefined') {
        console.error('ApexCharts no está cargado. Intentando cargar...');
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/apexcharts@3.40.0/dist/apexcharts.min.js';
        script.onload = function() {
            // console.log('ApexCharts cargado manualmente con éxito');
            processCharts();
        };
        document.head.appendChild(script);
    } else {
        // console.log('ApexCharts ya está cargado, versión:', ApexCharts.version);
        processCharts();
    }

    function processCharts() {
        var activeCharts = {};

        var allStrengthData = rawStrengthDataItems.map(function(item) {
            var strength_data_obj = { id: item.id, labels: [], scores: [], maxScores: [], backgroundColor: [], borderColor: [], pointBackgroundColor: [], pointBorderColor: [] };
            var lifts_data = item.rawData;
            var exerciseGroups = {
                'Sentadilla': { exercises: ['backSquat', 'frontSquat'], backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', pointBackgroundColor: 'rgba(255, 99, 132, 1)', pointBorderColor: '#fff' },
                'Peso Muerto': { exercises: ['deadlift', 'sumoDeadlift', 'powerClean'], backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgba(54, 162, 235, 1)', pointBackgroundColor: 'rgba(54, 162, 235, 1)', pointBorderColor: '#fff' },
                'Press de Banca': { exercises: ['benchPress', 'inclineBenchPress', 'dip'], backgroundColor: 'rgba(255, 206, 86, 0.2)', borderColor: 'rgba(255, 206, 86, 1)', pointBackgroundColor: 'rgba(255, 206, 86, 1)', pointBorderColor: '#fff' },
                'Press de Hombros': { exercises: ['overheadPress', 'pushPress', 'snatchPress'], backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', pointBackgroundColor: 'rgba(75, 192, 192, 1)', pointBorderColor: '#fff' },
                'Dominadas/Remo': { exercises: ['pullup', 'chinup', 'pendlayRow'], backgroundColor: 'rgba(153, 102, 255, 0.2)', borderColor: 'rgba(153, 102, 255, 1)', pointBackgroundColor: 'rgba(153, 102, 255, 1)', pointBorderColor: '#fff' },
                'Otros': { exercises: [], backgroundColor: 'rgba(201, 203, 207, 0.2)', borderColor: 'rgba(201, 203, 207, 1)', pointBackgroundColor: 'rgba(201, 203, 207, 1)', pointBorderColor: '#fff' }
            };

            if (typeof lifts_data === 'object' && lifts_data !== null) {
                var processedLifts = [];
                if (Array.isArray(lifts_data)) {
                    lifts_data.forEach(function(lift_info) {
                        if (lift_info.user1RM !== undefined && typeof lift_info.user1RM === 'number' && lift_info.user1RM > 0 &&
                            lift_info.expected !== undefined && typeof lift_info.expected === 'number' && lift_info.expected > 0) {
                            processedLifts.push({
                                name: lift_info.name || 'Unknown Lift',
                                key: lift_info.key || '', // Asegurar que key exista
                                user1RM: lift_info.user1RM,
                                expected: lift_info.expected,
                                percent: Math.min(Math.round((lift_info.user1RM / lift_info.expected) * 100), 150)
                            });
                        }
                    });
                } else {
                    for (var lift_key in lifts_data) {
                        if (lifts_data.hasOwnProperty(lift_key)) {
                            var lift_info = lifts_data[lift_key];
                            if (lift_info.user1RM !== undefined && typeof lift_info.user1RM === 'number' && lift_info.user1RM > 0 &&
                                lift_info.expected !== undefined && typeof lift_info.expected === 'number' && lift_info.expected > 0) {
                                processedLifts.push({
                                    name: lift_info.name || lift_key.replace(/([A-Z])/g, ' $1').trim().charAt(0).toUpperCase() + lift_key.replace(/([A-Z])/g, ' $1').trim().slice(1),
                                    key: lift_key,
                                    user1RM: lift_info.user1RM,
                                    expected: lift_info.expected,
                                    percent: Math.min(Math.round((lift_info.user1RM / lift_info.expected) * 100), 150)
                                });
                            }
                        }
                    }
                }
                processedLifts.sort(function(a, b) {
                    var groupA = 'Otros'; var groupB = 'Otros';
                    for (var groupName in exerciseGroups) {
                        if (exerciseGroups[groupName].exercises.includes(a.key)) groupA = groupName;
                        if (exerciseGroups[groupName].exercises.includes(b.key)) groupB = groupName;
                    }
                    if (groupA !== groupB) return Object.keys(exerciseGroups).indexOf(groupA) - Object.keys(exerciseGroups).indexOf(groupB);
                    return a.name.localeCompare(b.name);
                });
                processedLifts.forEach(function(lift) {
                    var group = exerciseGroups['Otros'];
                    for (var groupName in exerciseGroups) {
                        if (exerciseGroups[groupName].exercises.includes(lift.key)) {
                            group = exerciseGroups[groupName]; break;
                        }
                    }
                    strength_data_obj.labels.push(lift.name);
                    strength_data_obj.scores.push(lift.percent);
                    strength_data_obj.maxScores.push(100);
                    strength_data_obj.backgroundColor.push(group.backgroundColor);
                    strength_data_obj.borderColor.push(group.borderColor);
                    strength_data_obj.pointBackgroundColor.push(group.pointBackgroundColor);
                    strength_data_obj.pointBorderColor.push(group.pointBorderColor);
                });
            }
            return strength_data_obj;
        });

        var allMuscleGroupsData = rawMuscleGroupDataItems.map(function(item) {
            var muscle_group_obj = { id: item.id, labels: [], scores: [], colors: [] };
            var muscle_groups = item.rawData;
            if (typeof muscle_groups === 'object' && muscle_groups !== null) {
                const groupOrder = ["squat", "legPress", "legExtension", "legCurl", "calfRaise", "pullup", "chinup", "latPulldown", "rowingMachine", "pendlayRow", "tBar", "horizontalPress", "benchPress", "inclineBenchPress", "declineBenchPress", "dip", "pushup", "verticalPress", "overheadPress", "pushPress", "shoulderPress", "floorPull", "deadlift", "sumoDeadlift", "powerClean", "snatch", "bicepsCurl", "tricepsExtension", "lateralRaise", "facePull", "coreExercise"];
                const friendlyNames = {"squat": "Sentadilla", "legPress": "Prensa", "legExtension": "Extensión", "legCurl": "Curl Femoral", "calfRaise": "Pantorrilla", "pullup": "Dominadas", "chinup": "Dominadas Supinas", "latPulldown": "Jalón al Pecho", "rowingMachine": "Remo Máquina", "pendlayRow": "Remo Pendlay", "tBar": "Remo T-Bar", "horizontalPress": "Press Horizontal", "benchPress": "Press Banca", "inclineBenchPress": "Press Inclinado", "declineBenchPress": "Press Declinado", "dip": "Fondos", "pushup": "Flexiones", "verticalPress": "Press Vertical", "overheadPress": "Press Militar", "pushPress": "Push Press", "shoulderPress": "Press Hombros", "floorPull": "Levantamientos", "deadlift": "Peso Muerto", "sumoDeadlift": "Peso Muerto Sumo", "powerClean": "Power Clean", "snatch": "Arrancada", "bicepsCurl": "Curl Bíceps", "tricepsExtension": "Extensión Tríceps", "lateralRaise": "Elevación Lateral", "facePull": "Face Pull", "coreExercise": "Core"};
                const colorGroups = {"squat": "rgba(255, 99, 132, 0.8)", "legPress": "rgba(255, 99, 132, 0.8)", "legExtension": "rgba(255, 99, 132, 0.8)", "legCurl": "rgba(255, 99, 132, 0.8)", "calfRaise": "rgba(255, 99, 132, 0.8)", "pullup": "rgba(54, 162, 235, 0.8)", "chinup": "rgba(54, 162, 235, 0.8)", "latPulldown": "rgba(54, 162, 235, 0.8)", "rowingMachine": "rgba(54, 162, 235, 0.8)", "pendlayRow": "rgba(54, 162, 235, 0.8)", "tBar": "rgba(54, 162, 235, 0.8)", "horizontalPress": "rgba(255, 206, 86, 0.8)", "benchPress": "rgba(255, 206, 86, 0.8)", "inclineBenchPress": "rgba(255, 206, 86, 0.8)", "declineBenchPress": "rgba(255, 206, 86, 0.8)", "dip": "rgba(255, 206, 86, 0.8)", "pushup": "rgba(255, 206, 86, 0.8)", "verticalPress": "rgba(75, 192, 192, 0.8)", "overheadPress": "rgba(75, 192, 192, 0.8)", "pushPress": "rgba(75, 192, 192, 0.8)", "shoulderPress": "rgba(75, 192, 192, 0.8)", "floorPull": "rgba(153, 102, 255, 0.8)", "deadlift": "rgba(153, 102, 255, 0.8)", "sumoDeadlift": "rgba(153, 102, 255, 0.8)", "powerClean": "rgba(153, 102, 255, 0.8)", "snatch": "rgba(153, 102, 255, 0.8)", "bicepsCurl": "rgba(255, 159, 64, 0.8)", "tricepsExtension": "rgba(255, 159, 64, 0.8)", "lateralRaise": "rgba(255, 159, 64, 0.8)", "facePull": "rgba(255, 159, 64, 0.8)", "coreExercise": "rgba(255, 159, 64, 0.8)"};
                var tempData = [];
                for (let key in muscle_groups) {
                    if (muscle_groups.hasOwnProperty(key) && muscle_groups[key] !== undefined) {
                        const value = parseFloat(muscle_groups[key]) || 0;
                        if (value > 0) {
                            const displayName = friendlyNames[key] || key.replace(/([A-Z])/g, ' $1').trim().charAt(0).toUpperCase() + key.replace(/([A-Z])/g, ' $1').trim().slice(1);
                            const color = colorGroups[key] || "rgba(201, 203, 207, 0.8)";
                            tempData.push({ key: key, displayName: displayName, value: value, color: color });
                        }
                    }
                }
                tempData.sort(function(a, b) {
                    const indexA = groupOrder.indexOf(a.key); const indexB = groupOrder.indexOf(b.key);
                    if (indexA >= 0 && indexB >= 0) return indexA - indexB;
                    else if (indexA >= 0) return -1;
                    else if (indexB >= 0) return 1;
                    return 0;
                });
                tempData.forEach(function(item) {
                    muscle_group_obj.labels.push(item.displayName);
                    muscle_group_obj.scores.push(item.value);
                    muscle_group_obj.colors.push(item.color);
                });
            }
            return muscle_group_obj;
        });

        // console.log('Processed allStrengthData:', allStrengthData);
        // console.log('Processed allMuscleGroupsData:', allMuscleGroupsData);

        function createStrengthChart(chartId, data) {
            var container = document.getElementById(chartId);
            if (!container) {
                console.error('Container element not found for strength chart:', chartId);
                return;
            }
            if (activeCharts[chartId]) activeCharts[chartId].destroy();
            var parentElement = container.parentElement;
            var canvasHeight = container.height || 350; // Default height
            parentElement.removeChild(container);
            var apexDiv = document.createElement('div');
            apexDiv.id = chartId + '-apex';
            apexDiv.style.width = '100%';
            apexDiv.style.height = canvasHeight + 'px';
            parentElement.appendChild(apexDiv);

            if (data && data.labels && data.labels.length > 0 && data.scores) {
                var seriesData = []; var categories = []; var colorData = [];
                for (var i = 0; i < data.labels.length; i++) {
                    if (data.scores[i] !== null && data.scores[i] !== undefined) {
                        categories.push(data.labels[i]);
                        var percentage = data.scores[i];
                        var relativePercentage = percentage - 100;
                        seriesData.push(Math.round(relativePercentage));
                        colorData.push(relativePercentage >= 0 ? '#28a745' : '#dc3545');
                    }
                }
                categories.reverse(); seriesData.reverse(); colorData.reverse();
                var minValue = Math.min(...seriesData); var maxValue = Math.max(...seriesData);
                minValue = Math.floor(minValue * 1.1); maxValue = Math.ceil(maxValue * 1.1);

                var options = {
                    series: [{ name: 'Rendimiento Relativo', data: seriesData }],
                    chart: { type: 'bar', height: canvasHeight, toolbar: { show: false } },
                    plotOptions: { bar: { horizontal: true, distributed: true, dataLabels: { position: 'center' }, barHeight: '95%' } },
                    dataLabels: { enabled: true, formatter: function(val) { return val > 0 ? '+' + val + '%' : val + '%'; }, style: { colors: ['#fff'], fontSize: '11px', fontWeight: 'bold' }, offsetX: 0 },
                    stroke: { width: 0 },
                    grid: { borderColor: '#e7e7e7', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
                    xaxis: { categories: categories, title: { text: 'Rendimiento Relativo (%)', style: { fontWeight: 500 } }, labels: { formatter: function(val) { return val + '%'; } }, min: minValue, max: maxValue, axisTicks: { show: true }, axisBorder: { show: true } },
                    yaxis: { labels: { style: { fontWeight: 500 } } },
                    colors: colorData,
                    title: { text: '', show: false }, subtitle: { text: '', show: false },
                    annotations: { xaxis: [{ x: 0, strokeDashArray: 0, borderColor: '#78909C', opacity: 0.3, offsetX: 0, label: { show: false } }] },
                    legend: { show: false },
                    tooltip: {
                        enabled: true,
                        custom: function({ series, seriesIndex, dataPointIndex, w }) {
                            var value = series[seriesIndex][dataPointIndex];
                            var exercise = w.globals.labels[dataPointIndex];
                            var valueColor = value >= 0 ? '#28a745' : '#dc3545';
                            var strengthTerm = value >= 0 ? 'más fuerte' : 'más débil';
                            var formattedValue = value >= 0 ? `+${value}%` : `${value}%`;
                            return `<div style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); font-family: sans-serif; font-size: 13px;"><div style="font-weight: bold; margin-bottom: 5px; color: #333;">${exercise}</div><div><span style="color: ${valueColor}; font-weight: bold;">${formattedValue} ${strengthTerm}</span> que el promedio<br>de los levantadores de tu mismo nivel.</div></div>`;
                        }
                    }
                };
                try {
                    if (typeof ApexCharts === 'undefined') {
                        apexDiv.innerHTML = '<div class="alert alert-danger">Error: No se pudo cargar ApexCharts.</div>';
                    } else {
                        activeCharts[chartId] = new ApexCharts(document.getElementById(chartId + '-apex'), options);
                        activeCharts[chartId].render();
                    }
                } catch (error) {
                    console.error('Error al crear el gráfico ApexCharts:', error);
                    apexDiv.innerHTML = '<div class="alert alert-danger">Error al crear el gráfico: ' + error.message + '</div>';
                }
            } else {
                apexDiv.innerHTML = '<div class="alert alert-info">No hay datos suficientes para mostrar el gráfico de fuerza.</div>';
            }
        }

        function createMuscleGroupChart(chartId, data) {
            var canvas = document.getElementById(chartId);
            if (!canvas) {
                console.error('Canvas element not found for muscle group chart:', chartId);
                return;
            }
            var ctx = canvas.getContext('2d');
            if (activeCharts[chartId]) activeCharts[chartId].destroy();

            if (data && data.labels && data.labels.length > 0) {
                let sum = 0; let validValues = 0;
                for (let i = 0; i < data.scores.length; i++) {
                    const score = parseFloat(data.scores[i]) || 0;
                    if (score > 0) { sum += score; validValues++; }
                }
                const averageScore = validValues > 0 ? Math.round(sum / validValues) : 0;
                const averageData = Array(data.labels.length).fill(averageScore);
                const datasets = [
                    { label: 'Grupos Musculares', data: data.scores, backgroundColor: 'rgba(54, 162, 235, 0.3)', borderColor: 'rgba(54, 162, 235, 0.8)', borderWidth: 2, pointBackgroundColor: data.colors, pointBorderColor: '#fff', pointHoverBackgroundColor: data.colors, pointHoverBorderColor: '#fff', pointRadius: 5, pointHoverRadius: 7 },
                    { label: 'Promedio (' + averageScore + '%)', data: averageData, backgroundColor: 'transparent', borderColor: 'rgba(120, 120, 120, 0.4)', borderWidth: 1.5, borderDash: [3, 3], pointRadius: 0, pointHoverRadius: 0, fill: false }
                ];
                activeCharts[chartId] = new Chart(ctx, {
                    type: 'radar',
                    data: { labels: data.labels, datasets: datasets },
                    options: {
                        responsive: true, maintainAspectRatio: true,
                        scales: { r: { angleLines: { display: true, color: 'rgba(0, 0, 0, 0.1)' }, ticks: { beginAtZero: true, backdropColor: 'transparent', color: '#666', suggestedMax: 100, font: { size: 10 } }, grid: { color: 'rgba(0, 0, 0, 0.1)' }, pointLabels: { font: { size: 11, weight: 'bold' }, color: '#333' } } },
                        plugins: {
                            legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 15, font: { size: 11 }, filter: function(legendItem, chartData) { return legendItem.text.includes('Promedio'); } } },
                            tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleFont: { size: 13 }, bodyFont: { size: 12 }, displayColors: true, callbacks: { label: function(context) { var value = context.raw || 0; var label = context.chart.data.labels[context.dataIndex]; if (context.dataset.label.includes('Promedio')) return 'Promedio: ' + value + '%'; return label + ': ' + value + '%'; }, afterBody: function(context) { if (context.length > 0 && !context[0].dataset.label.includes('Promedio')) { const value = context[0].raw || 0; const diff = value - averageScore; if (diff > 0) return '↑ ' + diff + '% sobre el promedio'; else if (diff < 0) return '↓ ' + Math.abs(diff) + '% bajo el promedio'; else return 'Igual al promedio'; } return ''; } } },
                            title: { display: true, text: 'Rendimiento por Grupo Muscular', position: 'top', padding: { top: 10, bottom: 10 }, font: { size: 14, weight: 'bold' } }
                        }
                    }
                });
            } else {
                canvas.parentElement.innerHTML = '<div class="alert alert-info">No hay datos suficientes para mostrar el gráfico de grupos musculares.</div>';
            }
        }

        var collapseElements = document.querySelectorAll(collapseSelector || '.collapse'); // Usar selector provisto o default
        collapseElements.forEach(function(collapseEl) {
            collapseEl.addEventListener('shown.bs.collapse', function (event) {
                var collapseId = event.target.id;
                if (!collapseId) return;
                
                // Extraer el ID numérico del registro. Asumimos que el ID del collapse termina en '-<ID>'
                // Por ejemplo: 'collapse-strength-123' o 'details-123'
                var idMatch = collapseId.match(/(\d+)$/);
                if (!idMatch) {
                    console.error('No se pudo extraer el ID del registro desde el ID del collapse:', collapseId);
                    return;
                }
                var recordId = parseInt(idMatch[1]);

                if (!isNaN(recordId)) {
                    // console.log('Collapse shown for record ID:', recordId);
                    
                    var strengthChartElementId = chartIdPrefix + 'StrengthChart-' + recordId;
                    var strengthItem = allStrengthData.find(function(item) { return item.id === recordId; });
                    if (strengthItem) {
                        createStrengthChart(strengthChartElementId, strengthItem);
                    } else {
                        console.warn('No strength data found for record ID:', recordId, 'Expected chart ID:', strengthChartElementId);
                    }

                    var muscleGroupsChartElementId = chartIdPrefix + 'MuscleGroupsChart-' + recordId;
                    var muscleGroupItem = allMuscleGroupsData.find(function(item) { return item.id === recordId; });
                    if (muscleGroupItem) {
                        createMuscleGroupChart(muscleGroupsChartElementId, muscleGroupItem);
                    } else {
                        console.warn('No muscle group data found for record ID:', recordId, 'Expected chart ID:', muscleGroupsChartElementId);
                    }
                } else {
                    console.error('Could not parse record ID from collapse ID:', collapseId);
                }
            });
        });
    } // Fin de processCharts
}
