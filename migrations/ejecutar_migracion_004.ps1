# Script PowerShell para ejecutar migración 004 CORREGIDA
# Restaura todas las columnas necesarias en PLAN_BLOQUES_PRESETS

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Migración 004: Biblioteca y Favoritos" -ForegroundColor Cyan
Write-Host "  VERSIÓN CORREGIDA - Preserva columnas" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$dbPath = "src\Basededatos"
if (-not (Test-Path $dbPath)) {
    Write-Host "ERROR: No se encuentra la base de datos en $dbPath" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar este script desde la raíz del proyecto ONV2" -ForegroundColor Yellow
    exit 1
}

Write-Host "Base de datos encontrada: $dbPath" -ForegroundColor Green
Write-Host ""

# Crear backup automático
$backupPath = "src\Basededatos_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Creando backup en: $backupPath" -ForegroundColor Yellow
Copy-Item $dbPath $backupPath
Write-Host "✓ Backup creado exitosamente" -ForegroundColor Green
Write-Host ""

# Ejecutar migración
Write-Host "Ejecutando migración..." -ForegroundColor Yellow
$migrationScript = Get-Content "migrations\004_biblioteca_favoritos_FIXED.sql" -Raw

try {
    # Ejecutar con sqlite3
    $migrationScript | sqlite3 $dbPath
    
    Write-Host "✓ Migración ejecutada exitosamente" -ForegroundColor Green
    Write-Host ""
    
    # Verificar columnas
    Write-Host "Verificando estructura de tabla..." -ForegroundColor Yellow
    $tableInfo = sqlite3 $dbPath "PRAGMA table_info(PLAN_BLOQUES_PRESETS);"
    
    Write-Host ""
    Write-Host "Columnas en PLAN_BLOQUES_PRESETS:" -ForegroundColor Cyan
    Write-Host $tableInfo
    Write-Host ""
    
    # Verificar datos migrados
    Write-Host "Verificando datos migrados..." -ForegroundColor Yellow
    $stats = sqlite3 $dbPath @"
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN ES_PRESET_GLOBAL = 1 THEN 1 ELSE 0 END) as globales,
    SUM(CASE WHEN ES_PUBLICA = 1 THEN 1 ELSE 0 END) as publicas,
    SUM(CASE WHEN ES_FAVORITA = 1 THEN 1 ELSE 0 END) as favoritas
FROM PLAN_BLOQUES_PRESETS;
"@
    
    Write-Host "Estadísticas:" -ForegroundColor Cyan
    Write-Host $stats
    Write-Host ""
    
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  ✓ MIGRACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Reinicia el servidor Flask (Ctrl+C y python src/main.py)" -ForegroundColor White
    Write-Host "2. Limpia la caché: python limpiar_cache.py" -ForegroundColor White
    Write-Host "3. Prueba el constructor y las sugerencias inteligentes" -ForegroundColor White
    Write-Host ""
    Write-Host "Backup guardado en: $backupPath" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "  ✗ ERROR EN LA MIGRACIÓN" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Restaurando desde backup..." -ForegroundColor Yellow
    Copy-Item $backupPath $dbPath -Force
    Write-Host "✓ Base de datos restaurada" -ForegroundColor Green
    Write-Host ""
    exit 1
}
