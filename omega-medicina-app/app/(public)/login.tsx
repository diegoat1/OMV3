// Public Login Screen - Dark themed, consistent with landing

import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useScale } from '../../src/hooks/useScale';

// Web: inject style to fix autofill yellow background
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px #111111 inset !important;
      -webkit-text-fill-color: #ffffff !important;
      caret-color: #ffffff !important;
    }
  `;
  document.head.appendChild(style);
}

const logoWhite = require('../../assets/logo-white.png');

export default function LoginScreen() {
  const { s, isWide } = useScale();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = React.useRef<TextInput>(null);

  const [pendingVerification, setPendingVerification] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Completá email y documento');
      return;
    }

    setError('');
    const result = await login(email.trim(), password.trim()) as any;
    
    if (result.success) {
      router.replace('/role-selector');
    } else if (result.code === 'PENDING_VERIFICATION') {
      setPendingVerification(true);
    } else {
      setError(result.error || 'Credenciales inválidas');
    }
  };

  const $ = useMemo(() => ({
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    backBtn: {
      position: 'absolute' as const, zIndex: 10,
      top: Math.max(insets.top, 12) + 4, left: Math.max(insets.left, 16),
    },
    backBtnText: { fontSize: 15 * s, color: '#94a3b8', fontWeight: '600' as const },
    scrollContent: {
      flexGrow: 1, alignItems: 'center' as const, justifyContent: 'center' as const,
      paddingVertical: 40 * s,
    },
    inner: {
      width: '100%' as const, paddingHorizontal: 28 * s,
      ...(isWide ? { maxWidth: 520 * s } : {}),
    },
    header: { alignItems: 'center' as const, marginBottom: 32 * s },
    logo: {
      width: 56 * s, height: 56 * s, borderRadius: 16 * s,
      backgroundColor: '#d65151', justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 16 * s,
    },
    logoImg: { width: 40 * s, height: 40 * s },
    title: { fontSize: 24 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 6 * s },
    subtitle: { fontSize: 14 * s, color: '#94a3b8' },
    form: { marginBottom: 24 * s },
    inputGroup: { marginBottom: 18 * s },
    inputLabel: { fontSize: 13 * s, fontWeight: '600' as const, color: '#94a3b8', marginBottom: 6 * s },
    input: {
      backgroundColor: '#111111', borderRadius: 12 * s, borderWidth: 1, borderColor: '#1a1a1a',
      paddingHorizontal: 16 * s, paddingVertical: 14 * s, fontSize: 16 * s, color: '#fff',
    },
    passwordRow: { flexDirection: 'row' as const, alignItems: 'center' as const },
    passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
    eyeButton: {
      backgroundColor: '#111111', borderRadius: 12 * s, borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
      borderWidth: 1, borderColor: '#1a1a1a', paddingHorizontal: 14 * s, paddingVertical: 14 * s,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    eyeIcon: { fontSize: 18 * s },
    inputHint: { fontSize: 12 * s, color: '#555', marginTop: 4 * s },
    errorBox: {
      backgroundColor: '#2a1010', borderRadius: 10 * s, padding: 12 * s,
      borderWidth: 1, borderColor: '#d65151', marginBottom: 16 * s,
    },
    errorText: { color: '#f87171', fontSize: 13 * s, textAlign: 'center' as const },
    loginBtn: { backgroundColor: '#d65151', paddingVertical: 18 * s, borderRadius: 14 * s, alignItems: 'center' as const, marginTop: 4 * s },
    loginBtnDisabled: { opacity: 0.6 },
    loginBtnText: { color: '#fff', fontSize: 17 * s, fontWeight: '700' as const },
    helpText: { fontSize: 13 * s, color: '#64748b', textAlign: 'center' as const },
    helpLink: { color: '#d65151', fontWeight: '600' as const },
    // Pending verification
    pendingCard: {
      backgroundColor: '#111111', borderRadius: 16 * s, padding: 28 * s,
      borderWidth: 1, borderColor: '#1a1a1a', alignItems: 'center' as const,
    },
    pendingEmoji: { fontSize: 48 * s, marginBottom: 16 * s },
    pendingTitle: { fontSize: 20 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 8 * s, textAlign: 'center' as const },
    pendingDesc: { fontSize: 14 * s, color: '#94a3b8', textAlign: 'center' as const, lineHeight: 20 * s, marginBottom: 20 * s },
    pendingInfo: {
      backgroundColor: '#0a0a0a', borderRadius: 12 * s, padding: 16 * s,
      width: '100%' as const, marginBottom: 20 * s,
    },
    pendingInfoLabel: { fontSize: 12 * s, color: '#d65151', fontWeight: '700' as const, textTransform: 'uppercase' as const, marginBottom: 8 * s },
    pendingInfoRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 6 * s },
    pendingInfoIcon: { fontSize: 16 * s, marginRight: 8 * s },
    pendingInfoText: { fontSize: 14 * s, color: '#e2e8f0' },
    pendingBtn: {
      backgroundColor: '#d65151', paddingVertical: 16 * s, paddingHorizontal: 32 * s,
      borderRadius: 14 * s, alignItems: 'center' as const,
    },
    pendingBtnText: { color: '#fff', fontSize: 16 * s, fontWeight: '700' as const },
  }), [s, isWide, insets]);

  // Pending verification screen
  if (pendingVerification) {
    return (
      <View style={$.container}>
        <Pressable style={$.backBtn} onPress={() => setPendingVerification(false)}>
          <Text style={$.backBtnText}>← Volver</Text>
        </Pressable>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={$.scrollContent}>
          <View style={$.inner}>
            <View style={$.pendingCard}>
              <Text style={$.pendingEmoji}>⏳</Text>
              <Text style={$.pendingTitle}>Cuenta en verificación</Text>
              <Text style={$.pendingDesc}>
                Tu cuenta está pendiente de aprobación por el administrador.
                Comunicáte para acelerar el proceso.
              </Text>
              <View style={$.pendingInfo}>
                <Text style={$.pendingInfoLabel}>Contacto del administrador</Text>
                <View style={$.pendingInfoRow}>
                  <Text style={$.pendingInfoIcon}>📧</Text>
                  <Text style={$.pendingInfoText}>datoffaletti@gmail.com</Text>
                </View>
                <View style={$.pendingInfoRow}>
                  <Text style={$.pendingInfoIcon}>📱</Text>
                  <Text style={$.pendingInfoText}>+54 9 11 1234-5678</Text>
                </View>
              </View>
              <Pressable style={$.pendingBtn} onPress={() => setPendingVerification(false)}>
                <Text style={$.pendingBtnText}>Volver a intentar</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={$.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={$.backBtn} onPress={() => router.back()}>
        <Text style={$.backBtnText}>← Volver</Text>
      </Pressable>

      <ScrollView contentContainerStyle={$.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={$.inner}>
          <View style={$.header}>
            <View style={$.logo}>
              <Image source={logoWhite} style={$.logoImg} resizeMode="contain" />
            </View>
            <Text style={$.title}>Iniciar sesión</Text>
            <Text style={$.subtitle}>Ingresá tu email y documento</Text>
          </View>

          <View style={$.form}>
            <View style={$.inputGroup}>
              <Text style={$.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={$.input}
                placeholder="tu@email.com"
                placeholderTextColor="#555"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={$.inputGroup}>
              <Text style={$.inputLabel}>Documento (contraseña)</Text>
              <View style={$.passwordRow}>
                <TextInput
                  ref={passwordRef}
                  style={[$.input, $.passwordInput]}
                  placeholder="Ej: 12345678"
                  placeholderTextColor="#555"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={$.eyeButton}>
                  <Text style={$.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </Pressable>
              </View>
              <Text style={$.inputHint}>Tu número de documento es tu contraseña inicial</Text>
            </View>

            {error ? (
              <View style={$.errorBox}><Text style={$.errorText}>{error}</Text></View>
            ) : null}

            <Pressable
              style={({ pressed }) => [$.loginBtn, isLoading && $.loginBtnDisabled, pressed && { opacity: 0.85 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={$.loginBtnText}>Ingresar</Text>}
            </Pressable>
          </View>

          <Text style={$.helpText}>
            ¿No tenés cuenta?{' '}
            <Text style={$.helpLink} onPress={() => router.push('/(public)/welcome')}>Empezá acá</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
