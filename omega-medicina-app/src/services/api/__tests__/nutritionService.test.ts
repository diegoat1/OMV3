// Nutrition Service Tests
import { rest, RestRequest, RestContext } from 'msw';
import { setupServer } from 'msw/node';
import { nutritionService } from '../nutritionService';
import { API_CONFIG } from '../config';

const { ENDPOINTS } = API_CONFIG;

// Mock server setup
const server = setupServer(
  // Mock nutrition plans endpoint
  rest.get(`${ENDPOINTS.NUTRITION_PLANS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: [
        {
          id: 1,
          nombre_apellido: 'Juan Pérez García',
          calorias: 2500,
          proteina: 187.5,
          grasa: 83.3,
          carbohidratos: 250,
          factor_actividad: 1.55,
          fecha_creacion: '2024-01-01T10:00:00Z',
        },
        {
          id: 2,
          nombre_apellido: 'María González',
          calorias: 2000,
          proteina: 150,
          grasa: 66.7,
          carbohidratos: 200,
          factor_actividad: 1.55,
          fecha_creacion: '2024-01-02T10:00:00Z',
        }
      ]
    }));
  }),

  // Mock single nutrition plan endpoint
  rest.get(`${ENDPOINTS.NUTRITION_PLAN_DETAIL}`, (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: {
        id: 1,
        nombre_apellido: 'Juan Pérez García',
        calorias: 2500,
        proteina: 187.5,
        grasa: 83.3,
        carbohidratos: 250,
        comidas: {
          desayuno: { proteina: 37.5, grasa: 16.7, carbohidratos: 50 },
          media_manana: { proteina: 15, grasa: 6.7, carbohidratos: 20 },
          almuerzo: { proteina: 62.5, grasa: 27.8, carbohidratos: 83.3 },
          merienda: { proteina: 15, grasa: 6.7, carbohidratos: 20 },
          media_tarde: { proteina: 7.5, grasa: 3.3, carbohidratos: 10 },
          cena: { proteina: 50, grasa: 22.2, carbohidratos: 66.7 },
        }
      }
    }));
  }),

  // Mock create plan endpoint
  rest.post(`${ENDPOINTS.NUTRITION_PLANS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        id: 3,
        nombre_apellido: 'Nuevo Usuario',
        calorias: 2200,
        proteina: 165,
        grasa: 73.3,
        carbohidratos: 220,
      }
    }));
  }),

  // Mock adjust calories endpoint
  rest.post(`${ENDPOINTS.NUTRITION_PLAN_ADJUST}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        id: 1,
        nombre_apellido: 'Juan Pérez García',
        calorias: 2700,
        proteina: 202.5,
        grasa: 90,
        carbohidratos: 270,
      }
    }));
  }),

  // Mock foods endpoint
  rest.get(`${ENDPOINTS.NUTRITION_FOODS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: [
        {
          id: 1,
          nombre: 'Pollo a la plancha',
          proteina: 25,
          grasa: 3.5,
          carbohidratos: 0,
          fibra: 0,
          grupo1: 'Proteinas',
          porcion1: 100,
        },
        {
          id: 2,
          nombre: 'Arroz blanco',
          proteina: 2.5,
          grasa: 0.3,
          carbohidratos: 25,
          fibra: 0.4,
          grupo1: 'Cereales',
          porcion1: 100,
        }
      ]
    }));
  }),

  // Mock food details endpoint
  rest.get(`${ENDPOINTS.NUTRITION_FOOD_DETAIL}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        id: 1,
        nombre: 'Pollo a la plancha',
        proteina: 25,
        grasa: 3.5,
        carbohidratos: 0,
        fibra: 0,
        grupo1: 'Proteinas',
        porcion1: 100,
        grupo2: 'Carnes blancas',
        porcion2: 120,
      }
    }));
  }),

  // Mock food portions endpoint
  rest.get(`${ENDPOINTS.NUTRITION_FOOD_PORTIONS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: [
        { nombre: 'pechuga pequeña', gramos: 80 },
        { nombre: 'pechuga mediana', gramos: 120 },
        { nombre: 'pechuga grande', gramos: 150 },
      ]
    }));
  }),

  // Mock recipes endpoint
  rest.get(`${ENDPOINTS.NUTRITION_RECIPES}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: [
        {
          id: 1,
          nombre: 'Ensalada de pollo',
          ingredientes: 'Pollo, lechuga, tomate, aceite de oliva',
          preparacion: 'Cortar y mezclar todos los ingredientes',
          proteina: 30,
          grasa: 15,
          carbohidratos: 10,
        },
        {
          id: 2,
          nombre: 'Pechuga de pollo con arroz',
          ingredientes: 'Pollo, arroz, verduras',
          preparacion: 'Cocinar pollo y arroz por separado',
          proteina: 35,
          grasa: 5,
          carbohidratos: 40,
        }
      ]
    }));
  }),

  // Mock recipe details endpoint
  rest.get(`${ENDPOINTS.NUTRITION_RECIPE_DETAIL}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        id: 1,
        nombre: 'Ensalada de pollo',
        ingredientes: 'Pollo, lechuga, tomate, aceite de oliva',
        preparacion: 'Cortar y mezclar todos los ingredientes',
        proteina: 30,
        grasa: 15,
        carbohidratos: 10,
      }
    }));
  }),

  // Mock calculate recipe endpoint
  rest.post(`${ENDPOINTS.NUTRITION_RECIPE_CALCULATE}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        recipe_id: 1,
        macros_por_porcion: { proteina: 15, grasa: 7.5, carbohidratos: 5 },
        porciones: 2,
        macros_totales: { proteina: 30, grasa: 15, carbohidratos: 10 },
      }
    }));
  }),

  // Mock meal plans endpoint
  rest.get(`${ENDPOINTS.NUTRITION_MEAL_PLANS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: [
        {
          id: 1,
          user_dni: 12345678,
          tipo_plan: 'recetas',
          plan_json: '{"desayuno": [1, 2], "almuerzo": [3]}',
          activo: true,
          calorias_totales: 2200,
          comidas_activas: 6,
          total_recetas: 15,
          fecha_creacion: '2024-01-01T10:00:00Z',
        }
      ]
    }));
  }),

  // Mock create meal plan endpoint
  rest.post(`${ENDPOINTS.NUTRITION_MEAL_PLANS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        id: 2,
        user_dni: 87654321,
        tipo_plan: 'recetas',
        plan_json: '{"desayuno": [1]}',
        activo: true,
        calorias_totales: 800,
        comidas_activas: 1,
        total_recetas: 1,
      }
    }));
  }),

  // Mock meal blocks endpoint
  rest.get(`${ENDPOINTS.NUTRITION_MEAL_BLOCKS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        calorias: 2500,
        proteina_total: 187.5,
        grasa_total: 83.3,
        ch_total: 250,
        libertad: 0,
        comidas: {
          desayuno: {
            porcentajes: { proteina: 15, grasa: 6.7, carbohidratos: 20 },
            gramos: { proteina: 37.5, grasa: 16.7, carbohidratos: 50 },
          },
          almuerzo: {
            porcentajes: { proteina: 25, grasa: 11.1, carbohidratos: 33.3 },
            gramos: { proteina: 62.5, grasa: 27.8, carbohidratos: 83.3 },
          },
        }
      }
    }));
  }),

  // Mock calculate meal plan endpoint
  rest.get(`${ENDPOINTS.NUTRITION_MEAL_PLAN_CALCULATE}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        plan_id: 1,
        calculations: {
          desayuno: {
            macros_comida: { proteina: 37.5, grasa: 16.7, carbohidratos: 50 },
            recetas: [
              { recipe_id: 1, calculation: { porciones: 2, macros: { proteina: 30, grasa: 15, carbohidratos: 10 } } }
            ]
          }
        }
      }
    }));
  }),

  // Mock shopping list endpoint
  rest.get(`${ENDPOINTS.NUTRITION_MEAL_PLAN_SHOPPING}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        shopping_list: [
          { ingrediente: 'Pollo', cantidad_g: 500, en_recetas: ['Ensalada de pollo'] },
          { ingrediente: 'Lechuga', cantidad_g: 200, en_recetas: ['Ensalada de pollo'] },
          { ingrediente: 'Arroz', cantidad_g: 300, en_recetas: ['Pechuga con arroz'] },
        ],
        total_ingredientes: 3,
        total_recetas: 2,
      }
    }));
  }),

  // Mock auto calculate endpoint
  rest.post(`${ENDPOINTS.NUTRITION_AUTO_CALCULATE}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        plan: {
          calorias: 2500,
          proteina: 187.5,
          grasa: 83.3,
          carbohidratos: 250,
        },
        factor_actividad: 1.55,
        ajuste_realizado: true,
      }
    }));
  })
);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

describe('Nutrition Service', () => {
  describe('Nutrition Plans', () => {
    it('should fetch all nutrition plans successfully', async () => {
      const result = await nutritionService.getPlans();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toMatchObject({
        id: 1,
        nombre_apellido: 'Juan Pérez García',
        calorias: 2500,
        proteina: 187.5,
      });
    });

    it('should fetch plans for specific user', async () => {
      const result = await nutritionService.getPlans('user_123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fetch single nutrition plan successfully', async () => {
      const result = await nutritionService.getPlan(1);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 1,
        nombre_apellido: 'Juan Pérez García',
        calorias: 2500,
        comidas: expect.any(Object),
      });
    });

    it('should create nutrition plan successfully', async () => {
      const planData = {
        nombre_apellido: 'Nuevo Usuario',
        calorias: 2200,
        proteina: 165,
        grasa: 73.3,
        carbohidratos: 220,
      };

      const result = await nutritionService.createPlan(planData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(3);
      expect(result.data?.calorias).toBe(2200);
    });

    it('should adjust calories in plan successfully', async () => {
      const result = await nutritionService.adjustCalories(1, { calorias: 2700 });

      expect(result.success).toBe(true);
      expect(result.data?.calorias).toBe(2700);
      expect(result.data?.proteina).toBe(202.5);
    });
  });

  describe('Foods', () => {
    it('should fetch all foods successfully', async () => {
      const result = await nutritionService.getFoods();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toMatchObject({
        id: 1,
        nombre: 'Pollo a la plancha',
        proteina: 25,
        grasa: 3.5,
        carbohidratos: 0,
      });
    });

    it('should search foods successfully', async () => {
      const result = await nutritionService.getFoods('pollo');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fetch food details successfully', async () => {
      const result = await nutritionService.getFood(1);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 1,
        nombre: 'Pollo a la plancha',
        grupo1: 'Proteinas',
        porcion1: 100,
      });
    });

    it('should fetch food portions successfully', async () => {
      const result = await nutritionService.getFoodPortions(1);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[0]).toMatchObject({
        nombre: 'pechuga pequeña',
        gramos: 80,
      });
    });
  });

  describe('Recipes', () => {
    it('should fetch all recipes successfully', async () => {
      const result = await nutritionService.getRecipes();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toMatchObject({
        id: 1,
        nombre: 'Ensalada de pollo',
        proteina: 30,
        grasa: 15,
        carbohidratos: 10,
      });
    });

    it('should search recipes successfully', async () => {
      const result = await nutritionService.getRecipes('ensalada');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fetch recipe details successfully', async () => {
      const result = await nutritionService.getRecipe(1);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 1,
        nombre: 'Ensalada de pollo',
        ingredientes: expect.any(String),
        preparacion: expect.any(String),
      });
    });

    it('should calculate recipe successfully', async () => {
      const result = await nutritionService.calculateRecipe(1, { usuario: 'user_123', comida: 'desayuno' });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        recipe_id: 1,
        macros_por_porcion: expect.any(Object),
        macros_totales: expect.any(Object),
      });
    });
  });

  describe('Meal Plans', () => {
    it('should fetch meal plans successfully', async () => {
      const result = await nutritionService.getMealPlans();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toMatchObject({
        id: 1,
        user_dni: 12345678,
        tipo_plan: 'recetas',
        activo: true,
        calorias_totales: 2200,
      });
    });

    it('should create meal plan successfully', async () => {
      const planData = {
        user_dni: 87654321,
        tipo_plan: 'recetas',
        plan_json: '{"desayuno": [1]}',
        activo: true,
      };

      const result = await nutritionService.createMealPlan(planData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(2);
      expect(result.data?.tipo_plan).toBe('recetas');
    });
  });

  describe('Meal Blocks', () => {
    it('should fetch meal blocks successfully', async () => {
      const result = await nutritionService.getMealBlocks();

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        calorias: 2500,
        proteina_total: 187.5,
        grasa_total: 83.3,
        ch_total: 250,
        comidas: expect.any(Object),
      });
      expect(result.data?.comidas.desayuno).toMatchObject({
        porcentajes: expect.any(Object),
        gramos: expect.any(Object),
      });
    });
  });

  describe('Meal Plan Calculations', () => {
    it('should calculate meal plan successfully', async () => {
      const result = await nutritionService.calculateMealPlan(1);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        plan_id: 1,
        calculations: expect.any(Object),
      });
      expect(result.data?.calculations.desayuno).toMatchObject({
        macros_comida: expect.any(Object),
        recetas: expect.any(Array),
      });
    });

    it('should get shopping list successfully', async () => {
      const result = await nutritionService.getShoppingList(1);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        shopping_list: expect.any(Array),
        total_ingredientes: 3,
        total_recetas: 2,
      });
      expect(result.data?.shopping_list).toHaveLength(3);
      expect(result.data?.shopping_list[0]).toMatchObject({
        ingrediente: 'Pollo',
        cantidad_g: 500,
        en_recetas: expect.any(Array),
      });
    });
  });

  describe('Auto Calculations', () => {
    it('should auto calculate plan successfully', async () => {
      const result = await nutritionService.autoCalculatePlan(1.55);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        plan: expect.any(Object),
        factor_actividad: 1.55,
        ajuste_realizado: true,
      });
    });

    it('should use default activity factor when not provided', async () => {
      const result = await nutritionService.autoCalculatePlan();

      expect(result.success).toBe(true);
      expect(result.data?.factor_actividad).toBe(1.55);
    });
  });
});
