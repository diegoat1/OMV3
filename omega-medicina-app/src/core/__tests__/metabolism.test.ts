/**
 * Tests Unitarios - Módulo de Metabolismo
 * 
 * Golden tests basados en valores de ONV2
 * Fuente: src/templates/caloriescal.html, src/functions.py
 */

import {
  katchMcArdle,
  katchMcArdleMetric,
  mifflinStJeor,
  calcularTDEE,
  calcularFFMI,
  getCategoriaFFMI,
  calcularBFNavy,
  calcularComposicionCorporal,
  calcularEA,
  getCategoriaEA,
  evaluarRiesgoEA,
  analizarEA,
  calcularProteinaRecomendada,
  validarPlanCalorico,
  ACTIVITY_FACTORS,
  EA_THRESHOLDS_FEMALE,
  EA_THRESHOLDS_MALE,
} from '../metabolism';

describe('Metabolism Core - BMR', () => {
  describe('katchMcArdle', () => {
    // Fuente: src/templates/caloriescal.html líneas 488-491
    // BMR = 370 + (9.8 × leanMassLbs)
    it('calcula BMR correctamente para 70kg masa magra', () => {
      const result = katchMcArdle(70);
      // 70kg = 154.32 lbs
      // BMR = 370 + (9.8 × 154.32) = 370 + 1512.34 = 1882
      expect(result.bmr).toBeGreaterThan(1800);
      expect(result.bmr).toBeLessThan(1900);
      expect(result.formula).toBe('Katch-McArdle');
    });

    it('calcula BMR correctamente para 50kg masa magra', () => {
      const result = katchMcArdle(50);
      // 50kg = 110.23 lbs
      // BMR = 370 + (9.8 × 110.23) = 370 + 1080.25 = 1450
      expect(result.bmr).toBeGreaterThan(1400);
      expect(result.bmr).toBeLessThan(1500);
    });
  });

  describe('katchMcArdleMetric', () => {
    it('produce resultado similar a la versión imperial', () => {
      const imperial = katchMcArdle(70).bmr;
      const metric = katchMcArdleMetric(70);
      // Diferencia máxima de 50 kcal por redondeo
      expect(Math.abs(imperial - metric)).toBeLessThan(50);
    });
  });

  describe('mifflinStJeor', () => {
    it('calcula BMR para hombre correctamente', () => {
      // Hombre: 80kg, 180cm, 30 años
      // BMR = (10 × 80) + (6.25 × 180) - (5 × 30) + 5
      // BMR = 800 + 1125 - 150 + 5 = 1780
      const result = mifflinStJeor(80, 180, 30, 'M');
      expect(result.bmr).toBe(1780);
    });

    it('calcula BMR para mujer correctamente', () => {
      // Mujer: 60kg, 165cm, 25 años
      // BMR = (10 × 60) + (6.25 × 165) - (5 × 25) - 161
      // BMR = 600 + 1031.25 - 125 - 161 = 1345
      const result = mifflinStJeor(60, 165, 25, 'F');
      expect(result.bmr).toBe(1345);
    });
  });
});

describe('Metabolism Core - TDEE', () => {
  describe('calcularTDEE', () => {
    // Fuente: src/templates/caloriescal.html línea 501
    it('calcula TDEE sedentario correctamente', () => {
      const result = calcularTDEE(1800, 'sedentary');
      expect(result.tdee).toBe(2160); // 1800 × 1.2
      expect(result.activity_factor).toBe(1.2);
    });

    it('calcula TDEE moderado correctamente', () => {
      const result = calcularTDEE(1800, 'moderate');
      expect(result.tdee).toBe(2790); // 1800 × 1.55
      expect(result.activity_factor).toBe(1.55);
    });

    it('calcula TDEE intenso correctamente', () => {
      const result = calcularTDEE(1800, 'intense');
      expect(result.tdee).toBe(3105); // 1800 × 1.725
      expect(result.activity_factor).toBe(1.725);
    });
  });
});

describe('Metabolism Core - Composición Corporal', () => {
  describe('calcularFFMI', () => {
    // Fuente: src/functions.py línea 1240
    // FFMI = masa_magra / altura_m²
    it('calcula FFMI correctamente', () => {
      // 70kg masa magra, 1.80m altura
      // FFMI = 70 / (1.8)² = 70 / 3.24 = 21.6
      const ffmi = calcularFFMI(70, 180);
      expect(ffmi).toBe(21.6);
    });

    it('calcula FFMI para diferentes alturas', () => {
      // 60kg masa magra, 1.70m altura
      // FFMI = 60 / (1.7)² = 60 / 2.89 = 20.8
      const ffmi = calcularFFMI(60, 170);
      expect(ffmi).toBe(20.8);
    });
  });

  describe('getCategoriaFFMI', () => {
    // Fuente: src/functions.py líneas 1159-1203
    it('clasifica FFMI de hombre correctamente', () => {
      expect(getCategoriaFFMI(14, 'M')).toBe('Muy Pobre');
      expect(getCategoriaFFMI(16, 'M')).toBe('Pobre');
      expect(getCategoriaFFMI(19, 'M')).toBe('Casi Normal');
      expect(getCategoriaFFMI(21, 'M')).toBe('Normal');
      expect(getCategoriaFFMI(24, 'M')).toBe('Muy Bueno');
      expect(getCategoriaFFMI(30, 'M')).toBe('Superior');
    });

    it('clasifica FFMI de mujer correctamente', () => {
      expect(getCategoriaFFMI(11, 'F')).toBe('Muy Pobre');
      expect(getCategoriaFFMI(15, 'F')).toBe('Casi Normal');
      expect(getCategoriaFFMI(17, 'F')).toBe('Normal');
      expect(getCategoriaFFMI(20, 'F')).toBe('Muy Bueno');
      expect(getCategoriaFFMI(25, 'F')).toBe('Superior');
    });
  });

  describe('calcularBFNavy', () => {
    // Fuente: src/main.py líneas 96-101
    it('calcula % grasa para hombre correctamente', () => {
      // Hombre: 180cm altura, 90cm cintura, 40cm cuello
      const bf = calcularBFNavy({
        sex: 'M',
        heightCm: 180,
        waistCm: 90,
        neckCm: 40,
      });
      // Resultado esperado: ~18-22%
      expect(bf).toBeGreaterThan(15);
      expect(bf).toBeLessThan(25);
    });

    it('calcula % grasa para mujer correctamente', () => {
      // Mujer: 165cm altura, 75cm cintura, 35cm cuello, 100cm cadera
      const bf = calcularBFNavy({
        sex: 'F',
        heightCm: 165,
        waistCm: 75,
        neckCm: 35,
        hipCm: 100,
      });
      // Resultado esperado: ~25-35%
      expect(bf).toBeGreaterThan(20);
      expect(bf).toBeLessThan(40);
    });
  });

  describe('calcularComposicionCorporal', () => {
    it('calcula composición completa correctamente', () => {
      const result = calcularComposicionCorporal({
        weightKg: 80,
        heightCm: 180,
        sex: 'M',
        bodyFatPercent: 20,
      });

      expect(result.weight_kg).toBe(80);
      expect(result.fat_mass_kg).toBe(16); // 80 × 0.20
      expect(result.lean_mass_kg).toBe(64); // 80 - 16
      expect(result.body_fat_percent).toBe(20);
      expect(result.ffmi).toBe(19.8); // 64 / 3.24
      expect(result.ffmi_category).toBe('Casi Normal');
    });
  });
});

describe('Metabolism Core - Disponibilidad Energética (EA)', () => {
  // Fuente: docs/nutricion/planner_automatico_implementacion.md líneas 39-60
  describe('calcularEA', () => {
    it('calcula EA correctamente', () => {
      // EA = (ingesta - ejercicio) / FFM
      // EA = (2500 - 500) / 60 = 33.3 kcal/kg FFM
      const ea = calcularEA(2500, 500, 60);
      expect(ea).toBeCloseTo(33.3, 1);
    });

    it('maneja FFM cero', () => {
      const ea = calcularEA(2000, 300, 0);
      expect(ea).toBe(0);
    });

    it('calcula EA sin ejercicio', () => {
      // EA = 2000 / 50 = 40 kcal/kg FFM
      const ea = calcularEA(2000, 0, 50);
      expect(ea).toBe(40);
    });
  });

  describe('getCategoriaEA', () => {
    // Fuente: docs/nutricion/planner_automatico_implementacion.md líneas 44-56
    describe('Mujeres', () => {
      it('clasifica EA óptima (≥45)', () => {
        expect(getCategoriaEA(45, 'F')).toBe('optimal');
        expect(getCategoriaEA(50, 'F')).toBe('optimal');
      });

      it('clasifica EA adecuada (30-45)', () => {
        expect(getCategoriaEA(35, 'F')).toBe('adequate');
        expect(getCategoriaEA(30, 'F')).toBe('adequate');
      });

      it('clasifica EA baja (25-30)', () => {
        expect(getCategoriaEA(27, 'F')).toBe('low');
        expect(getCategoriaEA(25, 'F')).toBe('low');
      });

      it('clasifica EA riesgo (<25)', () => {
        expect(getCategoriaEA(24, 'F')).toBe('risk');
        expect(getCategoriaEA(20, 'F')).toBe('risk');
      });
    });

    describe('Hombres', () => {
      it('clasifica EA óptima (≥35)', () => {
        expect(getCategoriaEA(35, 'M')).toBe('optimal');
        expect(getCategoriaEA(40, 'M')).toBe('optimal');
      });

      it('clasifica EA adecuada (25-35)', () => {
        expect(getCategoriaEA(30, 'M')).toBe('adequate');
        expect(getCategoriaEA(25, 'M')).toBe('adequate');
      });

      it('clasifica EA baja (20-25)', () => {
        expect(getCategoriaEA(22, 'M')).toBe('low');
        expect(getCategoriaEA(20, 'M')).toBe('low');
      });

      it('clasifica EA riesgo (<20)', () => {
        expect(getCategoriaEA(19, 'M')).toBe('risk');
        expect(getCategoriaEA(15, 'M')).toBe('risk');
      });
    });
  });

  describe('evaluarRiesgoEA', () => {
    // Fuente: docs/nutricion/planner_automatico_implementacion.md líneas 58-60
    it('detecta riesgo RED-S en mujeres (<25)', () => {
      expect(evaluarRiesgoEA(24, 'F')).toBe('RED-S');
      expect(evaluarRiesgoEA(20, 'F')).toBe('RED-S');
    });

    it('no detecta riesgo RED-S en mujeres (≥25)', () => {
      expect(evaluarRiesgoEA(25, 'F')).toBe('none');
      expect(evaluarRiesgoEA(30, 'F')).toBe('none');
    });

    it('detecta riesgo LEA en hombres (<20)', () => {
      expect(evaluarRiesgoEA(19, 'M')).toBe('LEA');
      expect(evaluarRiesgoEA(15, 'M')).toBe('LEA');
    });

    it('no detecta riesgo LEA en hombres (≥20)', () => {
      expect(evaluarRiesgoEA(20, 'M')).toBe('none');
      expect(evaluarRiesgoEA(25, 'M')).toBe('none');
    });
  });

  describe('analizarEA', () => {
    it('genera análisis completo para EA óptima', () => {
      const result = analizarEA({
        intakeKcal: 2500,
        exerciseKcal: 300,
        leanMassKg: 50,
        sex: 'F',
      });
      // EA = (2500 - 300) / 50 = 44 kcal/kg FFM
      expect(result.ea).toBeCloseTo(44, 0);
      expect(result.category).toBe('adequate'); // 44 < 45
      expect(result.isRisk).toBe(false);
      expect(result.riskType).toBe('none');
    });

    it('genera análisis con riesgo RED-S', () => {
      const result = analizarEA({
        intakeKcal: 1200,
        exerciseKcal: 400,
        leanMassKg: 45,
        sex: 'F',
      });
      // EA = (1200 - 400) / 45 = 17.8 kcal/kg FFM
      expect(result.ea).toBeLessThan(25);
      expect(result.category).toBe('risk');
      expect(result.isRisk).toBe(true);
      expect(result.riskType).toBe('RED-S');
      expect(result.recommendation).toContain('URGENTE');
    });

    it('genera análisis con riesgo LEA', () => {
      const result = analizarEA({
        intakeKcal: 1800,
        exerciseKcal: 500,
        leanMassKg: 70,
        sex: 'M',
      });
      // EA = (1800 - 500) / 70 = 18.6 kcal/kg FFM
      expect(result.ea).toBeLessThan(20);
      expect(result.category).toBe('risk');
      expect(result.isRisk).toBe(true);
      expect(result.riskType).toBe('LEA');
    });
  });

  describe('calcularProteinaRecomendada', () => {
    // Fuente: docs/nutricion/planner_automatico_implementacion.md línea 83
    // Proteína = 2.513244 × FFM_kg
    it('calcula proteína según FFM', () => {
      const proteina = calcularProteinaRecomendada(60);
      // 2.513244 × 60 = 150.79
      expect(proteina).toBe(151);
    });

    it('calcula proteína para FFM alto', () => {
      const proteina = calcularProteinaRecomendada(80);
      // 2.513244 × 80 = 201.06
      expect(proteina).toBe(201);
    });
  });

  describe('validarPlanCalorico', () => {
    it('valida plan seguro sin advertencias', () => {
      const result = validarPlanCalorico({
        intakeKcal: 2500,
        tdee: 2800,
        leanMassKg: 60,
        sex: 'M',
        exerciseKcal: 300,
      });
      // EA = (2500 - 300) / 60 = 36.7 → óptima para hombre
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('detecta déficit extremo', () => {
      const result = validarPlanCalorico({
        intakeKcal: 1500,
        tdee: 2800,
        leanMassKg: 60,
        sex: 'M',
      });
      // Déficit = 1300 kcal > 1000
      expect(result.warnings.some(w => w.includes('1000 kcal'))).toBe(true);
    });

    it('detecta ingesta mínima insuficiente', () => {
      const result = validarPlanCalorico({
        intakeKcal: 1100,
        tdee: 2000,
        leanMassKg: 50,
        sex: 'F',
      });
      // Ingesta < 1200 para mujeres
      expect(result.warnings.some(w => w.includes('1200'))).toBe(true);
    });
  });
});

describe('Metabolism Core - Constantes EA', () => {
  it('tiene umbrales correctos para mujeres', () => {
    expect(EA_THRESHOLDS_FEMALE.optimal).toBe(45);
    expect(EA_THRESHOLDS_FEMALE.adequate).toBe(30);
    expect(EA_THRESHOLDS_FEMALE.low).toBe(25);
    expect(EA_THRESHOLDS_FEMALE.reds).toBe(25);
  });

  it('tiene umbrales correctos para hombres', () => {
    expect(EA_THRESHOLDS_MALE.optimal).toBe(35);
    expect(EA_THRESHOLDS_MALE.adequate).toBe(25);
    expect(EA_THRESHOLDS_MALE.low).toBe(20);
    expect(EA_THRESHOLDS_MALE.lea).toBe(20);
  });
});
