# Omega Medicina

Aplicación multiplataforma de salud, nutrición y entrenamiento construida con **Expo + TypeScript**.

## � Flujo de la Aplicación (v2.0)

```
┌─────────────────────────────────────────────────────────────┐
│                    APP LAUNCH                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   ¿Está logueado?      │
              └────────────────────────┘
                    │           │
                   NO          SÍ
                    │           │
                    ▼           ▼
         ┌──────────────┐  ┌─────────────────┐
         │ HOME PÚBLICA │  │ SELECTOR DE ROL │
         │  (Changelog) │  │ Paciente/Médico │
         │  + Login     │  │    /Admin       │
         └──────────────┘  └─────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
             ┌──────────┐   ┌──────────┐   ┌──────────┐
             │ PACIENTE │   │  MÉDICO  │   │  ADMIN   │
             │   HOME   │   │   HOME   │   │DASHBOARD │
             └──────────┘   └──────────┘   └──────────┘
```

### Header Global
En todas las pantallas autenticadas hay un **header con selector de rol** que permite cambiar de rol sin cerrar sesión.

## 🚀 Características

### Para Pacientes
- **Home por intención**: "¿Qué querés hacer hoy?" con 3 opciones principales
- **Situación actual**: Health Score, semáforos por área, métricas recientes
- **Training Tracker**: Calendario semanal, registro rápido (tipo/duración/RPE), análisis de calidad y consistencia
- **Diet Tracker**: Registro diario simplificado (calidad 1-5, proteína, verduras, ultraprocesados, agua), score nutricional 0-100
- **Recomendaciones**: Sugerencias personalizadas basadas en los datos registrados
- **Modo offline** con cache local

### Para Médicos
- **Dashboard** con turnos del día y acciones rápidas
- **Gestión de turnos** con filtros y estados
- **Lista de pacientes** con búsqueda y Health Score
- **Registros médicos**: Evolución clínica y estudios por paciente
- **Plantillas** de planes y recordatorios
- **Generación de PDF** para informes

### Para Administradores
- **Panel de usuarios**: Lista con permisos editables
- **Gestión de roles**: Asignar/quitar permisos (Paciente/Médico/Admin)
- **Auditoría**: Log de acciones recientes (cambios de rol, registros creados)

## 📱 Plataformas

- iOS
- Android
- Web

## 🛠️ Stack Tecnológico

- **Framework**: Expo SDK 54
- **Lenguaje**: TypeScript
- **Navegación**: Expo Router (file-based routing)
- **Estado/Fetch**: TanStack Query (React Query)
- **Formularios**: react-hook-form + zod
- **Almacenamiento**: AsyncStorage + expo-secure-store
- **Notificaciones**: expo-notifications
- **PDF**: expo-print + expo-sharing
- **Gráficos**: react-native-svg
- **UI**: Componentes custom + lucide-react-native

## 🏃 Inicio Rápido

### Requisitos
- Node.js 18+
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)

### Instalación

```bash
# Clonar o navegar al directorio
cd omega-medicina-app

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npx expo start
```

### Ejecutar en dispositivo/emulador

```bash
# iOS (requiere macOS)
npx expo run:ios

# Android
npx expo run:android

# Web
npx expo start --web
```

## 🔐 Modo Demo

La app incluye un modo demo completo sin necesidad de backend.

### Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Paciente | paciente@demo.com | demo123 |
| Médico | medico@demo.com | demo123 |

## 📁 Estructura del Proyecto

```
omega-medicina-app/
├── app/                      # Rutas Expo Router
│   ├── _layout.tsx          # Layout raíz con providers
│   ├── index.tsx            # Entry point con routing por auth/rol
│   ├── role-selector.tsx    # Selector de rol post-login
│   ├── (public)/            # Pantallas públicas (sin auth)
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Home con changelog
│   │   └── login.tsx        # Login con demo
│   ├── (patient)/           # Tabs del paciente
│   │   ├── _layout.tsx      # Con RoleHeader
│   │   ├── home.tsx         # Selector de intención
│   │   ├── situation.tsx    # Estado actual + semáforos
│   │   ├── training.tsx     # Training Tracker
│   │   ├── nutrition.tsx    # Diet Tracker
│   │   ├── health.tsx       # Métricas detalladas
│   │   └── profile.tsx
│   ├── (doctor)/            # Tabs del médico
│   │   ├── _layout.tsx      # Con RoleHeader
│   │   ├── home.tsx         # Dashboard médico
│   │   ├── appointments.tsx # Gestión de turnos
│   │   ├── patients.tsx     # Lista de pacientes
│   │   ├── records.tsx      # Registros médicos
│   │   └── profile.tsx
│   └── (admin)/             # Panel de administración
│       ├── _layout.tsx      # Con RoleHeader
│       ├── dashboard.tsx    # Usuarios + permisos + auditoría
│       ├── users.tsx        # Gestión detallada
│       └── audit.tsx        # Log completo
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── RoleHeader.tsx   # Header global con selector de rol
│   │   └── ui/
│   │       ├── Card.tsx
│   │       ├── Button.tsx
│   │       └── ...
│   ├── constants/
│   │   └── theme.ts         # Colores, espaciado, tipografía
│   ├── contexts/
│   │   ├── AuthContext.tsx  # Autenticación + permisos
│   │   └── RoleContext.tsx  # Rol activo + persistencia
│   ├── models/
│   │   └── index.ts         # Tipos (User, Permissions, Trackers, etc.)
│   ├── mock/
│   │   ├── mockData.ts      # Datos de demo (changelog, trackers, etc.)
│   │   └── mockApi.ts       # API simulada
│   └── services/
│       ├── api/
│       ├── storage/
│       │   └── secureStorage.ts  # Token + activeRole
│       └── notifications/
├── assets/                   # Iconos y splash
├── app.json                  # Configuración Expo
├── package.json
└── tsconfig.json
```

## 🔌 Integración con Backend

La app está preparada para conectarse a un backend Flask (ONV2).

### Endpoints esperados

```
POST /auth/login
GET  /auth/me

GET  /patients/:id/measurements
POST /patients/:id/measurements

GET  /patients/:id/reminders
POST /patients/:id/reminders

GET  /patients/:id/health-score

GET  /doctors/:id/appointments
GET  /doctors/:id/patients

POST /patients/:id/consultations
```

### Activar modo real

En `src/services/api/config.ts`:

```typescript
export const API_CONFIG = {
  USE_DEMO_MODE: false,  // Cambiar a false
  BASE_URL: 'http://tu-servidor:5000/api/v1',
  // ...
};
```

## 📊 Health Score

El Health Score (0-100) se calcula basándose en:

| Componente | Puntos | Descripción |
|------------|--------|-------------|
| Datos completos | 0-30 | Peso, medidas, signos vitales registrados |
| Tareas diarias | 0-30 | Cumplimiento del checklist semanal |
| Métricas en rango | 0-25 | Valores dentro de parámetros saludables |
| Constancia | 0-15 | Registros regulares y consistentes |

## 🔔 Notificaciones

La app soporta notificaciones locales para:
- Recordatorios de tareas diarias
- Alertas de controles próximos
- Recordatorios de turnos (médicos)

## 🔒 Seguridad y Privacidad

- Tokens JWT almacenados en SecureStore
- Datos sensibles no expuestos en logs
- Preparado para cumplimiento GDPR
- Modo demo sin datos reales

## 📝 Decisiones de Diseño

1. **Expo Router**: Navegación basada en archivos para mejor organización
2. **TanStack Query**: Cache automático y sincronización de datos
3. **Zod + react-hook-form**: Validación de formularios type-safe
4. **Componentes UI custom**: Control total sobre el diseño
5. **Mock API intercambiable**: Fácil transición a backend real

## 🚧 Próximas Funcionalidades

- [ ] Onboarding completo para nuevos pacientes
- [ ] Sistema de bloques nutricionales (P/G/C)
- [ ] Videos de movilidad integrados
- [ ] Sincronización con wearables
- [ ] Chat médico-paciente
- [ ] Exportación de datos

## 📄 Licencia

Proyecto privado - Omega Medicina © 2024
