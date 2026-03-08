// Login Screen - Email/password authentication

import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button, Input, Card } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'patient' | 'doctor' }>();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    const result = await login(data.email, data.password);

    if (result.success) {
      // Navigate based on role
      if (role === 'doctor') {
        router.replace('/(doctor)/appointments');
      } else {
        router.replace('/(patient)/dashboard');
      }
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }

    setIsLoading(false);
  };

  const fillDemoCredentials = () => {
    if (role === 'doctor') {
      setValue('email', 'medico@demo.com');
      setValue('password', 'demo123');
    } else {
      setValue('email', 'paciente@demo.com');
      setValue('password', 'demo123');
    }
  };

  const isDoctor = role === 'doctor';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Button
              title=""
              variant="ghost"
              onPress={() => router.back()}
              icon={<ArrowLeft size={24} color={Colors.text} />}
              style={styles.backButton}
            />
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <View style={[
              styles.roleIcon, 
              { backgroundColor: isDoctor ? `${Colors.secondary}15` : `${Colors.primary}15` }
            ]}>
              <Text style={styles.roleEmoji}>{isDoctor ? '👨‍⚕️' : '👤'}</Text>
            </View>
            <Text style={styles.title}>
              {isDoctor ? 'Acceso Médico' : 'Acceso Paciente'}
            </Text>
            <Text style={styles.subtitle}>
              Ingresa tus credenciales para continuar
            </Text>
          </View>

          {/* Form */}
          <Card style={styles.formCard} variant="elevated">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<Mail size={20} color={Colors.gray400} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Contraseña"
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="password"
                  leftIcon={<Lock size={20} color={Colors.gray400} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title="Iniciar Sesión"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              fullWidth
              size="lg"
              variant={isDoctor ? 'secondary' : 'primary'}
            />
          </Card>

          {/* Demo Mode */}
          <View style={styles.demoContainer}>
            <Text style={styles.demoText}>¿Modo demo?</Text>
            <Button
              title="Usar credenciales de prueba"
              variant="ghost"
              size="sm"
              onPress={fillDemoCredentials}
            />
          </View>

          {/* Privacy Notice */}
          <Text style={styles.privacyText}>
            Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad.
            Tus datos están protegidos según GDPR.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    marginLeft: -Spacing.md,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  roleIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  roleEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.gray500,
  },
  formCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    backgroundColor: `${Colors.error}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  demoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  demoText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  privacyText: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textAlign: 'center',
    lineHeight: 18,
  },
});
