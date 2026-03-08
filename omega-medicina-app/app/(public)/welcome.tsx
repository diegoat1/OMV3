// Public Welcome - New User Onboarding (Professional vs Patient)
import React, { useMemo } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScale } from '../../src/hooks/useScale';

const logoWhite = require('../../assets/logo-white.png');

export default function WelcomeScreen() {
  const { s, isWide, width, height } = useScale();
  const insets = useSafeAreaInsets();

  const $ = useMemo(() => ({
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    backBtn: {
      position: 'absolute' as const,
      zIndex: 10,
      top: Math.max(insets.top, 12) + 4,
      left: Math.max(insets.left, 16),
    },
    backBtnText: { fontSize: 15 * s, color: '#94a3b8', fontWeight: '600' as const },
    scrollContent: {
      paddingHorizontal: 28 * s,
      paddingBottom: 24 * s,
      alignItems: 'center' as const,
      ...(isWide ? { minHeight: height, justifyContent: 'center' as const } : {}),
    },
    header: { alignItems: 'center' as const, marginBottom: 16 * s, marginTop: isWide ? 0 : Math.max(insets.top, 12) + 36 },
    logo: {
      width: 48 * s, height: 48 * s, borderRadius: 14 * s,
      backgroundColor: '#d65151', justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 8 * s,
    },
    logoImg: { width: 34 * s, height: 34 * s },
    title: { fontSize: 24 * s, fontWeight: '800' as const, color: '#fff', textAlign: 'center' as const, marginBottom: 4 * s },
    accent: { color: '#d65151' },
    subtitle: { fontSize: 14 * s, color: '#94a3b8', textAlign: 'center' as const, lineHeight: 20 * s },

    main: { width: '100%' as const, maxWidth: 1100 * s },
    mainWide: { flexDirection: 'row' as const, gap: 32 * s },
    col: { marginBottom: 8 * s },
    colLeft: { flex: 1 },
    colRight: { flex: 1 },

    sectionLabel: {
      fontSize: 12 * s, fontWeight: '700' as const, color: '#d65151',
      textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 * s, marginTop: 10 * s,
    },

    includesRow: { flexDirection: 'row' as const, gap: 10 * s },
    includeCard: {
      flexDirection: 'row' as const, backgroundColor: '#111111', borderRadius: 14 * s,
      padding: 12 * s, marginBottom: 8 * s, borderWidth: 1, borderColor: '#1a1a1a',
    },
    includeCardWide: { flex: 1, flexDirection: 'column' as const, alignItems: 'center' as const, marginBottom: 0, padding: 16 * s },
    includeIcon: { fontSize: 24 * s, marginRight: 12 * s },
    includeTitle: { fontSize: 14 * s, fontWeight: '700' as const, color: '#fff', marginBottom: 2 },
    includeDesc: { fontSize: 13 * s, color: '#94a3b8', lineHeight: 18 * s },

    infoRowWide: { flexDirection: 'row' as const },
    infoBlockL: { flex: 1, marginRight: isWide ? 12 * s : 0, marginBottom: 8 * s },
    infoBlockR: { flex: 1, marginLeft: isWide ? 12 * s : 0, marginBottom: 8 * s },

    benefitsCard: { backgroundColor: '#111111', borderRadius: 14 * s, padding: 14 * s, borderWidth: 1, borderColor: '#1a1a1a' },
    benefitRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, marginBottom: 8 * s },
    benefitCheck: { color: '#10b981', fontSize: 14 * s, fontWeight: '700' as const, marginRight: 10 * s, marginTop: 1 },
    benefitText: { flex: 1, fontSize: 14 * s, color: '#e2e8f0', lineHeight: 20 * s },

    stepRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 10 * s },
    stepNum: {
      width: 30 * s, height: 30 * s, borderRadius: 15 * s, backgroundColor: '#d65151',
      justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: 12 * s,
    },
    stepNumText: { color: '#fff', fontSize: 14 * s, fontWeight: '800' as const },
    stepTitle: { fontSize: 14 * s, fontWeight: '700' as const, color: '#fff', marginBottom: 1 },
    stepDesc: { fontSize: 13 * s, color: '#94a3b8' },

    roleCard: {
      backgroundColor: '#111111', borderRadius: 16 * s, padding: 18 * s,
      marginBottom: 12 * s, borderWidth: 2, borderColor: '#1a1a1a',
    },
    roleCardPatient: { borderColor: '#d65151' },
    roleHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 12 * s },
    roleEmoji: { fontSize: 32 * s, marginRight: 14 * s },
    roleTitle: { fontSize: 16 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 2 },
    roleSubtitle: { fontSize: 13 * s, color: '#94a3b8' },
    roleFeatures: { marginBottom: 12 * s },
    roleFeatureRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 5 * s },
    roleCheck: { color: '#10b981', fontSize: 13 * s, fontWeight: '700' as const, marginRight: 10 * s },
    roleFeatureText: { fontSize: 14 * s, color: '#e2e8f0' },
    roleBtnPro: { backgroundColor: '#2a2a2a', paddingVertical: 14 * s, borderRadius: 12 * s, alignItems: 'center' as const },
    roleBtnPatient: { backgroundColor: '#d65151', paddingVertical: 14 * s, borderRadius: 12 * s, alignItems: 'center' as const },
    roleBtnText: { color: '#fff', fontSize: 15 * s, fontWeight: '700' as const },
    footer: { fontSize: 12 * s, color: '#64748b', textAlign: 'center' as const, marginTop: 8 * s },
  }), [s, isWide, width, height, insets]);

  return (
    <View style={$.container}>
      <Pressable style={$.backBtn} onPress={() => router.back()}>
        <Text style={$.backBtnText}>← Volver</Text>
      </Pressable>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={$.scrollContent}>
        <View style={$.header}>
          <View style={$.logo}>
            <Image source={logoWhite} style={$.logoImg} resizeMode="contain" />
          </View>
          <Text style={$.title}>
            Conocé Omega<Text style={$.accent}>Medicina</Text>
          </Text>
          <Text style={$.subtitle}>
            Sistema integrado de seguimiento médico, nutrición y entrenamiento.
          </Text>
        </View>

        <View style={[$.main, isWide && $.mainWide]}>
          {/* Left: info */}
          <View style={[$.col, isWide && $.colLeft]}>
            <Text style={$.sectionLabel}>Qué incluye</Text>
            <View style={isWide ? $.includesRow : undefined}>
              {[
                { icon: '🩺', title: 'Seguimiento médico', desc: 'Historia clínica y screening.' },
                { icon: '🍽️', title: 'Nutrición personalizada', desc: 'Planes y recetas a medida.' },
                { icon: '💪', title: 'Entrenamiento', desc: 'Fuerza con progresión automática.' },
              ].map((item, i) => (
                <View key={i} style={[$.includeCard, isWide && $.includeCardWide]}>
                  <Text style={$.includeIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={$.includeTitle}>{item.title}</Text>
                    <Text style={$.includeDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={isWide ? $.infoRowWide : undefined}>
              <View style={$.infoBlockL}>
                <Text style={$.sectionLabel}>Beneficios</Text>
                <View style={$.benefitsCard}>
                  {['Métricas reales, no genéricas', 'Seguimiento remoto periódico', 'Plan ajustado a tu progreso'].map((t, i) => (
                    <View key={i} style={$.benefitRow}>
                      <Text style={$.benefitCheck}>✓</Text>
                      <Text style={$.benefitText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={$.infoBlockR}>
                <Text style={$.sectionLabel}>Cómo empezar</Text>
                {[
                  { n: '1', t: 'Crear cuenta', d: 'Email y contraseña.' },
                  { n: '2', t: 'Evaluación inicial', d: 'Perfil en 5 minutos.' },
                  { n: '3', t: 'Elegir plan', d: 'Gratis o con seguimiento.' },
                ].map((step, i) => (
                  <View key={i} style={$.stepRow}>
                    <View style={$.stepNum}><Text style={$.stepNumText}>{step.n}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={$.stepTitle}>{step.t}</Text>
                      <Text style={$.stepDesc}>{step.d}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Right: roles */}
          <View style={[$.col, isWide && $.colRight]}>
            <Text style={$.sectionLabel}>¿Cómo querés usar la plataforma?</Text>

            <Pressable style={({ pressed }) => [$.roleCard, pressed && { opacity: 0.9 }]} onPress={() => router.push({ pathname: '/(public)/register', params: { role: 'professional' } })}>
              <View style={$.roleHeader}>
                <Text style={$.roleEmoji}>🩺</Text>
                <View style={{ flex: 1 }}>
                  <Text style={$.roleTitle}>Soy profesional de la salud</Text>
                  <Text style={$.roleSubtitle}>Médico, nutricionista, entrenador</Text>
                </View>
              </View>
              <View style={$.roleFeatures}>
                {['Gestionar pacientes y sus planes', 'Controles y ajustes periódicos', 'Informes PDF profesionales'].map((f, i) => (
                  <View key={i} style={$.roleFeatureRow}>
                    <Text style={$.roleCheck}>✓</Text><Text style={$.roleFeatureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <View style={$.roleBtnPro}><Text style={$.roleBtnText}>Registrarme como profesional →</Text></View>
            </Pressable>

            <Pressable style={({ pressed }) => [$.roleCard, $.roleCardPatient, pressed && { opacity: 0.9 }]} onPress={() => router.push({ pathname: '/(public)/register', params: { role: 'patient' } })}>
              <View style={$.roleHeader}>
                <Text style={$.roleEmoji}>💪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={$.roleTitle}>Soy paciente / Quiero empezar</Text>
                  <Text style={$.roleSubtitle}>Mejorá tu salud y rendimiento</Text>
                </View>
              </View>
              <View style={$.roleFeatures}>
                {['Dashboard con tu progreso real', 'Plan nutricional y entrenamiento', 'Seguimiento médico integrado'].map((f, i) => (
                  <View key={i} style={$.roleFeatureRow}>
                    <Text style={$.roleCheck}>✓</Text><Text style={$.roleFeatureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <View style={$.roleBtnPatient}><Text style={$.roleBtnText}>Crear mi cuenta gratis →</Text></View>
            </Pressable>

            <Text style={$.footer}>5 minutos · Sin tarjeta de crédito</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
