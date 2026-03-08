// Admin - Gestión de permisos por paciente

import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useScale } from '../../src/hooks/useScale';

export default function PermissionsScreen() {
  const { s } = useScale();

  const features = [
    { emoji: '👨‍⚕️', title: 'Asignar profesionales a pacientes', desc: 'Vincular médicos, nutricionistas y entrenadores con sus pacientes' },
    { emoji: '🔐', title: 'Control de módulos', desc: 'Habilitar/deshabilitar acceso a Clínica, Nutrición y Entrenamiento por profesional' },
    { emoji: '👁️', title: 'Solo lectura vs Edición', desc: 'Profesionales sin permiso ven datos pero no pueden modificar' },
    { emoji: '📊', title: 'Vista por paciente', desc: 'Ver todos los profesionales asignados a cada paciente y sus permisos' },
  ];

  const $ = useMemo(() => ({
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    scroll: { padding: 20 * s, paddingBottom: 40 * s } as const,
    title: { fontSize: 22 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 4 * s },
    subtitle: { fontSize: 13 * s, color: '#64748b', marginBottom: 24 * s },
    card: {
      backgroundColor: '#111', borderRadius: 14 * s, padding: 18 * s, marginBottom: 10 * s,
      borderWidth: 1, borderColor: '#1a1a1a', flexDirection: 'row' as const, alignItems: 'flex-start' as const,
    },
    cardEmoji: { fontSize: 28 * s, marginRight: 14 * s, marginTop: 2 * s },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 15 * s, fontWeight: '700' as const, color: '#e2e8f0', marginBottom: 4 * s },
    cardDesc: { fontSize: 13 * s, color: '#94a3b8', lineHeight: 18 * s },
    comingSoon: {
      backgroundColor: '#d6515115', borderRadius: 14 * s, padding: 20 * s, marginTop: 16 * s,
      borderWidth: 1, borderColor: '#d6515130', alignItems: 'center' as const,
    },
    comingSoonEmoji: { fontSize: 36 * s, marginBottom: 10 * s },
    comingSoonTitle: { fontSize: 16 * s, fontWeight: '700' as const, color: '#d65151', marginBottom: 6 * s },
    comingSoonDesc: { fontSize: 13 * s, color: '#94a3b8', textAlign: 'center' as const, lineHeight: 18 * s },
  }), [s]);

  return (
    <ScrollView style={$.container} contentContainerStyle={$.scroll}>
      <Text style={$.title}>Permisos por Paciente</Text>
      <Text style={$.subtitle}>Control de acceso a módulos profesionales</Text>

      {features.map((f, i) => (
        <View key={i} style={$.card}>
          <Text style={$.cardEmoji}>{f.emoji}</Text>
          <View style={$.cardInfo}>
            <Text style={$.cardTitle}>{f.title}</Text>
            <Text style={$.cardDesc}>{f.desc}</Text>
          </View>
        </View>
      ))}

      <View style={$.comingSoon}>
        <Text style={$.comingSoonEmoji}>🚧</Text>
        <Text style={$.comingSoonTitle}>En desarrollo</Text>
        <Text style={$.comingSoonDesc}>
          Esta sección se conectará con la base de datos{'\n'}para gestionar permisos en tiempo real
        </Text>
      </View>
    </ScrollView>
  );
}
