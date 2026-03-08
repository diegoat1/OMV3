// Telemedicine Service Tests
import { rest, RestRequest, RestContext } from 'msw';
import { setupServer } from 'msw/node';
import { telemedicineService } from '../telemedicineService';
import { API_CONFIG } from '../config';

const { ENDPOINTS } = API_CONFIG;

// Mock server setup
const server = setupServer(
  // Mock appointments endpoint
  rest.get(`${ENDPOINTS.TELEMED_APPOINTMENTS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      appointments: [
        {
          id: 1,
          user_id: 'user_123',
          fecha_creacion: '2024-01-01T10:00:00Z',
          fecha_cita: '2024-01-15T14:00:00Z',
          tipo_cita: 'consulta_general',
          especialidad: 'medicina_general',
          medico_nombre: 'Dr. Juan Pérez',
          medico_especialidad: 'Medicina General',
          institucion: 'Hospital Central',
          direccion: 'Calle Principal 123',
          telefono: '+1234567890',
          modalidad: 'presencial',
          link_videollamada: null,
          motivo_consulta: 'Dolor de cabeza recurrente',
          estado: 'confirmada',
          notas_medico: 'Paciente refiere migrañas frecuentes',
          notas_paciente: 'He tenido estos dolores por 2 semanas',
        }
      ],
      total: 1
    }));
  }),

  // Mock create appointment endpoint
  rest.post(`${ENDPOINTS.TELEMED_APPOINTMENTS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      id: 2,
      created: true,
      message: 'Appointment created successfully'
    }));
  }),

  // Mock update appointment status endpoint
  rest.patch(`${ENDPOINTS.TELEMED_APPOINTMENT_STATUS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      updated: true,
      message: 'Appointment status updated'
    }));
  }),

  // Mock medical records endpoint
  rest.get(`${ENDPOINTS.TELEMED_RECORDS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      records: [
        {
          id: 1,
          user_id: 'user_123',
          fecha_registro: '2024-01-01T10:00:00Z',
          tipo_registro: 'consulta',
          categoria: 'medicina_general',
          descripcion: 'Consulta por dolor de cabeza',
          fecha_evento: '2024-01-01T09:00:00Z',
          medico_tratante: 'Dr. Juan Pérez',
          institucion: 'Hospital Central',
          estado: 'completado',
          importancia: 'media',
          notas: 'Se prescribieron analgésicos',
        }
      ],
      total: 1
    }));
  }),

  // Mock create medical record endpoint
  rest.post(`${ENDPOINTS.TELEMED_RECORDS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      id: 2,
      created: true,
      message: 'Medical record created successfully'
    }));
  }),

  // Mock patients endpoint
  rest.get(`${ENDPOINTS.TELEMED_PATIENTS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      patients: [
        {
          id: 1,
          user_id: 'user_123',
          fecha_registro: '2024-01-01T10:00:00Z',
          paciente_nombre: 'Juan Pérez García',
          paciente_dni: '12345678',
          documento: '12345678',
          documento_tipo: 'DNI',
          nombre: 'Juan',
          apellido: 'Pérez García',
          fecha_nacimiento: '1985-05-15',
          edad: 38,
          edad_calculada: 38,
          altura_cm: 175,
          peso_kg: 80,
          alergias: 'Penicilina',
          patologias_previas: 'Hipertensión',
          antecedentes: 'Cirugía apéndice 2010',
          telefono: '+1234567890',
          es_fumador: false,
          activo_sexualmente: true,
          embarazo: false,
          notas: 'Paciente estable',
        }
      ],
      total: 1
    }));
  }),

  // Mock create patient endpoint
  rest.post(`${ENDPOINTS.TELEMED_PATIENTS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      paciente: {
        id: 2,
        user_id: 'user_124',
        paciente_nombre: 'María González',
        created: true
      }
    }));
  }),

  // Mock clinical situations endpoint
  rest.get(`${ENDPOINTS.TELEMED_SITUATIONS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      situations: [
        {
          id: 1,
          paciente_nombre: 'Juan Pérez García',
          paciente_dni: '12345678',
          tipo_consulta: 'primera_vez',
          motivo_consulta: 'Dolor abdominal',
          historia_enfermedad_actual: 'Dolor en cuadrante inferior derecho desde hace 3 días',
          antecedentes_personales: 'Apendicectomía previa',
          situacion_actual: 'Dolor moderado, no irradiado',
          diagnostico_cie10: [
            { code: 'R10.31', name: 'Dolor abdominal derecho inferior', principal: true }
          ],
          indicaciones: 'Analgésicos, reposo',
          resumen_clinico: 'Paciente con dolor abdominal, probable apendicitis',
        }
      ],
      total: 1
    }));
  }),

  // Mock create situation endpoint
  rest.post(`${ENDPOINTS.TELEMED_SITUATIONS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      situation: {
        id: 1,
        paciente_nombre: 'Juan Pérez García',
        paciente_dni: '12345678',
        tipo_consulta: 'primera_vez',
        motivo_consulta: 'Dolor abdominal',
        historia_enfermedad_actual: 'Dolor en cuadrante inferior derecho desde hace 3 días',
        antecedentes_personales: 'Apendicectomía previa',
        situacion_actual: 'Dolor moderado, no irradiado',
        diagnostico_cie10: [
          { code: 'R10.31', name: 'Dolor abdominal derecho inferior', principal: true }
        ],
        indicaciones: 'Analgésicos, reposo',
        resumen_clinico: 'Paciente con dolor abdominal, probable apendicitis',
        created: true
      }
    }));
  }),

  // Mock vital signs endpoint
  rest.get(`${ENDPOINTS.TELEMED_VITALS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      vitals: [
        {
          id: 1,
          user_id: 'user_123',
          fecha_registro: '2024-01-01T10:00:00Z',
          presion_sistolica: 120,
          presion_diastolica: 80,
          frecuencia_cardiaca: 72,
          temperatura: 36.5,
          frecuencia_respiratoria: 16,
          saturacion_oxigeno: 98,
          peso_kg: 80,
          altura_cm: 175,
          imc: 26.1,
          circunferencia_abdominal: 90,
          notas: 'Signos vitales normales',
        }
      ],
      total: 1
    }));
  }),

  // Mock documents endpoint
  rest.get(`${ENDPOINTS.TELEMED_DOCUMENTS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      documents: [
        {
          id: 1,
          user_id: 'user_123',
          paciente_nombre: 'Juan Pérez García',
          tipo_documento: 'laboratorio',
          titulo: 'Análisis de Sangre',
          descripcion: 'Hemograma completo',
          archivo_url: 'https://example.com/docs/1.pdf',
          fecha_subida: '2024-01-01T10:00:00Z',
          tags: ['laboratorio', 'sangre'],
        }
      ],
      total: 1
    }));
  }),

  // Mock prevention programs endpoint
  rest.get(`${ENDPOINTS.TELEMED_PREVENTION}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      programs: [
        {
          id: 1,
          nombre: 'Programa Control Diabetes',
          descripcion: 'Programa de prevención y control de diabetes tipo 2',
          objetivos: 'Mejorar control glucémico',
          duracion_meses: 6,
          frecuencia_controles: 'mensual',
          criterios_inclusion: 'Pacientes con prediabetes',
          actividades: ['Educación nutricional', 'Ejercicio supervisado'],
          indicadores_exito: ['HbA1c < 7%', 'Pérdida de peso >5%'],
        }
      ],
      total: 1
    }));
  }),

  // Mock templates endpoint
  rest.get(`${ENDPOINTS.TELEMED_TEMPLATES}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      templates: [
        {
          id: 1,
          user_id: 'user_admin',
          type: 'consulta',
          name: 'Consulta General',
          description: 'Plantilla para consulta médica general',
          content: { secciones: ['motivo_consulta', 'exploracion_fisica', 'diagnostico'] },
          is_active: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }
      ],
      total: 1
    }));
  })
);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

describe('Telemedicine Service', () => {
  describe('Appointments', () => {
    it('should fetch appointments successfully', async () => {
      const result = await telemedicineService.getAppointments();

      expect(result.success).toBe(true);
      expect(result.data?.appointments).toHaveLength(1);
      expect(result.data?.appointments[0]).toMatchObject({
        id: 1,
        tipo_cita: 'consulta_general',
        estado: 'confirmada',
        medico_nombre: 'Dr. Juan Pérez',
      });
    });

    it('should create appointment successfully', async () => {
      const appointmentData = {
        fecha_cita: '2024-01-20T15:00:00Z',
        tipo_cita: 'control',
        motivo_consulta: 'Seguimiento',
      };

      const result = await telemedicineService.createAppointment(appointmentData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(2);
      expect(result.data?.created).toBe(true);
    });

    it('should update appointment status successfully', async () => {
      const result = await telemedicineService.updateAppointmentStatus(1, 'realizada');

      expect(result.success).toBe(true);
      expect(result.data?.updated).toBe(true);
    });
  });

  describe('Medical Records', () => {
    it('should fetch medical records successfully', async () => {
      const result = await telemedicineService.getRecords();

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
      expect(result.data?.records[0]).toMatchObject({
        tipo_registro: 'consulta',
        estado: 'completado',
        importancia: 'media',
      });
    });

    it('should create medical record successfully', async () => {
      const recordData = {
        tipo_registro: 'examen',
        descripcion: 'Examen físico de rutina',
        estado: 'completado',
      };

      const result = await telemedicineService.createRecord(recordData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(2);
      expect(result.data?.created).toBe(true);
    });
  });

  describe('Patients', () => {
    it('should fetch patients successfully', async () => {
      const result = await telemedicineService.getPatients();

      expect(result.success).toBe(true);
      expect(result.data?.patients).toHaveLength(1);
      expect(result.data?.patients[0]).toMatchObject({
        paciente_nombre: 'Juan Pérez García',
        paciente_dni: '12345678',
        altura_cm: 175,
        peso_kg: 80,
      });
    });

    it('should create patient successfully', async () => {
      const patientData = {
        paciente_nombre: 'María González',
        paciente_dni: '87654321',
        fecha_nacimiento: '1990-03-10',
      };

      const result = await telemedicineService.createPatient(patientData);

      expect(result.success).toBe(true);
      expect(result.data?.paciente.paciente_nombre).toBe('María González');
      expect(result.data?.created).toBe(true);
    });
  });

  describe('Clinical Situations', () => {
    it('should fetch clinical situations successfully', async () => {
      const result = await telemedicineService.getSituations();

      expect(result.success).toBe(true);
      expect(result.data?.situations).toHaveLength(1);
      expect(result.data?.situations[0]).toMatchObject({
        paciente_nombre: 'Juan Pérez García',
        tipo_consulta: 'primera_vez',
        diagnostico_cie10: expect.any(Array),
      });
    });

    it('should create clinical situation successfully', async () => {
      const situationData = {
        paciente_dni: '12345678',
        tipo_consulta: 'seguimiento',
        motivo_consulta: 'Control postoperatorio',
      };

      const result = await telemedicineService.createSituation(situationData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.created).toBe(true);
    });
  });

  describe('Vital Signs', () => {
    it('should fetch vital signs successfully', async () => {
      const result = await telemedicineService.getVitals();

      expect(result.success).toBe(true);
      expect(result.data?.vitals).toHaveLength(1);
      expect(result.data?.vitals[0]).toMatchObject({
        presion_sistolica: 120,
        presion_diastolica: 80,
        frecuencia_cardiaca: 72,
        temperatura: 36.5,
      });
    });

    it('should create vital sign successfully', async () => {
      const vitalData = {
        presion_sistolica: 125,
        presion_diastolica: 85,
        frecuencia_cardiaca: 75,
        temperatura: 36.8,
      };

      const result = await telemedicineService.createVitalSign(vitalData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.message).toBeDefined();
    });
  });

  describe('Documents', () => {
    it('should fetch documents successfully', async () => {
      const result = await telemedicineService.getDocuments();

      expect(result.success).toBe(true);
      expect(result.data?.documents).toHaveLength(1);
      expect(result.data?.documents[0]).toMatchObject({
        tipo_documento: 'laboratorio',
        titulo: 'Análisis de Sangre',
        tags: ['laboratorio', 'sangre'],
      });
    });

    it('should create document successfully', async () => {
      const documentData = {
        tipo_documento: 'estudio',
        titulo: 'Ecografía Abdominal',
        descripcion: 'Estudio de rutina',
      };

      const result = await telemedicineService.createDocument(documentData);

      expect(result.success).toBe(true);
      expect(result.data?.documento).toBeDefined();
      expect(result.data?.created).toBe(true);
    });
  });

  describe('Prevention Programs', () => {
    it('should fetch prevention programs successfully', async () => {
      const result = await telemedicineService.getPreventionPrograms();

      expect(result.success).toBe(true);
      expect(result.data?.programs).toHaveLength(1);
      expect(result.data?.programs[0]).toMatchObject({
        nombre: 'Programa Control Diabetes',
        duracion_meses: 6,
      });
    });
  });

  describe('Templates', () => {
    it('should fetch templates successfully', async () => {
      const result = await telemedicineService.getTemplates();

      expect(result.success).toBe(true);
      expect(result.data?.templates).toHaveLength(1);
      expect(result.data?.templates[0]).toMatchObject({
        type: 'consulta',
        name: 'Consulta General',
        is_active: 1,
      });
    });

    it('should fetch templates by type successfully', async () => {
      const result = await telemedicineService.getTemplates('consulta');

      expect(result.success).toBe(true);
      expect(result.data?.templates).toHaveLength(1);
    });

    it('should create template successfully', async () => {
      const templateData = {
        name: 'Nueva Consulta',
        type: 'especializada',
        description: 'Plantilla para consulta especializada',
      };

      const result = await telemedicineService.createTemplate(templateData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.message).toBeDefined();
    });
  });
});
