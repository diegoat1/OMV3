#!/usr/bin/env python3
"""
Script para exportar datos de las bases de datos legacy a JSON
para importación en OMV3 App

Uso: python export_legacy_db.py
Salida: legacy_export.json en la carpeta assets/
"""

import sqlite3
import json
import os
from datetime import datetime

# Rutas de las bases de datos legacy
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LEGACY_ROOT = os.path.dirname(PROJECT_ROOT)

DB_TELEMEDICINA = os.path.join(LEGACY_ROOT, 'src', 'telemedicina.db')
DB_BASEDEDATOS = os.path.join(LEGACY_ROOT, 'src', 'Basededatos')

OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'assets', 'legacy_export.json')


def get_table_names(conn):
    """Obtiene los nombres de todas las tablas en la base de datos"""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    return [row[0] for row in cursor.fetchall()]


def get_table_schema(conn, table_name):
    """Obtiene el esquema de una tabla"""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name});")
    return cursor.fetchall()


def export_table(conn, table_name):
    """Exporta todos los datos de una tabla"""
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        return {
            'columns': columns,
            'rows': [dict(zip(columns, row)) for row in rows],
            'count': len(rows)
        }
    except Exception as e:
        return {'error': str(e), 'count': 0}


def analyze_db(db_path, db_name):
    """Analiza una base de datos y extrae información relevante"""
    print(f"\n{'='*60}")
    print(f"Analizando: {db_name}")
    print(f"Ruta: {db_path}")
    print('='*60)
    
    if not os.path.exists(db_path):
        print(f"[ERROR] No se encontro la base de datos: {db_path}")
        return None
    
    try:
        conn = sqlite3.connect(db_path)
        tables = get_table_names(conn)
        print(f"\n[INFO] Tablas encontradas ({len(tables)}):")
        
        db_data = {
            'name': db_name,
            'path': db_path,
            'tables': {},
            'exported_at': datetime.now().isoformat()
        }
        
        for table in tables:
            schema = get_table_schema(conn, table)
            data = export_table(conn, table)
            
            print(f"  • {table}: {data['count']} registros")
            if schema:
                cols = [f"{col[1]}({col[2]})" for col in schema[:5]]
                print(f"    Columnas: {', '.join(cols)}{'...' if len(schema) > 5 else ''}")
            
            db_data['tables'][table] = {
                'schema': [{'name': col[1], 'type': col[2]} for col in schema],
                'data': data['rows'] if 'rows' in data else [],
                'count': data['count']
            }
        
        conn.close()
        return db_data
        
    except Exception as e:
        print(f"[ERROR] Error al analizar {db_name}: {e}")
        return None


def transform_to_omv3_format(legacy_data):
    """Transforma los datos legacy al formato esperado por OMV3"""
    
    omv3_data = {
        'users': [],
        'profiles': [],
        'measurements': [],
        'nutrition_presets': [],
        'diets': [],
        'import_summary': {
            'total_users': 0,
            'total_profiles': 0,
            'total_measurements': 0,
            'total_nutrition': 0,
            'total_diets': 0,
            'errors': [],
            'exported_at': datetime.now().isoformat()
        }
    }
    
    # Procesar Basededatos (principal)
    if legacy_data.get('basededatos'):
        bd = legacy_data['basededatos']
        
        # PERFILESTATICO - Usuarios principales
        if 'PERFILESTATICO' in bd.get('tables', {}):
            table_data = bd['tables']['PERFILESTATICO']
            for row in table_data.get('data', []):
                user = {
                    'id': f"legacy-{row.get('DNI', '')}",
                    'legacy_id': str(row.get('DNI', '')),
                    'legacy_table': 'PERFILESTATICO',
                    'name': row.get('NOMBRE_APELLIDO', ''),
                    'email': row.get('EMAIL', ''),
                    'phone': str(row.get('NUMERO_TELEFONO', '')),
                    'birth_date': row.get('FECHA_NACIMIENTO', ''),
                    'sex': 'male' if row.get('SEXO', '').upper() == 'M' else 'female',
                    'height': safe_float(row.get('ALTURA')),
                    'neck': safe_float(row.get('CIRC_CUELLO')),
                    'wrist': safe_float(row.get('CIRC_MUNECA')),
                    'ankle': safe_float(row.get('CIRC_TOBILLO')),
                    'status': 'active',
                    'imported_at': datetime.now().isoformat()
                }
                if user['name'] and user['legacy_id']:
                    omv3_data['users'].append(user)
                    omv3_data['import_summary']['total_users'] += 1
        
        # PERFILDINAMICO - Mediciones históricas
        if 'PERFILDINAMICO' in bd.get('tables', {}):
            table_data = bd['tables']['PERFILDINAMICO']
            for row in table_data.get('data', []):
                # Buscar el DNI del usuario por nombre
                user_name = row.get('NOMBRE_APELLIDO', '')
                user_dni = None
                for u in omv3_data['users']:
                    if u['name'] == user_name:
                        user_dni = u['legacy_id']
                        break
                
                measurement = {
                    'id': f"meas-{row.get('ID', '')}",
                    'legacy_id': str(row.get('ID', '')),
                    'legacy_table': 'PERFILDINAMICO',
                    'user_id': user_dni,
                    'user_name': user_name,
                    'date': row.get('FECHA_REGISTRO', ''),
                    'weight': safe_float(row.get('PESO')),
                    'waist': safe_float(row.get('CIRC_CIN')),
                    'hip': safe_float(row.get('CIRC_CAD')),
                    'body_fat': safe_float(row.get('BF')),
                    'muscle_mass': safe_float(row.get('MM')),
                    'ffmi': safe_float(row.get('FFMI')),
                    'imported_at': datetime.now().isoformat()
                }
                if measurement['weight'] or measurement['waist']:
                    omv3_data['measurements'].append(measurement)
                    omv3_data['import_summary']['total_measurements'] += 1
        
        # DIETA - Planes nutricionales
        if 'DIETA' in bd.get('tables', {}):
            table_data = bd['tables']['DIETA']
            for row in table_data.get('data', []):
                diet = {
                    'id': f"diet-{row.get('ID', '')}",
                    'legacy_id': str(row.get('ID', '')),
                    'legacy_table': 'DIETA',
                    'user_name': row.get('NOMBRE_APELLIDO', ''),
                    'calories': safe_float(row.get('CALORIAS')),
                    'protein': safe_float(row.get('PROTEINA')),
                    'fat': safe_float(row.get('GRASA')),
                    'carbs': safe_float(row.get('CH')),
                    'imported_at': datetime.now().isoformat()
                }
                if diet['calories']:
                    omv3_data['diets'].append(diet)
                    omv3_data['import_summary']['total_diets'] += 1
    
    # Agrupar mediciones por usuario (última medición)
    user_latest_measurements = {}
    for m in omv3_data['measurements']:
        user_id = m.get('user_id') or m.get('user_name')
        if user_id:
            existing = user_latest_measurements.get(user_id)
            if not existing or (m.get('date', '') > existing.get('date', '')):
                user_latest_measurements[user_id] = m
    
    # Agregar última medición a cada usuario
    for user in omv3_data['users']:
        latest = user_latest_measurements.get(user['legacy_id']) or user_latest_measurements.get(user['name'])
        if latest:
            user['latest_weight'] = latest.get('weight')
            user['latest_waist'] = latest.get('waist')
            user['latest_body_fat'] = latest.get('body_fat')
            user['latest_measurement_date'] = latest.get('date')
    
    return omv3_data


def transform_user(row, source_table):
    """Transforma un registro de usuario al formato OMV3"""
    if not row:
        return None
    
    # Mapeo flexible de campos
    user = {
        'legacy_id': str(row.get('id', row.get('ID', row.get('dni', row.get('DNI', ''))))) or None,
        'legacy_table': source_table,
        'name': row.get('nombre', row.get('NOMBRE', row.get('nombre_apellido', row.get('NOMBRE_APELLIDO', '')))),
        'email': row.get('email', row.get('EMAIL', row.get('correo', row.get('CORREO', '')))),
        'phone': row.get('telefono', row.get('TELEFONO', row.get('celular', row.get('CELULAR', '')))),
        'birth_date': row.get('fecha_nacimiento', row.get('FECHA_NACIMIENTO', row.get('nacimiento', ''))),
        'sex': normalize_sex(row.get('sexo', row.get('SEXO', row.get('genero', '')))),
        'height': safe_float(row.get('altura', row.get('ALTURA', row.get('estatura', '')))),
        'imported_at': datetime.now().isoformat()
    }
    
    # Solo retornar si tiene al menos nombre o ID
    if user['name'] or user['legacy_id']:
        return user
    return None


def transform_measurement(row, source_table):
    """Transforma un registro de medición al formato OMV3"""
    if not row:
        return None
    
    measurement = {
        'legacy_id': str(row.get('id', row.get('ID', ''))),
        'legacy_table': source_table,
        'user_id': str(row.get('usuario_id', row.get('USUARIO_ID', row.get('dni', row.get('DNI', ''))))),
        'date': row.get('fecha', row.get('FECHA', datetime.now().isoformat())),
        'weight': safe_float(row.get('peso', row.get('PESO', ''))),
        'waist': safe_float(row.get('cintura', row.get('CINTURA', row.get('abdomen', row.get('ABDOMEN', ''))))),
        'hip': safe_float(row.get('cadera', row.get('CADERA', ''))),
        'body_fat': safe_float(row.get('grasa', row.get('GRASA', row.get('porcentaje_grasa', '')))),
        'imported_at': datetime.now().isoformat()
    }
    
    if measurement['weight'] or measurement['waist']:
        return measurement
    return None


def transform_profile(row, source_table):
    """Transforma un perfil dinámico al formato OMV3"""
    if not row:
        return None
    
    profile = {
        'legacy_id': str(row.get('id', row.get('ID', row.get('dni', row.get('DNI', ''))))),
        'legacy_table': source_table,
        'weight': safe_float(row.get('peso', row.get('PESO', ''))),
        'height': safe_float(row.get('altura', row.get('ALTURA', ''))),
        'waist': safe_float(row.get('cintura', row.get('CINTURA', row.get('abdomen', row.get('ABDOMEN', ''))))),
        'hip': safe_float(row.get('cadera', row.get('CADERA', ''))),
        'neck': safe_float(row.get('cuello', row.get('CUELLO', ''))),
        'body_fat': safe_float(row.get('grasa', row.get('GRASA', row.get('bf', row.get('BF', ''))))),
        'muscle_mass': safe_float(row.get('masa_muscular', row.get('MASA_MUSCULAR', row.get('mm', row.get('MM', ''))))),
        'imported_at': datetime.now().isoformat()
    }
    
    if profile['weight'] or profile['legacy_id']:
        return profile
    return None


def transform_nutrition(row, source_table):
    """Transforma datos de nutrición al formato OMV3"""
    if not row:
        return None
    
    preset = {
        'legacy_id': str(row.get('id', row.get('ID', ''))),
        'legacy_table': source_table,
        'user_id': str(row.get('usuario_id', row.get('USUARIO_ID', row.get('dni', row.get('DNI', ''))))),
        'name': row.get('nombre', row.get('NOMBRE', row.get('nombre_apellido', ''))),
        'calories': safe_float(row.get('calorias', row.get('CALORIAS', row.get('kcal', '')))),
        'protein': safe_float(row.get('proteina', row.get('PROTEINA', row.get('p', row.get('P', ''))))),
        'fat': safe_float(row.get('grasa', row.get('GRASA', row.get('g', row.get('G', ''))))),
        'carbs': safe_float(row.get('carbohidratos', row.get('CARBOHIDRATOS', row.get('ch', row.get('CH', ''))))),
        'imported_at': datetime.now().isoformat()
    }
    
    if preset['calories'] or preset['name']:
        return preset
    return None


def normalize_sex(value):
    """Normaliza el valor de sexo"""
    if not value:
        return None
    value = str(value).lower().strip()
    if value in ['m', 'masculino', 'male', 'hombre', '1']:
        return 'male'
    if value in ['f', 'femenino', 'female', 'mujer', '2']:
        return 'female'
    return None


def safe_float(value):
    """Convierte a float de forma segura"""
    if value is None or value == '':
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def main():
    print("\n" + "="*60)
    print("EXPORTADOR DE DATOS LEGACY PARA OMV3")
    print("="*60)
    
    legacy_data = {}
    
    # Analizar telemedicina.db
    tm_data = analyze_db(DB_TELEMEDICINA, 'telemedicina')
    if tm_data:
        legacy_data['telemedicina'] = tm_data
    
    # Analizar Basededatos
    bd_data = analyze_db(DB_BASEDEDATOS, 'basededatos')
    if bd_data:
        legacy_data['basededatos'] = bd_data
    
    if not legacy_data:
        print("\n[ERROR] No se encontraron bases de datos para exportar")
        return
    
    # Transformar al formato OMV3
    print("\n" + "="*60)
    print("Transformando datos al formato OMV3...")
    print("="*60)
    
    omv3_data = transform_to_omv3_format(legacy_data)
    
    # Guardar JSON
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(omv3_data, f, indent=2, ensure_ascii=False, default=str)
    
    # Resumen
    print("\n" + "="*60)
    print("EXPORTACION COMPLETADA")
    print("="*60)
    print(f"\nResumen:")
    print(f"  - Usuarios: {omv3_data['import_summary']['total_users']}")
    print(f"  - Perfiles: {omv3_data['import_summary']['total_profiles']}")
    print(f"  - Mediciones: {omv3_data['import_summary']['total_measurements']}")
    print(f"  - Presets nutricion: {omv3_data['import_summary']['total_nutrition']}")
    print(f"\nArchivo generado: {OUTPUT_FILE}")
    print(f"Tamano: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")
    
    # También guardar datos raw para debug
    raw_output = OUTPUT_FILE.replace('.json', '_raw.json')
    with open(raw_output, 'w', encoding='utf-8') as f:
        json.dump(legacy_data, f, indent=2, ensure_ascii=False, default=str)
    print(f"Datos raw: {raw_output}")


if __name__ == '__main__':
    main()
