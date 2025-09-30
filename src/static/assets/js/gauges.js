/**
 * Sistema de Gauges para Dashboard - Métricas Corporales
 * Maneja la posición de las agujas según valores de IMC, FFMI y %BF
 */

class MetricGauge {
    constructor(element, value, type, sex = 'M') {
        this.element = element;
        this.value = parseFloat(value) || 0;
        this.type = type;
        this.sex = sex;
        this.needle = null;
        this.init();
    }

    init() {
        this.createNeedle();
        this.setNeedlePosition();
    }

    createNeedle() {
        this.needle = document.createElement('div');
        this.needle.className = 'gauge-needle animate';
        this.element.appendChild(this.needle);
    }

    /**
     * Calcula el ángulo de la aguja basado en el valor y tipo de métrica
     * Rango de -90° a +90° (180° total)
     */
    calculateNeedleAngle() {
        let angle = 0;
        const value = this.value;

        switch (this.type) {
            case 'imc':
                angle = this.calculateImcAngle(value);
                break;
            case 'ffmi':
                angle = this.calculateFfmiAngle(value, this.sex);
                break;
            case 'bf':
                angle = this.calculateBfAngle(value, this.sex);
                break;
        }

        // Limitar el ángulo entre -90° y +90°
        return Math.max(-90, Math.min(90, angle));
    }

    calculateImcAngle(imc) {
        // Rangos IMC: <18.5, 18.5-24.9, 25-29.9, 30-34.9, 35-39.9, ≥40
        if (imc <= 15) return -90;
        if (imc >= 45) return 90;
        
        if (imc < 18.5) {
            // Rango bajo peso: -90° a -60°
            return -90 + ((imc - 15) / 3.5) * 30;
        } else if (imc < 25) {
            // Rango normal: -60° a -15°
            return -60 + ((imc - 18.5) / 6.5) * 45;
        } else if (imc < 30) {
            // Rango sobrepeso: -15° a +15°
            return -15 + ((imc - 25) / 5) * 30;
        } else if (imc < 35) {
            // Rango obesidad I: +15° a +45°
            return 15 + ((imc - 30) / 5) * 30;
        } else if (imc < 40) {
            // Rango obesidad II: +45° a +70°
            return 45 + ((imc - 35) / 5) * 25;
        } else {
            // Rango obesidad III: +70° a +90°
            return 70 + ((imc - 40) / 5) * 20;
        }
    }

    calculateFfmiAngle(ffmi, sex) {
        let ranges;
        
        if (sex === 'M') {
            // Rangos FFMI Hombres expandidos: 15-28 para mejor visualización
            ranges = [15, 17, 18.5, 20, 21.5, 23, 25, 28];
        } else {
            // Rangos FFMI Mujeres expandidos: 12-24 para mejor visualización  
            ranges = [12, 13, 14.5, 16, 17.5, 19, 21, 24];
        }

        if (ffmi <= ranges[0]) return -90;
        if (ffmi >= ranges[7]) return 90;

        // Distribución uniforme en el semicírculo
        const totalRange = ranges[7] - ranges[0];
        const position = (ffmi - ranges[0]) / totalRange;
        return -90 + (position * 180);
    }

    setNeedlePosition() {
        const angle = this.calculateNeedleAngle();
        this.needle.style.transform = `rotate(${angle}deg)`;
    }

    /**
     * Los labels ya están en el HTML, no necesitamos crearlos dinámicamente
     */

    /**
     * Actualiza el valor y reposiciona la aguja
     */
    updateValue(newValue) {
        this.value = parseFloat(newValue) || 0;
        this.setNeedlePosition();
    }
}

/**
 * Inicializa todos los gauges en la página
 */
function initializeGauges() {
    // Buscar todos los gauges en el DOM
    const allGauges = document.querySelectorAll('.metric-gauge');
    
    // Obtener el sexo del usuario (desde variable global o dataset)
    const userSex = window.userSex || document.body.dataset.userSex || 'M';

    // Inicializar cada gauge
    allGauges.forEach(gauge => {
        const value = gauge.dataset.value;
        let type = '';
        
        if (gauge.classList.contains('imc-gauge')) {
            type = 'imc';
        } else if (gauge.classList.contains('ffmi-gauge')) {
            type = 'ffmi';
        } else if (gauge.classList.contains('bf-gauge')) {
            type = 'bf';
        }
        
        if (type) {
            new MetricGauge(gauge, value, type, userSex);
        }
    });
}

/**
 * Función auxiliar para obtener el color del rango según el valor
 */
function getRangeColorClass(value, type, sex = 'M') {
    switch (type) {
        case 'imc':
            if (value < 18.5) return 'text-info';
            if (value < 25) return 'text-success';
            if (value < 30) return 'text-warning';
            return 'text-danger';
            
        case 'ffmi':
            const ffmiThresholds = sex === 'M' ? [18, 19, 21, 22.5] : [13.5, 16, 17, 18.5];
            if (value < ffmiThresholds[0]) return 'text-danger';
            if (value < ffmiThresholds[1]) return 'text-warning';
            if (value < ffmiThresholds[2]) return 'text-success';
            if (value < ffmiThresholds[3]) return 'text-success';
            return 'text-primary';
            
        case 'bf':
            const bfThresholds = sex === 'M' ? [10, 17, 24, 31] : [18, 24, 31, 38];
            if (value < bfThresholds[0]) return 'text-info';
            if (value < bfThresholds[1]) return 'text-success';
            if (value < bfThresholds[2]) return 'text-warning';
            return 'text-danger';
    }
    return '';
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeGauges);

// Exportar para uso global
window.MetricGauge = MetricGauge;
window.initializeGauges = initializeGauges;
window.getRangeColorClass = getRangeColorClass;
