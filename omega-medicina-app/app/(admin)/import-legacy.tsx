// Admin - Base de Datos - Overview of connected databases

import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useScale } from '../../src/hooks/useScale';

export default function DatabaseScreen() {
  const { s } = useScale();

  const databases = [
    { emoji: '🔐', name: 'auth.db', desc: 'Usuarios, roles, sesiones y links paciente-usuario', tables: ['users', 'patient_user_link', 'audit_log'] },
    { emoji: '🏥', name: 'Basededatos', desc: 'Datos legacy: perfiles estáticos, dinámicos, dietas, recetas, alimentos', tables: ['PERFILESTATICO', 'PERFILDINAMICO', 'DIETA', 'RECETAS', 'ALIMENTOS'] },
    { emoji: '📹', name: 'telemedicina.db', desc: 'Pacientes de telemedicina y consultas', tables: ['TELEMED_PACIENTES'] },
  ];

  const tools = [
    { emoji: '📥', title: 'Importar datos legacy', desc: 'Migrar usuarios desde PERFILESTATICO a auth.db' },
    { emoji: '📤', title: 'Exportar datos', desc: 'Exportar usuarios y mediciones a CSV/JSON' },
    { emoji: '🔄', title: 'Sincronizar perfiles', desc: 'Vincular pacientes de Basededatos con users de auth.db' },
    { emoji: '🧹', title: 'Limpiar datos huérfanos', desc: 'Detectar y eliminar registros sin usuario asociado' },
    { emoji: '💾', title: 'Backup', desc: 'Crear copia de seguridad de todas las bases de datos' },
  ];

  const $ = useMemo(() => ({
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    scroll: { padding: 20 * s, paddingBottom: 40 * s } as const,
    title: { fontSize: 22 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 4 * s },
    subtitle: { fontSize: 13 * s, color: '#64748b', marginBottom: 24 * s },
    sectionTitle: { fontSize: 16 * s, fontWeight: '700' as const, color: '#e2e8f0', marginBottom: 12 * s, marginTop: 8 * s },
    dbCard: {
      backgroundColor: '#111', borderRadius: 14 * s, padding: 16 * s, marginBottom: 10 * s,
      borderWidth: 1, borderColor: '#1a1a1a',
    },
    dbHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 8 * s },
    dbEmoji: { fontSize: 24 * s, marginRight: 12 * s },
    dbName: { fontSize: 16 * s, fontWeight: '700' as const, color: '#fff' },
    dbDesc: { fontSize: 12 * s, color: '#94a3b8', marginBottom: 8 * s },
    dbTables: { flexDirection: 'row' as const, gap: 6 * s, flexWrap: 'wrap' as const },
    dbTable: {
      paddingHorizontal: 8 * s, paddingVertical: 3 * s, borderRadius: 5 * s,
      backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#252525',
    },
    dbTableText: { fontSize: 10 * s, color: '#64748b', fontFamily: 'monospace' as const },
    toolCard: {
      backgroundColor: '#111', borderRadius: 12 * s, padding: 14 * s, marginBottom: 8 * s,
      borderWidth: 1, borderColor: '#1a1a1a', flexDirection: 'row' as const, alignItems: 'flex-start' as const,
    },
    toolEmoji: { fontSize: 22 * s, marginRight: 12 * s, marginTop: 2 * s },
    toolInfo: { flex: 1 },
    toolTitle: { fontSize: 14 * s, fontWeight: '600' as const, color: '#e2e8f0', marginBottom: 3 * s },
    toolDesc: { fontSize: 12 * s, color: '#94a3b8' },
    comingSoon: {
      backgroundColor: '#f59e0b15', borderRadius: 12 * s, padding: 16 * s, marginTop: 16 * s,
      borderWidth: 1, borderColor: '#f59e0b30', alignItems: 'center' as const,
    },
    comingSoonEmoji: { fontSize: 30 * s, marginBottom: 8 * s },
    comingSoonTitle: { fontSize: 14 * s, fontWeight: '700' as const, color: '#f59e0b', marginBottom: 4 * s },
    comingSoonDesc: { fontSize: 12 * s, color: '#94a3b8', textAlign: 'center' as const },
  }), [s]);

  return (
    <ScrollView style={$.container} contentContainerStyle={$.scroll}>
      <Text style={$.title}>Base de Datos</Text>
      <Text style={$.subtitle}>Bases conectadas y herramientas de gestión</Text>

      <Text style={$.sectionTitle}>🗄️ Bases conectadas</Text>
      {databases.map((db, i) => (
        <View key={i} style={$.dbCard}>
          <View style={$.dbHeader}>
            <Text style={$.dbEmoji}>{db.emoji}</Text>
            <Text style={$.dbName}>{db.name}</Text>
          </View>
          <Text style={$.dbDesc}>{db.desc}</Text>
          <View style={$.dbTables}>
            {db.tables.map(t => (
              <View key={t} style={$.dbTable}>
                <Text style={$.dbTableText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <Text style={$.sectionTitle}>🛠️ Herramientas</Text>
      {tools.map((t, i) => (
        <View key={i} style={$.toolCard}>
          <Text style={$.toolEmoji}>{t.emoji}</Text>
          <View style={$.toolInfo}>
            <Text style={$.toolTitle}>{t.title}</Text>
            <Text style={$.toolDesc}>{t.desc}</Text>
          </View>
        </View>
      ))}

      <View style={$.comingSoon}>
        <Text style={$.comingSoonEmoji}>🚧</Text>
        <Text style={$.comingSoonTitle}>Herramientas en desarrollo</Text>
        <Text style={$.comingSoonDesc}>
          Las acciones de importación, exportación y backup{'\n'}se activarán próximamente
        </Text>
      </View>
    </ScrollView>
  );
}
