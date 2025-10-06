#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para limpiar el caché del catálogo de alimentos.
Ejecutar antes de testear cambios en obtener_catalogo_alimentos_bloques().
"""

import sys
import os

# Agregar src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    import functions
    
    print("🔍 Verificando caché del catálogo de alimentos...")
    
    if hasattr(functions.obtener_catalogo_alimentos_bloques, '_cache'):
        delattr(functions.obtener_catalogo_alimentos_bloques, '_cache')
        print("✓ Caché limpiado exitosamente")
        print("  → Próximo llamado recargará desde base de datos")
    else:
        print("ℹ️  No hay caché activo (esto es normal si no se ha cargado aún)")
    
    print("\n📝 Notas:")
    print("  - Si el servidor está corriendo, reinícialo para aplicar cambios")
    print("  - O agrega este código al inicio de src/main.py:")
    print("    import functions")
    print("    functions.limpiar_cache_alimentos()")
    
except ImportError as e:
    print(f"❌ Error importando functions: {e}")
    print("   Asegúrate de ejecutar desde el directorio raíz del proyecto")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error inesperado: {e}")
    sys.exit(1)
