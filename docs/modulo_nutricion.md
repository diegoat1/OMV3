# Módulo de Nutrición

El módulo de nutrición es el núcleo de ONV2, diseñado para ofrecer planes altamente personalizados mediante un sistema de bloques y optimización matemática.

## Sistema de Bloques

Utiliza el concepto de "Bloques Nutricionales" (P/G/C) para simplificar la planificación:
- **Proteína (P)**: Generalmente 7g por bloque.
- **Grasa (G)**: Generalmente 1.5g (adicional a lo que trae la proteína) por bloque.
- **Carbohidratos (C)**: Generalmente 9g por bloque.

### Constructor de Combinaciones
Permite al usuario armar comidas seleccionando alimentos de `GRUPOSALIMENTOS`. El sistema calcula en tiempo real los bloques resultantes y los valida contra el objetivo del usuario.

## Optimizador de Dietas

Usa **PuLP (Programación Lineal)** para resolver el problema de selección de alimentos:
- **Objetivo**: Minimizar la desviación de las calorías y macros objetivo.
- **Restricciones**: Cumplimiento de macros (P, G, C), micronutrientes mínimos, fibras, y límites de grasas saturadas.
- **Libertad**: El usuario puede definir un margen de "libertad" que relaja las restricciones para permitir mayor variedad.

## Planes Alimentarios Automáticos

Calculados en `functions.calcular_plan_nutricional_automatico` basados en:
1.  **TMB (Tasa Metabólica Basal)** según Mifflin-St Jeor.
2.  **Factor de Actividad** personalizado.
3.  **Objetivo del Usuario**: Pérdida de grasa, mantenimiento o ganancia de masa magra.
4.  **Disponibilidad Energética (EA)**: Asegura que el déficit no sea perjudicial para la salud.

## Funciones Clave
- `process_diet`: Ejecuta el optimizador para generar una dieta diaria.
- `generar_combinaciones_alimentos`: Algoritmo de backtracking para sugerir combos de bloques.
- `api_plan_automatico`: Endpoint que integra todos los cálculos para el usuario final.
