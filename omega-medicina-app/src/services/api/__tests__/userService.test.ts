// User Service Tests
import { rest, RestRequest, RestContext } from 'msw';
import { setupServer } from 'msw/node';
import { userService, UserProfile, Measurement, Goal, AutoGoal } from '../userService';
import { API_CONFIG } from '../config';

const { ENDPOINTS } = API_CONFIG;

// Mock server setup
const server = setupServer(
  // Mock user profile endpoint
  rest.get(`${ENDPOINTS.USER_DETAIL}`, (req: RestRequest, res: any, ctx: RestContext) => {
    const userId = req.url.searchParams.get('id');
    return res(ctx.json({
      success: true,
      data: {
        dni: 12345678,
        nombre_apellido: 'Juan Pérez García',
        email: 'juan.perez@example.com',
        sexo: 'masculino',
        fecha_nacimiento: '1985-05-15',
        altura: 175,
        telefono: '+1234567890',
      }
    }));
  }),

  // Mock update user endpoint
  rest.put(`${ENDPOINTS.USER_DETAIL}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        dni: 12345678,
        nombre_apellido: 'Juan Pérez García',
        email: 'juan.perez@example.com',
        sexo: 'masculino',
        fecha_nacimiento: '1985-05-15',
        altura: 175,
        telefono: '+1234567890',
      }
    }));
  }),

  // Mock measurements endpoint
  rest.get(`${ENDPOINTS.USER_MEASUREMENTS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: [
        {
          id: 1,
          fecha: '2024-01-01',
          peso: 80.5,
          circunferencia_abdomen: 90,
          circunferencia_cintura: 85,
          circunferencia_cadera: 95,
          circunferencia_cuello: 38,
          bf_percentage: 18.5,
          ffmi: 18.2,
          imc: 26.2,
        },
        {
          id: 2,
          fecha: '2024-01-15',
          peso: 79.2,
          circunferencia_abdomen: 88,
          circunferencia_cintura: 83,
          circunferencia_cadera: 94,
          circunferencia_cuello: 37.5,
          bf_percentage: 17.8,
          ffmi: 18.4,
          imc: 25.8,
        }
      ]
    }));
  }),

  // Mock add measurement endpoint
  rest.post(`${ENDPOINTS.USER_MEASUREMENTS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        id: 3,
        fecha: '2024-01-30',
        peso: 78.0,
        circunferencia_abdomen: 86,
        bf_percentage: 17.0,
        ffmi: 18.6,
        imc: 25.4,
      }
    }));
  }),

  // Mock delete measurement endpoint
  rest.delete(`${ENDPOINTS.USER_MEASUREMENT_DELETE}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      message: 'Measurement deleted successfully'
    }));
  }),

  // Mock goals endpoint
  rest.get(`${ENDPOINTS.USER_GOALS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        nombre_apellido: 'Juan Pérez García',
        peso_objetivo: 75.0,
        bf_objetivo: 15.0,
        ffmi_objetivo: 20.0,
        abdomen_objetivo: 82,
        cintura_objetivo: 78,
        cadera_objetivo: 90,
      }
    }));
  }),

  // Mock save goal endpoint
  rest.post(`${ENDPOINTS.USER_GOALS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        nombre_apellido: 'Juan Pérez García',
        peso_objetivo: 75.0,
        bf_objetivo: 15.0,
        ffmi_objetivo: 20.0,
      }
    }));
  }),

  // Mock auto goals endpoint with partial data for testing
  rest.get(`${ENDPOINTS.USER_GOALS_AUTO}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        datos_actuales: {
          peso: 80.5,
          bf_percentage: 18.5,
          ffmi: 18.2,
          abdomen: 90,
          cintura: 85,
          cadera: 95,
        },
        objetivos_geneticos: {
          peso_objetivo: 72.0,
          bf_minimo: 6.0,
          ffmi_maximo: 23.7,
          abdomen_objetivo: 78,
          cintura_objetivo: 75,
          cadera_objetivo: 88,
        },
        cambios_necesarios: {
          peso: -8.5,
          bf_percentage: -12.5,
          ffmi: 5.5,
          abdomen: -12,
          cintura: -10,
          cadera: -7,
        },
        tiempo_estimado: {
          meses: 12,
          años: 1,
        },
        objetivos_parciales: [
          {
            tipo: 'definicion',
            bf_objetivo: 15,
            ffmi_objetivo: 18.5,
            descripcion: 'Definición - Normal Alto',
            fase: 'Reducir grasa corporal',
            prioridad: 'media',
            peso_objetivo: 75.2,
            cambio_peso: -8.3,
            tiempo_meses: 4.2,
          }
        ],
        metadata: {
          sexo: 'masculino',
          edad: 38,
          altura: 175,
        }
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

describe('User Service', () => {
  describe('User Profile', () => {
    it('should fetch user profile successfully', async () => {
      const result = await userService.getUser('user_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        dni: 12345678,
        nombre_apellido: 'Juan Pérez García',
        email: 'juan.perez@example.com',
        sexo: 'masculino',
        fecha_nacimiento: '1985-05-15',
        altura: 175,
        telefono: '+1234567890',
      });
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        telefono: '+0987654321',
        altura: 176,
      };

      const result = await userService.updateUser('user_123', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.telefono).toBe('+1234567890'); // Mock returns original data
    });
  });

  describe('Measurements', () => {
    it('should fetch user measurements successfully', async () => {
      const result = await userService.getMeasurements('user_123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toMatchObject({
        id: 1,
        fecha: '2024-01-01',
        peso: 80.5,
        bf_percentage: 18.5,
        ffmi: 18.2,
      });
      expect(result.data?.[1]).toMatchObject({
        id: 2,
        fecha: '2024-01-15',
        peso: 79.2,
        bf_percentage: 17.8,
        ffmi: 18.4,
      });
    });

    it('should add measurement successfully', async () => {
      const measurementData = {
        fecha: '2024-01-30',
        peso: 78.0,
        circunferencia_abdomen: 86,
        bf_percentage: 17.0,
        ffmi: 18.6,
      };

      const result = await userService.addMeasurement('user_123', measurementData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(3);
      expect(result.data?.peso).toBe(78.0);
      expect(result.data?.bf_percentage).toBe(17.0);
    });

    it('should delete measurement successfully', async () => {
      const result = await userService.deleteMeasurement('user_123', 1);

      expect(result.success).toBe(true);
    });
  });

  describe('Goals', () => {
    it('should fetch user goals successfully', async () => {
      const result = await userService.getGoals('user_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        nombre_apellido: 'Juan Pérez García',
        peso_objetivo: 75.0,
        bf_objetivo: 15.0,
        ffmi_objetivo: 20.0,
        abdomen_objetivo: 82,
        cintura_objetivo: 78,
        cadera_objetivo: 90,
      });
    });

    it('should save user goals successfully', async () => {
      const goalData = {
        peso_objetivo: 75.0,
        bf_objetivo: 15.0,
        ffmi_objetivo: 20.0,
      };

      const result = await userService.saveGoal('user_123', goalData);

      expect(result.success).toBe(true);
      expect(result.data?.peso_objetivo).toBe(75.0);
      expect(result.data?.bf_objetivo).toBe(15.0);
    });
  });

  describe('Auto Goals', () => {
    it('should fetch auto-generated goals successfully', async () => {
      const result = await userService.getAutoGoals('user_123');

      expect(result.success).toBe(true);
      expect(result.data?.datos_actuales).toMatchObject({
        peso: 80.5,
        bf_percentage: 18.5,
        ffmi: 18.2,
      });
      expect(result.data?.objetivos_geneticos).toMatchObject({
        peso_objetivo: 72.0,
        bf_minimo: 6.0,
        ffmi_maximo: 23.7,
      });
      expect(result.data?.cambios_necesarios).toMatchObject({
        peso: -8.5,
        bf_percentage: -12.5,
        ffmi: 5.5,
      });
      expect(result.data?.tiempo_estimado).toEqual({
        meses: 12,
        años: 1,
      });
      expect(result.data?.objetivos_parciales).toHaveLength(1);
      expect(result.data?.metadata).toEqual({
        sexo: 'masculino',
        edad: 38,
        altura: 175,
      });
    });

    it('should handle partial auto goals data', async () => {
      server.use(
        rest.get(`${ENDPOINTS.USER_GOALS_AUTO}`, (req, res, ctx) => {
          return res(ctx.json({
            success: true,
            data: {
              datos_actuales: { peso: 80, bf_percentage: 18 },
              objetivos_geneticos: { peso_objetivo: 75, bf_minimo: 12 },
              cambios_necesarios: { peso: -5, bf_percentage: -6 },
              tiempo_estimado: { meses: 6, años: 0.5 },
              metadata: { sexo: 'masculino', edad: 35, altura: 170 },
            }
          }));
        })
      );

      const result = await userService.getAutoGoals('user_123');

      expect(result.success).toBe(true);
      expect(result.data?.datos_actuales.peso).toBe(80);
      expect(result.data?.objetivos_geneticos.peso_objetivo).toBe(75);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        rest.get(`${ENDPOINTS.USER_DETAIL}`, (req: RestRequest, res: any, ctx: RestContext) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
        })
      );

      const result = await userService.getUser('user_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('should handle timeout errors', async () => {
      server.use(
        rest.get(`${ENDPOINTS.USER_DETAIL}`, (req: RestRequest, res: any, ctx: RestContext) => {
          return res(ctx.delay(15000)); // Longer than timeout
        })
      );

      const result = await userService.getUser('user_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });
  });
});
