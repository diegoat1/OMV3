// Mock Data System - Generators and Local Database
import * as SQLite from 'expo-sqlite';
import { faker } from '@faker-js/faker';

// Types for mock data
export interface MockUser {
  id: string;
  email: string;
  nombre_apellido: string;
  dni: string;
  sexo: 'masculino' | 'femenino';
  fecha_nacimiento: string;
  altura: number;
  telefono: string;
  rol: 'admin' | 'doctor' | 'nutritionist' | 'trainer' | 'patient';
  activo: boolean;
  fecha_creacion: string;
}

export interface MockMeasurement {
  id: number;
  user_id: string;
  fecha: string;
  peso: number;
  bf_percentage: number;
  ffmi: number;
  imc: number;
  circunferencia_abdomen?: number;
  circunferencia_cintura?: number;
  circunferencia_cadera?: number;
  circunferencia_cuello?: number;
}

export interface MockGoal {
  id: number;
  user_id: string;
  peso_objetivo?: number;
  bf_objetivo?: number;
  ffmi_objetivo?: number;
  abdomen_objetivo?: number;
  cintura_objetivo?: number;
  cadera_objetivo?: number;
  fecha_creacion: string;
  fecha_objetivo?: string;
}

export interface MockNutritionPlan {
  id: number;
  user_id: string;
  nombre_apellido: string;
  calorias: number;
  proteina: number;
  grasa: number;
  carbohidratos: number;
  fecha_creacion: string;
}

export interface MockMealPlan {
  id: number;
  user_dni: string;
  tipo_plan: 'recetas' | 'grupos';
  plan_json: string;
  activo: boolean;
  calorias_totales: number;
  comidas_activas: number;
  total_recetas: number;
  fecha_creacion: string;
}

export interface MockAppointment {
  id: number;
  user_id: string;
  fecha_creacion: string;
  fecha_cita: string;
  tipo_cita: string;
  medico_nombre?: string;
  estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada';
  motivo_consulta?: string;
}

class MockDataGenerator {
  // Generate realistic user data
  generateUser(overrides: Partial<MockUser> = {}): MockUser {
    const sexo = faker.helpers.arrayElement(['masculino', 'femenino']);
    const nombre = faker.person.firstName(sexo === 'masculino' ? 'male' : 'female');
    const apellido = faker.person.lastName();
    const nombre_apellido = `${apellido}, ${nombre}`;

    return {
      id: faker.string.uuid(),
      email: faker.internet.email({ firstName: nombre, lastName: apellido }),
      nombre_apellido,
      dni: faker.string.numeric(8),
      sexo: sexo as 'masculino' | 'femenino',
      fecha_nacimiento: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
      altura: faker.number.int({ min: 150, max: 200 }),
      telefono: faker.phone.number(),
      rol: faker.helpers.arrayElement(['patient', 'doctor', 'nutritionist', 'trainer']),
      activo: faker.datatype.boolean(),
      fecha_creacion: faker.date.recent({ days: 365 }).toISOString(),
      ...overrides,
    };
  }

  // Generate measurement data with realistic correlations
  generateMeasurement(user: MockUser, dateOffset: number = 0): MockMeasurement {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - dateOffset);

    // Generate correlated measurements
    const edad = new Date().getFullYear() - new Date(user.fecha_nacimiento).getFullYear();
    const baseWeight = user.sexo === 'masculino'
      ? faker.number.int({ min: 70, max: 100 })
      : faker.number.int({ min: 55, max: 80 });

    const bf_percentage = faker.number.float({ min: 8, max: 25, precision: 0.1 });
    const ffmi = user.sexo === 'masculino'
      ? faker.number.float({ min: 16, max: 23, precision: 0.1 })
      : faker.number.float({ min: 14, max: 18, precision: 0.1 });

    const peso = baseWeight + faker.number.float({ min: -5, max: 5, precision: 0.1 });
    const imc = peso / Math.pow(user.altura / 100, 2);

    return {
      id: faker.number.int({ min: 1, max: 999999 }),
      user_id: user.id,
      fecha: baseDate.toISOString().split('T')[0],
      peso,
      bf_percentage,
      ffmi,
      imc: parseFloat(imc.toFixed(1)),
      circunferencia_abdomen: user.sexo === 'masculino'
        ? faker.number.int({ min: 80, max: 110 })
        : undefined,
      circunferencia_cintura: faker.number.int({ min: 65, max: 95 }),
      circunferencia_cadera: user.sexo === 'femenino'
        ? faker.number.int({ min: 90, max: 110 })
        : undefined,
      circunferencia_cuello: faker.number.int({ min: 35, max: 45 }),
    };
  }

  // Generate goal data
  generateGoal(user: MockUser): MockGoal {
    return {
      id: faker.number.int({ min: 1, max: 999999 }),
      user_id: user.id,
      peso_objetivo: faker.helpers.maybe(() => faker.number.int({ min: 60, max: 90 }), { probability: 0.8 }),
      bf_objetivo: faker.helpers.maybe(() => faker.number.float({ min: 10, max: 20, precision: 0.1 }), { probability: 0.7 }),
      ffmi_objetivo: faker.helpers.maybe(() => faker.number.float({ min: 18, max: 22, precision: 0.1 }), { probability: 0.6 }),
      abdomen_objetivo: user.sexo === 'masculino' ? faker.number.int({ min: 75, max: 90 }) : undefined,
      cintura_objetivo: faker.number.int({ min: 70, max: 85 }),
      cadera_objetivo: user.sexo === 'femenino' ? faker.number.int({ min: 85, max: 100 }) : undefined,
      fecha_creacion: faker.date.recent({ days: 30 }).toISOString(),
      fecha_objetivo: faker.date.future({ years: 1 }).toISOString().split('T')[0],
    };
  }

  // Generate nutrition plan data
  generateNutritionPlan(user: MockUser): MockNutritionPlan {
    const calorias = user.sexo === 'masculino'
      ? faker.number.int({ min: 2200, max: 2800 })
      : faker.number.int({ min: 1800, max: 2200 });

    return {
      id: faker.number.int({ min: 1, max: 999999 }),
      user_id: user.id,
      nombre_apellido: user.nombre_apellido,
      calorias,
      proteina: Math.round(calorias * 0.25 / 4), // 25% of calories from protein
      grasa: Math.round(calorias * 0.25 / 9), // 25% of calories from fat
      carbohidratos: Math.round(calorias * 0.50 / 4), // 50% of calories from carbs
      fecha_creacion: faker.date.recent({ days: 30 }).toISOString(),
    };
  }

  // Generate meal plan data
  generateMealPlan(user: MockUser): MockMealPlan {
    const recipes = [
      'Ensalada de pollo', 'Pechuga con arroz', 'Salmón al horno',
      'Pasta integral', 'Yogur con frutas', 'Tortilla de verduras'
    ];

    const planData = {
      desayuno: faker.helpers.arrayElements(recipes, faker.number.int({ min: 1, max: 2 })),
      media_manana: faker.helpers.arrayElements(recipes, faker.number.int({ min: 1, max: 2 })),
      almuerzo: faker.helpers.arrayElements(recipes, faker.number.int({ min: 2, max: 3 })),
      merienda: faker.helpers.arrayElements(recipes, faker.number.int({ min: 1, max: 2 })),
      media_tarde: faker.helpers.maybe(() => faker.helpers.arrayElements(recipes, 1), { probability: 0.3 }),
      cena: faker.helpers.arrayElements(recipes, faker.number.int({ min: 2, max: 3 })),
    };

    return {
      id: faker.number.int({ min: 1, max: 999999 }),
      user_dni: user.dni,
      tipo_plan: faker.helpers.arrayElement(['recetas', 'grupos']),
      plan_json: JSON.stringify(planData),
      activo: faker.datatype.boolean(),
      calorias_totales: faker.number.int({ min: 1800, max: 2800 }),
      comidas_activas: Object.values(planData).filter(meal => meal && meal.length > 0).length,
      total_recetas: Object.values(planData).reduce((total, meal) => total + (meal ? meal.length : 0), 0),
      fecha_creacion: faker.date.recent({ days: 30 }).toISOString(),
    };
  }

  // Generate appointment data
  generateAppointment(user: MockUser): MockAppointment {
    const tiposCita = [
      'consulta_general', 'control_rutina', 'evaluacion_nutricional',
      'plan_entrenamiento', 'seguimiento_progreso'
    ];

    const estados: Array<'programada' | 'confirmada' | 'realizada' | 'cancelada'> =
      ['programada', 'confirmada', 'realizada', 'cancelada'];

    return {
      id: faker.number.int({ min: 1, max: 999999 }),
      user_id: user.id,
      fecha_creacion: faker.date.recent({ days: 30 }).toISOString(),
      fecha_cita: faker.date.future({ days: 30 }).toISOString(),
      tipo_cita: faker.helpers.arrayElement(tiposCita),
      medico_nombre: user.rol !== 'patient' ? user.nombre_apellido : faker.person.fullName(),
      estado: faker.helpers.arrayElement(estados),
      motivo_consulta: faker.lorem.sentence(),
    };
  }

  // Generate complete dataset for a user
  generateUserDataset(): {
    user: MockUser;
    measurements: MockMeasurement[];
    goals: MockGoal[];
    nutritionPlans: MockNutritionPlan[];
    mealPlans: MockMealPlan[];
    appointments: MockAppointment[];
  } {
    const user = this.generateUser();

    // Generate multiple measurements over time
    const measurements = [];
    for (let i = 0; i < faker.number.int({ min: 5, max: 15 }); i++) {
      measurements.push(this.generateMeasurement(user, i * 7)); // Weekly measurements
    }

    // Sort measurements by date (most recent first)
    measurements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return {
      user,
      measurements,
      goals: [this.generateGoal(user)],
      nutritionPlans: [this.generateNutritionPlan(user)],
      mealPlans: [this.generateMealPlan(user)],
      appointments: faker.helpers.multiple(() => this.generateAppointment(user), { count: faker.number.int({ min: 0, max: 5 }) }),
    };
  }
}

// Local database manager for mock data
class MockDatabase {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabase('mock_data.db');
  }

  async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Users table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            nombre_apellido TEXT,
            dni TEXT,
            sexo TEXT,
            fecha_nacimiento TEXT,
            altura INTEGER,
            telefono TEXT,
            rol TEXT,
            activo INTEGER,
            fecha_creacion TEXT
          )
        `);

        // Measurements table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS measurements (
            id INTEGER PRIMARY KEY,
            user_id TEXT,
            fecha TEXT,
            peso REAL,
            bf_percentage REAL,
            ffmi REAL,
            imc REAL,
            circunferencia_abdomen INTEGER,
            circunferencia_cintura INTEGER,
            circunferencia_cadera INTEGER,
            circunferencia_cuello INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Goals table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY,
            user_id TEXT,
            peso_objetivo REAL,
            bf_objetivo REAL,
            ffmi_objetivo REAL,
            abdomen_objetivo INTEGER,
            cintura_objetivo INTEGER,
            cadera_objetivo INTEGER,
            fecha_creacion TEXT,
            fecha_objetivo TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Nutrition plans table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS nutrition_plans (
            id INTEGER PRIMARY KEY,
            user_id TEXT,
            nombre_apellido TEXT,
            calorias INTEGER,
            proteina INTEGER,
            grasa INTEGER,
            carbohidratos INTEGER,
            fecha_creacion TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Meal plans table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS meal_plans (
            id INTEGER PRIMARY KEY,
            user_dni TEXT,
            tipo_plan TEXT,
            plan_json TEXT,
            activo INTEGER,
            calorias_totales INTEGER,
            comidas_activas INTEGER,
            total_recetas INTEGER,
            fecha_creacion TEXT
          )
        `);

        // Appointments table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY,
            user_id TEXT,
            fecha_creacion TEXT,
            fecha_cita TEXT,
            tipo_cita TEXT,
            medico_nombre TEXT,
            estado TEXT,
            motivo_consulta TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);
      }, reject, resolve);
    });
  }

  async populateWithMockData(count: number = 50): Promise<void> {
    const generator = new MockDataGenerator();

    for (let i = 0; i < count; i++) {
      const dataset = generator.generateUserDataset();
      await this.insertUserDataset(dataset);
    }
  }

  private async insertUserDataset(dataset: ReturnType<MockDataGenerator['generateUserDataset']>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Insert user
        tx.executeSql(`
          INSERT OR REPLACE INTO users (id, email, nombre_apellido, dni, sexo, fecha_nacimiento, altura, telefono, rol, activo, fecha_creacion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          dataset.user.id,
          dataset.user.email,
          dataset.user.nombre_apellido,
          dataset.user.dni,
          dataset.user.sexo,
          dataset.user.fecha_nacimiento,
          dataset.user.altura,
          dataset.user.telefono,
          dataset.user.rol,
          dataset.user.activo ? 1 : 0,
          dataset.user.fecha_creacion,
        ]);

        // Insert measurements
        dataset.measurements.forEach(measurement => {
          tx.executeSql(`
            INSERT OR REPLACE INTO measurements (id, user_id, fecha, peso, bf_percentage, ffmi, imc, circunferencia_abdomen, circunferencia_cintura, circunferencia_cadera, circunferencia_cuello)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            measurement.id,
            measurement.user_id,
            measurement.fecha,
            measurement.peso,
            measurement.bf_percentage,
            measurement.ffmi,
            measurement.imc,
            measurement.circunferencia_abdomen,
            measurement.circunferencia_cintura,
            measurement.circunferencia_cadera,
            measurement.circunferencia_cuello,
          ]);
        });

        // Insert goals
        dataset.goals.forEach(goal => {
          tx.executeSql(`
            INSERT OR REPLACE INTO goals (id, user_id, peso_objetivo, bf_objetivo, ffmi_objetivo, abdomen_objetivo, cintura_objetivo, cadera_objetivo, fecha_creacion, fecha_objetivo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            goal.id,
            goal.user_id,
            goal.peso_objetivo,
            goal.bf_objetivo,
            goal.ffmi_objetivo,
            goal.abdomen_objetivo,
            goal.cintura_objetivo,
            goal.cadera_objetivo,
            goal.fecha_creacion,
            goal.fecha_objetivo,
          ]);
        });

        // Insert nutrition plans
        dataset.nutritionPlans.forEach(plan => {
          tx.executeSql(`
            INSERT OR REPLACE INTO nutrition_plans (id, user_id, nombre_apellido, calorias, proteina, grasa, carbohidratos, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            plan.id,
            plan.user_id,
            plan.nombre_apellido,
            plan.calorias,
            plan.proteina,
            plan.grasa,
            plan.carbohidratos,
            plan.fecha_creacion,
          ]);
        });

        // Insert meal plans
        dataset.mealPlans.forEach(plan => {
          tx.executeSql(`
            INSERT OR REPLACE INTO meal_plans (id, user_dni, tipo_plan, plan_json, activo, calorias_totales, comidas_activas, total_recetas, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            plan.id,
            plan.user_dni,
            plan.tipo_plan,
            plan.plan_json,
            plan.activo ? 1 : 0,
            plan.calorias_totales,
            plan.comidas_activas,
            plan.total_recetas,
            plan.fecha_creacion,
          ]);
        });

        // Insert appointments
        dataset.appointments.forEach(appointment => {
          tx.executeSql(`
            INSERT OR REPLACE INTO appointments (id, user_id, fecha_creacion, fecha_cita, tipo_cita, medico_nombre, estado, motivo_consulta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            appointment.id,
            appointment.user_id,
            appointment.fecha_creacion,
            appointment.fecha_cita,
            appointment.tipo_cita,
            appointment.medico_nombre,
            appointment.estado,
            appointment.motivo_consulta,
          ]);
        });
      }, reject, resolve);
    });
  }

  async getUsers(limit: number = 20): Promise<MockUser[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users ORDER BY fecha_creacion DESC LIMIT ?',
          [limit],
          (_, result) => {
            const users: MockUser[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              users.push({
                ...row,
                activo: row.activo === 1,
              });
            }
            resolve(users);
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  async getUserMeasurements(userId: string): Promise<MockMeasurement[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM measurements WHERE user_id = ? ORDER BY fecha DESC',
          [userId],
          (_, result) => {
            const measurements: MockMeasurement[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              measurements.push(result.rows.item(i));
            }
            resolve(measurements);
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  async clearAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql('DELETE FROM appointments');
        tx.executeSql('DELETE FROM meal_plans');
        tx.executeSql('DELETE FROM nutrition_plans');
        tx.executeSql('DELETE FROM goals');
        tx.executeSql('DELETE FROM measurements');
        tx.executeSql('DELETE FROM users');
      }, reject, resolve);
    });
  }
}

// Export singleton instances
export const mockDataGenerator = new MockDataGenerator();
export const mockDatabase = new MockDatabase();

// Utility functions
export const initializeMockSystem = async (): Promise<void> => {
  await mockDatabase.initDatabase();
  console.log('Mock database initialized');
};

export const populateMockData = async (count: number = 50): Promise<void> => {
  await mockDatabase.populateWithMockData(count);
  console.log(`Mock data populated with ${count} users`);
};

export const resetMockData = async (): Promise<void> => {
  await mockDatabase.clearAllData();
  console.log('Mock data cleared');
};
