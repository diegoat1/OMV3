// Open Food Facts Provider - Free food database API
// https://world.openfoodfacts.org/

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodProvider, FoodItem, FoodNutrients, FoodSearchResult } from './types';

const BASE_URL = 'https://world.openfoodfacts.org';
const CACHE_PREFIX = '@off_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  return fetch(url, {
    headers: {
      'User-Agent': 'OmegaMedicina/1.0 (https://omegamedicina.com)',
    },
  });
}

// Cache helpers
async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return data as T;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (error) {
    console.warn('Cache write failed:', error);
  }
}

// Transform OFF product to our FoodItem format
function transformProduct(product: any): FoodItem | null {
  if (!product || !product.product_name) return null;
  
  const nutrients = product.nutriments || {};
  
  return {
    id: `off_${product.code || product._id}`,
    barcode: product.code,
    name: product.product_name || product.product_name_es || 'Unknown',
    brand: product.brands,
    imageUrl: product.image_url,
    thumbnailUrl: product.image_small_url || product.image_thumb_url,
    nutrients: {
      calories: safeNumber(nutrients['energy-kcal_100g'] || nutrients.energy_100g / 4.184),
      protein: safeNumber(nutrients.proteins_100g),
      fat: safeNumber(nutrients.fat_100g),
      carbs: safeNumber(nutrients.carbohydrates_100g),
      fiber: safeNumber(nutrients.fiber_100g),
      sugar: safeNumber(nutrients.sugars_100g),
      sodium: safeNumber(nutrients.sodium_100g ? nutrients.sodium_100g * 1000 : null), // convert to mg
      saturatedFat: safeNumber(nutrients['saturated-fat_100g']),
    },
    servingSize: safeNumber(product.serving_quantity) ?? undefined,
    servingUnit: product.serving_size,
    source: 'openfoodfacts',
    sourceId: product.code,
    lastUpdated: product.last_modified_t ? new Date(product.last_modified_t * 1000).toISOString() : undefined,
  };
}

function safeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

export const openFoodFactsProvider: FoodProvider = {
  name: 'Open Food Facts',
  
  async searchByText(query: string, page = 1, pageSize = 20): Promise<FoodSearchResult> {
    const cacheKey = `search_${query}_${page}_${pageSize}`;
    const cached = await getCached<FoodSearchResult>(cacheKey);
    if (cached) return cached;
    
    try {
      const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}`;
      
      const response = await rateLimitedFetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      const items: FoodItem[] = (data.products || [])
        .map(transformProduct)
        .filter((item: FoodItem | null): item is FoodItem => item !== null);
      
      const result: FoodSearchResult = {
        items,
        totalCount: data.count || 0,
        page,
        pageSize,
        query,
      };
      
      await setCache(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error('Open Food Facts search error:', error);
      return {
        items: [],
        totalCount: 0,
        page,
        pageSize,
        query,
      };
    }
  },
  
  async getByBarcode(barcode: string): Promise<FoodItem | null> {
    const cacheKey = `barcode_${barcode}`;
    const cached = await getCached<FoodItem>(cacheKey);
    if (cached) return cached;
    
    try {
      const url = `${BASE_URL}/api/v0/product/${barcode}.json`;
      
      const response = await rateLimitedFetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 1 || !data.product) {
        return null;
      }
      
      const item = transformProduct(data.product);
      if (item) {
        await setCache(cacheKey, item);
      }
      
      return item;
      
    } catch (error) {
      console.error('Open Food Facts barcode error:', error);
      return null;
    }
  },
  
  async getNutrients(foodId: string): Promise<FoodNutrients | null> {
    // Extract barcode from our ID format
    const barcode = foodId.replace('off_', '');
    const item = await this.getByBarcode(barcode);
    return item?.nutrients || null;
  },
};
