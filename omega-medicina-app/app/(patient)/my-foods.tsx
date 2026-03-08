// My Foods - View foods from backend library

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { BuildBanner } from '../../src/components/ui';
import { nutritionService } from '../../src/services/api';

interface FoodItem {
  ID: number;
  Largadescripcion: string;
  Proteina: number;
  Grasa: number;
  CH: number;
  Fibra?: number;
  Grupo1?: string;
  Porcion1?: number;
  Grupo2?: string;
  Porcion2?: number;
}

export default function MyFoodsScreen() {
  const router = useRouter();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFoods = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await nutritionService.getFoods(searchQuery || undefined);
      const data = (res?.data || []) as any[];
      setFoods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading foods:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadFoods();
    }, [loadFoods])
  );

  const formatNutrient = (value: number | null | undefined, unit: string) => {
    if (value === null || value === undefined) return '-';
    return `${Math.round(value * 10) / 10}${unit}`;
  };

  return (
    <View style={styles.container}>
      <BuildBanner />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Alimentos ({foods.length})</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar alimento..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadFoods}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadFoods} />}
      >
        {foods.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <Search size={48} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>No se encontraron alimentos</Text>
          </View>
        ) : (
          foods.map((food) => (
            <View key={food.ID} style={styles.foodCard}>
              <View style={styles.foodHeader}>
                <View style={styles.foodImagePlaceholder}>
                  <Text style={styles.foodImagePlaceholderText}>🍽️</Text>
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={2}>
                    {food.Largadescripcion}
                  </Text>
                  {food.Grupo1 && (
                    <Text style={styles.foodBrand}>
                      {food.Grupo1}{food.Porcion1 ? ` · ${food.Porcion1}g` : ''}
                    </Text>
                  )}
                </View>
              </View>

              {/* Nutrients */}
              <View style={styles.nutrientsGrid}>
                <View style={styles.nutrientItem}>
                  <Text style={[styles.nutrientValue, { color: Colors.error }]}>
                    {formatNutrient(food.Proteina, 'g')}
                  </Text>
                  <Text style={styles.nutrientLabel}>Prot</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={[styles.nutrientValue, { color: Colors.warning }]}>
                    {formatNutrient(food.Grasa, 'g')}
                  </Text>
                  <Text style={styles.nutrientLabel}>Grasa</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={[styles.nutrientValue, { color: Colors.primary }]}>
                    {formatNutrient(food.CH, 'g')}
                  </Text>
                  <Text style={styles.nutrientLabel}>Carbs</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>
                    {formatNutrient(food.Fibra, 'g')}
                  </Text>
                  <Text style={styles.nutrientLabel}>Fibra</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: Spacing.xs },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  addButton: { padding: Spacing.xs },
  // Filter
  filterRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.surface },
  filterTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray100, gap: Spacing.xs },
  filterTabActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, color: Colors.gray500 },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  // Search
  searchRow: { flexDirection: 'row', padding: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text },
  // Content
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.lg, gap: Spacing.sm },
  emptyButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  // Food Card
  foodCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  foodHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  foodImage: { width: 56, height: 56, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100 },
  foodImagePlaceholder: { width: 56, height: 56, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100, justifyContent: 'center', alignItems: 'center' },
  foodImagePlaceholderText: { fontSize: 24 },
  foodInfo: { flex: 1, marginLeft: Spacing.md },
  foodName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  foodBrand: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  foodDate: { fontSize: FontSize.xs, color: Colors.gray400, marginTop: 2 },
  foodActions: { flexDirection: 'row', gap: Spacing.xs },
  actionButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray50, justifyContent: 'center', alignItems: 'center' },
  actionButtonActive: { backgroundColor: Colors.warning + '15' },
  // Nutrients
  nutrientsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.md, marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  nutrientItem: { alignItems: 'center', flex: 1 },
  nutrientValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  nutrientLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
