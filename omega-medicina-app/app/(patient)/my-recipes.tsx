// My Recipes - View recipes from backend library

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ChefHat, Search } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { BuildBanner } from '../../src/components/ui';
import { nutritionService } from '../../src/services/api';

interface RecipeItem {
  ID: number;
  NOMBRERECETA: string;
}

export default function MyRecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await nutritionService.getRecipes(searchQuery || undefined);
      const data = (res?.data || []) as any[];
      setRecipes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes])
  );

  return (
    <View style={styles.container}>
      <BuildBanner />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Recetas ({recipes.length})</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar receta..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadRecipes}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadRecipes} />}
      >
        {recipes.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <ChefHat size={48} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>No se encontraron recetas</Text>
          </View>
        ) : (
          recipes.map((recipe) => (
            <View key={recipe.ID} style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <View style={styles.recipeIcon}>
                  <ChefHat size={24} color={Colors.primary} />
                </View>
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName} numberOfLines={2}>
                    {recipe.NOMBRERECETA}
                  </Text>
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
  // Recipe Card
  recipeCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  recipeHeader: { flexDirection: 'row', alignItems: 'center' },
  recipeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  recipeInfo: { flex: 1, marginLeft: Spacing.md },
  recipeName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
});
