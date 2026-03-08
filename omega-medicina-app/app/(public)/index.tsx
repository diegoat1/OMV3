// Public Home - Entry Screen (Decision Point)
import React, { useMemo } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useScale } from '../../src/hooks/useScale';

const logoWhite = require('../../assets/logo-white.png');

export default function PublicHomeScreen() {
  const { s, isWide, height } = useScale();

  const $ = useMemo(() => ({
    container: {
      flex: 1, backgroundColor: '#0a0a0a',
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    inner: {
      flex: 1, width: '100%' as const,
      justifyContent: 'space-between' as const,
      ...(isWide ? { maxWidth: 520 * s } : {}),
    },
    content: {
      flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const,
      paddingHorizontal: 32 * s,
    },
    logo: {
      width: 72 * s, height: 72 * s, borderRadius: 20 * s,
      backgroundColor: '#d65151', justifyContent: 'center' as const, alignItems: 'center' as const,
      marginBottom: 16 * s,
    },
    logoImg: { width: 52 * s, height: 52 * s },
    brand: { fontSize: 16 * s, fontWeight: '700' as const, color: '#fff', marginBottom: 24 * s, letterSpacing: 1 },
    brandAccent: { color: '#d65151' },
    title: { fontSize: 30 * s, fontWeight: '800' as const, color: '#fff', textAlign: 'center' as const, lineHeight: 38 * s },
    titleHighlight: { fontSize: 30 * s, fontWeight: '800' as const, color: '#d65151', textAlign: 'center' as const, marginBottom: 16 * s },
    subtitle: { fontSize: 15 * s, color: '#94a3b8', textAlign: 'center' as const, lineHeight: 22 * s, marginBottom: 24 * s },
    proofRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'center' as const },
    proofItem: { flexDirection: 'row' as const, alignItems: 'center' as const, marginHorizontal: 10 * s, marginBottom: 4 * s },
    proofCheck: { color: '#10b981', fontSize: 14 * s, marginRight: 5 * s, fontWeight: '700' as const },
    proofText: { color: '#64748b', fontSize: 13 * s },
    btns: { paddingHorizontal: 32 * s, paddingBottom: 40 * s, paddingTop: 16 * s },
    btnPrimary: { backgroundColor: '#d65151', paddingVertical: 18 * s, borderRadius: 14 * s, alignItems: 'center' as const, marginBottom: 12 * s },
    btnPrimaryText: { color: '#fff', fontSize: 17 * s, fontWeight: '700' as const },
    btnSecondary: {
      backgroundColor: 'transparent', paddingVertical: 18 * s, borderRadius: 14 * s,
      alignItems: 'center' as const, borderWidth: 2, borderColor: '#2a2a2a', marginBottom: 24 * s,
    },
    btnSecondaryText: { color: '#e2e8f0', fontSize: 17 * s, fontWeight: '600' as const },
    footer: { fontSize: 12 * s, color: '#333', textAlign: 'center' as const },
  }), [s, isWide]);

  return (
    <View style={$.container}>
      <View style={$.inner}>
        <View style={$.content}>
          <View style={$.logo}>
            <Image source={logoWhite} style={$.logoImg} resizeMode="contain" />
          </View>
          <Text style={$.brand}>
            Omega<Text style={$.brandAccent}>Medicina</Text>
          </Text>
          <Text style={$.title}>Tu salud, nutrición y entrenamiento</Text>
          <Text style={$.titleHighlight}>en un solo sistema</Text>
          <Text style={$.subtitle}>
            Seguimiento médico + nutrición + entrenamiento{'\n'}con métricas claras
          </Text>
          <View style={$.proofRow}>
            {['Basado en evidencia', 'Seguimiento remoto', 'Informes claros'].map((t, i) => (
              <View key={i} style={$.proofItem}>
                <Text style={$.proofCheck}>✓</Text>
                <Text style={$.proofText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={$.btns}>
          <Pressable style={({ pressed }) => [$.btnPrimary, pressed && { opacity: 0.85 }]} onPress={() => router.push('/(public)/login')}>
            <Text style={$.btnPrimaryText}>Iniciar sesión</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [$.btnSecondary, pressed && { opacity: 0.85 }]} onPress={() => router.push('/(public)/welcome')}>
            <Text style={$.btnSecondaryText}>Soy nuevo, quiero empezar</Text>
          </Pressable>
          <Text style={$.footer}>© 2025 OmegaMedicina</Text>
        </View>
      </View>
    </View>
  );
}
