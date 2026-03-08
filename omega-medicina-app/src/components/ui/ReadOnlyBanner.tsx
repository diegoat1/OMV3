// ReadOnlyBanner - Shows when professional doesn't have edit permission

import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Lock, Send } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

interface ReadOnlyBannerProps {
  module: 'medical' | 'nutrition' | 'training';
  patientName?: string;
  onRequestPermission?: () => void;
}

const moduleLabels = {
  medical: 'datos clínicos',
  nutrition: 'nutrición',
  training: 'entrenamiento',
};

export function ReadOnlyBanner({ module, patientName, onRequestPermission }: ReadOnlyBannerProps) {
  const handleRequest = () => {
    if (onRequestPermission) {
      onRequestPermission();
    } else {
      Alert.alert(
        'Solicitud enviada',
        'Se ha notificado al administrador para solicitar permiso de edición.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Lock size={18} color={Colors.warning} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Solo lectura</Text>
        <Text style={styles.description}>
          No tienes permiso para editar {moduleLabels[module]}
          {patientName ? ` de ${patientName}` : ''}.
        </Text>
      </View>
      <Pressable style={styles.requestButton} onPress={handleRequest}>
        <Send size={14} color={Colors.primary} />
        <Text style={styles.requestText}>Pedir permiso</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.warning,
  },
  description: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  requestText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
});
