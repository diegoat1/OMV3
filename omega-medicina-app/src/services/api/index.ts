// API Services - Barrel export

export { apiClient } from './apiClient';
export { API_CONFIG, buildUrl } from './config';
export { analyticsService } from './analyticsService';
export { userService } from './userService';
export { nutritionService } from './nutritionService';
export { trainingService } from './trainingService';
export { assignmentService } from './assignmentService';
export { telemedicineService } from './telemedicineService';
export { engagementService } from './engagementService';
export { adminService } from './adminService';
export { checkinService } from './checkinService';

// Re-export types
export type { DashboardData, BodyComposition, ScoreData } from './analyticsService';
export type { UserProfile, Measurement, Goal, AutoGoal } from './userService';
export type { NutritionPlan, Food, FoodPortion, Recipe, MealPlan, MealBlocks, MealPlanCalculation, ShoppingList, ShoppingListItem, MealMacros, AutoPlanResult, AutoPlanVelocityOption, MacroBlocks, BlockPreset, BlockAdjustResult, BlockSuggestionsResult, LibraryItem, FoodCatalogItem, DailyMealLog, DailySummary, DailyLogResponse, DailyLogHistoryResponse } from './nutritionService';
export type { StrengthData, Lift, TrainingPlan, TrainingSession, FreeProgram, TodaySession } from './trainingService';
export type { Assignment } from './assignmentService';
export type { Template, Appointment, MedicalRecord, TelemedPatient, ClinicalSituation, VitalSign, TelemedDocument, PerformanceRecord } from './telemedicineService';
export type { Reminder, Task, Insight, PerformanceData } from './engagementService';
