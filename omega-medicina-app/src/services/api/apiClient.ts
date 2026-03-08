// API Client - Handles all HTTP requests
// Prepared for Flask backend integration

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_CONFIG, buildUrl } from './config';
import { ApiResponse } from '../../models';

const TOKEN_KEY = 'auth_token';
const isWeb = Platform.OS === 'web';

class ApiClient {
  async getToken(): Promise<string | null> {
    try {
      if (isWeb) {
        return await AsyncStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      if (isWeb) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      if (isWeb) {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    params: Record<string, string> = {},
    body?: any
  ): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint, params);
    const token = await this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, params);
  }

  async post<T>(endpoint: string, body: any, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, params, body);
  }

  async put<T>(endpoint: string, body: any, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, params, body);
  }

  async patch<T>(endpoint: string, body: any, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, params, body);
  }

  async delete<T>(endpoint: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, params);
  }
}

export const apiClient = new ApiClient();
