# Omega Medicina - Testing System Documentation

## 🧪 Sistema Completo de Testing

Este proyecto incluye un sistema completo de testing automatizado que cubre unit tests, integration tests, E2E tests, mock data y CI/CD.

## 📋 Tabla de Contenidos

- [Arquitectura de Testing](#arquitectura-de-testing)
- [Configuración](#configuración)
- [Ejecutar Tests](#ejecutar-tests)
- [Mock Data System](#mock-data-system)
- [CI/CD Pipeline](#cicd-pipeline)
- [Reportes y Cobertura](#reportes-y-cobertura)
- [Debugging](#debugging)

## 🏗️ Arquitectura de Testing

### 1. Unit Tests (Jest)
- **Ubicación**: `src/services/api/__tests__/`
- **Cobertura**: API services con mocking HTTP (MSW)
- **Frameworks**: Jest + ts-jest

### 2. Integration Tests (React Native Testing Library)
- **Ubicación**: `src/components/ui/__tests__/` y `src/components/__tests__/`
- **Cobertura**: Componentes React Native y navegación
- **Frameworks**: React Native Testing Library + Jest

### 3. E2E Tests (Detox)
- **Ubicación**: `e2e/`
- **Cobertura**: Flujos completos de usuario en dispositivo real/simulador
- **Frameworks**: Detox + Jest

### 4. Mock Data System
- **Ubicación**: `src/core/mock-data/`
- **Funcionalidad**: Generadores de datos realistas + SQLite local
- **Frameworks**: Faker.js + expo-sqlite

## ⚙️ Configuración

### Prerrequisitos

```bash
# Node.js 18+ recomendado
node --version

# Expo CLI
npm install -g @expo/cli

# iOS (macOS only)
xcode-select --install

# Android
# Instalar Android Studio y configurar variables de entorno
```

### Instalación

```bash
# Instalar dependencias
npm install

# Instalar dependencias de testing adicionales
npm install --save-dev @testing-library/jest-native @testing-library/react-native detox msw jest-fetch-mock
```

### Configuración Inicial

```bash
# Inicializar mock data
npm run mock:init

# Poblar con datos de prueba
npm run mock:populate

# Verificar configuración
npm run mock:stats
```

## 🏃 Ejecutar Tests

### Tests Unitarios
```bash
# Todos los unit tests
npm run test:unit

# Con watch mode
npm run test:watch

# Con cobertura
npm run test:coverage
```

### Tests de Integración
```bash
# Tests de componentes
npm run test:integration
```

### Tests E2E
```bash
# Construir app de testing (iOS)
npm run test:e2e:build

# Ejecutar tests E2E
npm run test:e2e

# Para Android
npm run test:e2e:build:android
npm run test:e2e:android
```

### Suite Completa
```bash
# Todos los tests (excepto E2E)
npm run test:all

# Tests rápidos (unit + integration)
npm run test:quick

# Tests completos sin E2E
npm run test:full
```

## 📊 Mock Data System

### Gestión de Datos de Prueba

```bash
# Inicializar base de datos
npm run mock:init

# Poblar con datos (50 usuarios por defecto)
npm run mock:populate

# Poblar con cantidad específica
node scripts/mock-data.js populate 100

# Ver estadísticas
npm run mock:stats

# Limpiar datos
npm run mock:reset
```

### Estructura de Datos

El sistema genera datos realistas incluyendo:
- **Usuarios**: Perfiles completos con datos personales
- **Medidas**: Historial de mediciones corporales
- **Objetivos**: Metas nutricionales y de composición corporal
- **Planes**: Planes nutricionales y alimentarios
- **Citas**: Consultas médicas y especializadas

### Uso en Tests

```typescript
import { mockDataGenerator, mockDatabase } from '../src/core/mock-data';

// Generar usuario de prueba
const user = mockDataGenerator.generateUser({
  rol: 'patient',
  sexo: 'masculino'
});

// Generar dataset completo
const dataset = mockDataGenerator.generateUserDataset();

// Acceder a base de datos
const users = await mockDatabase.getUsers(10);
const measurements = await mockDatabase.getUserMeasurements(user.id);
```

## 🚀 CI/CD Pipeline

### GitHub Actions

El pipeline incluye:

1. **Unit & Integration Tests**
   - Node.js 18.x y 20.x
   - Cobertura de código
   - Type checking

2. **E2E Tests**
   - Solo en rama main o con label 'e2e'
   - iOS Simulator
   - Timeout de 30 minutos

3. **Quality Gates**
   - Cobertura >80%
   - Reportes de calidad
   - Notificaciones de fallos

4. **Build & Deploy**
   - Build para web y Android
   - Upload de artifacts
   - Deploy a staging (placeholder)

### Configuración Local

```bash
# Ejecutar pipeline localmente
npm run test:all

# Verificar calidad de código
npm run lint
npm run typecheck

# Generar reportes
npm run test:coverage
```

## 📈 Reportes y Cobertura

### Cobertura de Código

```bash
# Generar reporte HTML
npm run test:coverage

# Los reportes se generan en:
# - coverage/lcov-report/index.html (HTML)
# - coverage/lcov.info (LCOV)
# - coverage/coverage-summary.json (JSON)
```

### Métricas de Calidad

- **Cobertura mínima**: 80%
- **Archivos incluidos**:
  - `src/**/*.{ts,tsx}`
  - `app/**/*.{ts,tsx}`
- **Archivos excluidos**:
  - Tests y archivos de configuración
  - Archivos generados

### Reportes de Test Results

Los resultados se guardan en `test-results/`:
- `test-report.json`: Resumen completo
- Cobertura por suite de tests
- Información del entorno

## 🔧 Debugging

### Problemas Comunes

#### Tests no pasan en CI pero sí localmente
```bash
# Verificar versiones de Node.js
node --version

# Limpiar cache
npm run mock:reset
rm -rf node_modules/.cache
```

#### E2E tests fallan
```bash
# Verificar configuración de Detox
npx detox clean-framework-cache
npx detox build-framework-cache

# Revisar logs detallados
DEBUG=1 npm run test:e2e
```

#### Mock data no se carga
```bash
# Reinicializar mock database
npm run mock:reset
npm run mock:init
npm run mock:populate
```

### Variables de Entorno

```bash
# Para testing
NODE_ENV=test

# Para E2E
DETOX_CONFIGURATION=ios.simulator

# Para CI
CI=true
```

### Logs y Debugging

```bash
# Ver logs detallados de Jest
DEBUG_PRINT_LIMIT=10000 npm run test:unit

# Ver logs de E2E
npm run test:e2e 2>&1 | tee e2e-debug.log
```

## 📝 Comandos Útiles

```bash
# Desarrollo
npm start                    # Iniciar Expo
npm run android             # Android
npm run ios                 # iOS

# Testing
npm run test:quick          # Tests rápidos
npm run test:all            # Suite completa
npm run test:coverage       # Con cobertura

# Mock Data
npm run mock:populate       # Poblar datos
npm run mock:stats          # Ver estadísticas

# Calidad
npm run lint                # Linting
npm run typecheck           # TypeScript check
```

## 🎯 Mejores Prácticas

### Writing Tests
- Usar `describe` y `it` para organización clara
- Nombrar tests descriptivamente
- Usar mocks apropiados para dependencias externas
- Verificar estados y no solo llamadas a funciones

### Mock Data
- Generar datos realistas pero predecibles
- Usar semillas para consistencia
- Limpiar datos entre tests
- Documentar esquemas de datos

### CI/CD
- Mantener builds rápidos (<10 min)
- Usar cache apropiadamente
- Configurar timeouts generosos para E2E
- Notificar fallos críticos

### Debugging
- Usar `--verbose` para más información
- Revisar logs de CI/CD
- Probar localmente antes de push
- Mantener tests independientes

---

## 📞 Soporte

Para issues relacionados con testing:

1. Revisar esta documentación
2. Verificar configuración local
3. Revisar logs de error
4. Crear issue con logs y pasos para reproducir

**Happy Testing! 🧪**
