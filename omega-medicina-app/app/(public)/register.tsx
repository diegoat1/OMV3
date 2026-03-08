// Public Register Screen - New user registration with role selection

import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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

type DesiredRole = 'patient' | 'professional';

export default function RegisterScreen() {
  const { s, isWide } = useScale();
  const insets = useSafeAreaInsets();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [selectedRole, setSelectedRole] = useState<DesiredRole>(
    roleParam === 'professional' ? 'professional' : 'patient'
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const nombreRef = React.useRef<TextInput>(null);
  const emailRef = React.useRef<TextInput>(null);
  const docRef = React.useRef<TextInput>(null);
  const telRef = React.useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!nombre.trim() || !email.trim() || !documento.trim()) {
      setError('Completá nombre, email y documento');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { API_CONFIG } = require('../../src/services/api/config');
      const baseUrl = API_CONFIG.BASE_URL;

      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          documento: documento.trim(),
          telefono: telefono.trim(),
          desired_role: selectedRole,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccess(true);
      } else {
        setError(json.message || 'Error al registrar. Intentá de nuevo.');
      }
    } catch (err) {
      setError('Error de conexión. Verificá que el servidor esté activo.');
    } finally {
      setIsLoading(false);
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
    header: { alignItems: 'center' as const, marginBottom: 24 * s },
    logo: {
      width: 48 * s, height: 48 * s, borderRadius: 14 * s,
      backgroundColor: '#d65151', justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 12 * s,
    },
    logoImg: { width: 34 * s, height: 34 * s },
    title: { fontSize: 22 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 4 * s },
    subtitle: { fontSize: 14 * s, color: '#94a3b8', textAlign: 'center' as const },

    // Role toggle
    roleToggle: {
      flexDirection: 'row' as const, backgroundColor: '#111111', borderRadius: 12 * s,
      padding: 4 * s, marginBottom: 20 * s, borderWidth: 1, borderColor: '#1a1a1a',
    },
    roleOption: {
      flex: 1, paddingVertical: 12 * s, borderRadius: 10 * s, alignItems: 'center' as const,
    },
    roleOptionActive: { backgroundColor: '#d65151' },
    roleOptionText: { fontSize: 14 * s, color: '#94a3b8', fontWeight: '600' as const },
    roleOptionTextActive: { color: '#fff' },

    // Form
    form: { marginBottom: 20 * s },
    inputGroup: { marginBottom: 14 * s },
    inputLabel: { fontSize: 13 * s, fontWeight: '600' as const, color: '#94a3b8', marginBottom: 6 * s },
    input: {
      backgroundColor: '#111111', borderRadius: 12 * s, borderWidth: 1, borderColor: '#1a1a1a',
      paddingHorizontal: 16 * s, paddingVertical: 14 * s, fontSize: 16 * s, color: '#fff',
    },
    inputHint: { fontSize: 11 * s, color: '#555', marginTop: 3 * s },
    errorBox: {
      backgroundColor: '#2a1010', borderRadius: 10 * s, padding: 12 * s,
      borderWidth: 1, borderColor: '#d65151', marginBottom: 14 * s,
    },
    errorText: { color: '#f87171', fontSize: 13 * s, textAlign: 'center' as const },
    registerBtn: {
      backgroundColor: '#d65151', paddingVertical: 18 * s, borderRadius: 14 * s,
      alignItems: 'center' as const, marginTop: 4 * s,
    },
    registerBtnDisabled: { opacity: 0.6 },
    registerBtnText: { color: '#fff', fontSize: 17 * s, fontWeight: '700' as const },
    helpText: { fontSize: 13 * s, color: '#64748b', textAlign: 'center' as const },
    helpLink: { color: '#d65151', fontWeight: '600' as const },

    // Success
    successCard: {
      backgroundColor: '#111111', borderRadius: 16 * s, padding: 28 * s,
      borderWidth: 1, borderColor: '#1a1a1a', alignItems: 'center' as const,
    },
    successEmoji: { fontSize: 48 * s, marginBottom: 16 * s },
    successTitle: { fontSize: 20 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 8 * s, textAlign: 'center' as const },
    successDesc: { fontSize: 14 * s, color: '#94a3b8', textAlign: 'center' as const, lineHeight: 20 * s, marginBottom: 20 * s },
    successInfo: {
      backgroundColor: '#0a0a0a', borderRadius: 12 * s, padding: 16 * s,
      width: '100%' as const, marginBottom: 20 * s,
    },
    successInfoLabel: { fontSize: 12 * s, color: '#d65151', fontWeight: '700' as const, textTransform: 'uppercase' as const, marginBottom: 8 * s },
    successInfoRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 6 * s },
    successInfoIcon: { fontSize: 16 * s, marginRight: 8 * s },
    successInfoText: { fontSize: 14 * s, color: '#e2e8f0' },
    successBtn: {
      backgroundColor: '#d65151', paddingVertical: 16 * s, paddingHorizontal: 32 * s,
      borderRadius: 14 * s, alignItems: 'center' as const,
    },
    successBtnText: { color: '#fff', fontSize: 16 * s, fontWeight: '700' as const },
  }), [s, isWide, insets]);

  // Success screen
  if (success) {
    return (
      <View style={$.container}>
        <Pressable style={$.backBtn} onPress={() => router.push('/(public)/')}>
          <Text style={$.backBtnText}>← Inicio</Text>
        </Pressable>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={$.scrollContent}>
          <View style={$.inner}>
            <View style={$.successCard}>
              <Text style={$.successEmoji}>⏳</Text>
              <Text style={$.successTitle}>Registro enviado</Text>
              <Text style={$.successDesc}>
                Tu cuenta fue creada y está pendiente de verificación por el administrador.
                Te notificaremos cuando esté activa.
              </Text>
              <View style={$.successInfo}>
                <Text style={$.successInfoLabel}>Contacto del administrador</Text>
                <View style={$.successInfoRow}>
                  <Text style={$.successInfoIcon}>📧</Text>
                  <Text style={$.successInfoText}>datoffaletti@gmail.com</Text>
                </View>
                <View style={$.successInfoRow}>
                  <Text style={$.successInfoIcon}>📱</Text>
                  <Text style={$.successInfoText}>+54 9 11 1234-5678</Text>
                </View>
              </View>
              <Pressable style={$.successBtn} onPress={() => router.push('/(public)/')}>
                <Text style={$.successBtnText}>Volver al inicio</Text>
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
            <Text style={$.title}>Crear cuenta</Text>
            <Text style={$.subtitle}>Completá tus datos para registrarte</Text>
          </View>

          {/* Role toggle */}
          <View style={$.roleToggle}>
            <Pressable
              style={[$.roleOption, selectedRole === 'patient' && $.roleOptionActive]}
              onPress={() => setSelectedRole('patient')}
            >
              <Text style={[$.roleOptionText, selectedRole === 'patient' && $.roleOptionTextActive]}>
                💪 Paciente
              </Text>
            </Pressable>
            <Pressable
              style={[$.roleOption, selectedRole === 'professional' && $.roleOptionActive]}
              onPress={() => setSelectedRole('professional')}
            >
              <Text style={[$.roleOptionText, selectedRole === 'professional' && $.roleOptionTextActive]}>
                🩺 Profesional
              </Text>
            </Pressable>
          </View>

          <View style={$.form}>
            <View style={$.inputGroup}>
              <Text style={$.inputLabel}>Nombre completo</Text>
              <TextInput
                ref={nombreRef}
                style={$.input}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor="#555"
                value={nombre}
                onChangeText={(t) => { setNombre(t); setError(''); }}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={$.inputGroup}>
              <Text style={$.inputLabel}>Correo electrónico</Text>
              <TextInput
                ref={emailRef}
                style={$.input}
                placeholder="tu@email.com"
                placeholderTextColor="#555"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => docRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={$.inputGroup}>
              <Text style={$.inputLabel}>Documento (DNI)</Text>
              <TextInput
                ref={docRef}
                style={$.input}
                placeholder="Ej: 12345678"
                placeholderTextColor="#555"
                value={documento}
                onChangeText={(t) => { setDocumento(t); setError(''); }}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => telRef.current?.focus()}
                blurOnSubmit={false}
              />
              <Text style={$.inputHint}>Tu documento será tu contraseña inicial</Text>
            </View>

            <View style={$.inputGroup}>
              <Text style={$.inputLabel}>Teléfono (opcional)</Text>
              <TextInput
                ref={telRef}
                style={$.input}
                placeholder="Ej: +54 9 11 1234-5678"
                placeholderTextColor="#555"
                value={telefono}
                onChangeText={(t) => { setTelefono(t); setError(''); }}
                keyboardType="phone-pad"
                returnKeyType="go"
                onSubmitEditing={handleRegister}
              />
            </View>

            {error ? (
              <View style={$.errorBox}><Text style={$.errorText}>{error}</Text></View>
            ) : null}

            <Pressable
              style={({ pressed }) => [$.registerBtn, isLoading && $.registerBtnDisabled, pressed && { opacity: 0.85 }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={$.registerBtnText}>Crear cuenta</Text>}
            </Pressable>
          </View>

          <Text style={$.helpText}>
            ¿Ya tenés cuenta?{' '}
            <Text style={$.helpLink} onPress={() => router.push('/(public)/login')}>Iniciá sesión</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
