/**
 * Constantes del Sistema de Bloques Nutricionales
 * 
 * Fuente: src/functions.py líneas 4470-4473
 * Documentación: docs/cambios/correccion_bloques_decimales.md
 */

// Bloques de macronutrientes (gramos por bloque)
export const BLOQUE_PROTEINA = 20;      // 1P = 20g de proteína
export const BLOQUE_GRASA = 10;         // 1G = 10g de grasa
export const BLOQUE_CARBOHIDRATOS = 25; // 1C = 25g de carbohidratos

// Bloque de energía (kcal por bloque)
// Fuente: docs/nutricion/implementacion_bloques_energia.md línea 17
export const BLOQUE_ENERGIA = 100;      // 1E = 100 kcal

// Factores calóricos por gramo de macronutriente
export const KCAL_POR_GRAMO_PROTEINA = 4;
export const KCAL_POR_GRAMO_GRASA = 9;
export const KCAL_POR_GRAMO_CARBOHIDRATO = 4;
export const KCAL_POR_GRAMO_ALCOHOL = 7;

// Umbral para macros fuertes (80% del valor máximo)
// Fuente: docs/cambios/correccion_macros_fuertes.md líneas 46-49
export const UMBRAL_MACRO_FUERTE = 0.80;

// Tolerancias para validación de bloques
// Fuente: docs/cambios/correccion_bloques_decimales.md líneas 154-161
export const TOLERANCIA_BLOQUES_VERDE = 0.2;   // Dentro de objetivo
export const TOLERANCIA_BLOQUES_AMARILLO = 0.5; // Aceptable

// Tipos de macronutrientes
export type MacroType = 'P' | 'G' | 'C';
export type MacroTypeExtended = MacroType | 'E';

// Mapeo de nombres completos
export const MACRO_NAMES: Record<MacroType, string> = {
  P: 'Proteína',
  G: 'Grasa',
  C: 'Carbohidratos',
};

// Colores por macro (para UI)
export const MACRO_COLORS: Record<MacroTypeExtended, string> = {
  P: '#ef4444', // Rojo
  G: '#eab308', // Amarillo
  C: '#3b82f6', // Azul
  E: '#22c55e', // Verde
};

// Momentos del día para comidas
export type MealMoment = 
  | 'desayuno' 
  | 'media_manana' 
  | 'almuerzo' 
  | 'merienda' 
  | 'media_tarde' 
  | 'cena';

export const MEAL_MOMENT_NAMES: Record<MealMoment, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media Mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  media_tarde: 'Media Tarde',
  cena: 'Cena',
};

export const MEAL_MOMENT_EMOJIS: Record<MealMoment, string> = {
  desayuno: '🌅',
  media_manana: '☕',
  almuerzo: '🍽️',
  merienda: '🧁',
  media_tarde: '🥜',
  cena: '🌙',
};
