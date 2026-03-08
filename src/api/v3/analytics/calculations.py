"""
Analytics Calculations - Ported from legacy main.py dashboard logic.
Provides advanced body composition analysis, category classifications,
rate calculations, performance clock, and diagnostic alerts.
"""

from datetime import datetime, timedelta
import statistics
import math


def safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_date_safe(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace(' ', 'T'))
        except ValueError:
            for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y"):
                try:
                    return datetime.strptime(value, fmt)
                except ValueError:
                    continue
    return None


def normalize_altura(altura_raw):
    """Normalize height to centimeters."""
    try:
        altura = float(altura_raw)
    except (TypeError, ValueError):
        return 170.0
    if altura < 3:
        altura = altura * 100
    elif altura < 50:
        altura = 170.0
    elif altura > 250:
        altura = 170.0
    return altura


# ---------------------------------------------------------------------------
# Category Classifications (from legacy main.py lines 278-398)
# ---------------------------------------------------------------------------

BODY_CATEGORIES = [
    "Graso", "Sobrepeso", "Robusto", "Inactivo", "Balanceado",
    "Balanceado muscular", "Delgado", "Balanceado delgado", "Delgado muscular"
]


def classify_body(sexo, bf, ffmi, imc, abdomen):
    """Return descriptive categories for BF, FFMI, IMC, abdomen risk, and body type."""

    if sexo == 'M':
        # Abdomen risk
        if abdomen > 102:
            abdcatrisk = f'Riesgo muy elevado de evento cardiovascular, deberías disminuir {abdomen - 102} cm.'
        elif abdomen > 95:
            abdcatrisk = f'Riesgo elevado de evento cardiovascular, deberías disminuir {abdomen - 95} cm.'
        else:
            abdcatrisk = 'Te encuentras en un rango normal'

        # Body type factor
        if bf > 24:
            factor = 0
        elif bf < 17:
            factor = 2
        else:
            factor = 1
        if ffmi > 21.5:
            factor = 2 + factor * 3
        elif ffmi < 19:
            factor = factor * 3
        else:
            factor = 1 + factor * 3

        # BF category
        if bf > 20:
            bfcat = "Promedio: No es un abdomen plano; se beneficiará de la pérdida de grasa."
        elif bf > 15:
            bfcat = "Fit/Saludable: Sin barriga; bien moldeado en la mayoría de la ropa."
        elif bf > 10:
            bfcat = "Atlético: Abs visible con la flexión y una buena iluminación."
        else:
            bfcat = "Modelo: Abdominales visibles sin flexión"

        # FFMI category
        if ffmi > 25:
            immccat = "Uso de esteroides: Posible pero muy poco probable sin esteroides."
        elif ffmi > 24:
            immccat = "Límite: Constitución muscular superior a la media."
        elif ffmi > 22.5:
            immccat = "Excelente: Constitución muscular superior a la media."
        elif ffmi > 21:
            immccat = "Muy buena: Constitución muscular promedio."
        elif ffmi > 20:
            immccat = "Buena: Constitución muscular promedio."
        elif ffmi > 19:
            immccat = "Normal: Constitución muscular promedio."
        elif ffmi > 18:
            immccat = "Casi normal: Complexión débil y constitución muscular baja."
        else:
            immccat = "Pobre: Complexión débil y constitución muscular baja."

    else:  # Female
        if abdomen > 88:
            abdcatrisk = f'Riesgo muy elevado de evento cardiovascular, deberías disminuir {abdomen - 88} cm.'
        elif abdomen > 82:
            abdcatrisk = f'Riesgo elevado de evento cardiovascular, deberías disminuir {abdomen - 82} cm.'
        else:
            abdcatrisk = 'Te encuentras en un rango normal'

        if bf > 32:
            factor = 0
        elif bf < 25:
            factor = 2
        else:
            factor = 1
        if ffmi > 19:
            factor = 2 + factor * 3
        elif ffmi < 16.25:
            factor = factor * 3
        else:
            factor = 1 + factor * 3

        if bf > 30:
            bfcat = "Promedio: No es un abdomen plano; se beneficiará de la pérdida de grasa."
        elif bf > 22:
            bfcat = "Fit/Saludable: Sin barriga; bien moldeado en la mayoría de la ropa."
        elif bf > 18:
            bfcat = "Atlético: Abs visible con la flexión y una buena iluminación."
        else:
            bfcat = "Modelo: Abdominales visibles sin flexión"

        if ffmi > 22:
            immccat = "Uso de esteroides: Posible pero muy poco probable sin esteroides."
        elif ffmi > 20.5:
            immccat = "Límite: Constitución muscular superior a la media."
        elif ffmi > 18.5:
            immccat = "Excelente: Constitución muscular superior a la media."
        elif ffmi > 17:
            immccat = "Muy buena: Constitución muscular promedio."
        elif ffmi > 16:
            immccat = "Buena: Constitución muscular promedio."
        elif ffmi > 14.5:
            immccat = "Normal: Constitución muscular promedio."
        elif ffmi > 13.5:
            immccat = "Casi normal: Complexión débil y constitución muscular baja."
        else:
            immccat = "Pobre: Complexión débil y constitución muscular baja."

    # IMC category (same for both sexes)
    if imc > 40:
        imccat = "Obesidad mórbida - Riesgo cardiovascular: Extremadamente alto."
    elif imc > 35:
        imccat = "Obesidad severa - Riesgo cardiovascular: Muy alto."
    elif imc > 30:
        imccat = "Obesidad - Riesgo cardiovascular: Alto"
    elif imc > 25:
        imccat = "Sobrepeso - Riesgo cardiovascular: Incrementado"
    elif imc > 18.5:
        imccat = "Normal - Riesgo cardiovascular: Mínimo"
    else:
        imccat = "Bajo peso - Riesgo cardiovascular: Mínimo"

    categoria = BODY_CATEGORIES[factor] if 0 <= factor < len(BODY_CATEGORIES) else "Desconocido"

    return {
        'bf_categoria': bfcat,
        'ffmi_categoria': immccat,
        'imc_categoria': imccat,
        'abdomen_riesgo': abdcatrisk,
        'tipo_corporal': categoria,
        'factor': factor,
    }


# ---------------------------------------------------------------------------
# Body Composition Matrix (11-zone IMC vs BF% classification)
# ---------------------------------------------------------------------------

# BF% band thresholds by sex
_BF_BANDS_M = [10, 17, 24]   # <10 | 10-17 | 17-24 | >=24
_BF_BANDS_F = [18, 25, 32]   # <18 | 18-25 | 25-32 | >=32
_BF_LABELS = ['Muy baja', 'Baja', 'Media', 'Alta']

# IMC band thresholds (both sexes)
_IMC_BANDS = [18.5, 22, 25]  # <18.5 | 18.5-22 | 22-25 | >=25
_IMC_LABELS = ['< 18.5', '18.5 - 22', '22 - 25', '>= 25']

# Matrix[imc_band][bf_band] — rows from highest IMC to lowest
_MATRIX = [
    # IMC >= 25
    ['Atlético', 'Atlético', 'Con sobrepeso', 'Obeso'],
    # IMC 22-25
    ['Musculoso', 'Musculoso', 'En forma', 'Con sobrepeso'],
    # IMC 18.5-22
    ['Delgado muscular', 'Delgado', 'En forma', 'Obesidad oculta'],
    # IMC < 18.5
    ['Delgadez', 'Bajo peso', 'Bajo peso', 'Obesidad oculta'],
]


def _band_index(value, thresholds):
    """Return 0-based band index: 0 if below first threshold, etc."""
    for i, t in enumerate(thresholds):
        if value < t:
            return i
    return len(thresholds)


def classify_body_matrix(sexo, bf, imc):
    """
    Classify body type using the 11-zone IMC vs BF% matrix.
    Returns dict with category, grid coordinates, band labels, and thresholds
    for rendering the visual matrix chart.
    """
    bf_thresholds = _BF_BANDS_M if sexo == 'M' else _BF_BANDS_F
    bf_band = _band_index(bf, bf_thresholds)
    imc_band = _band_index(imc, _IMC_BANDS)

    # Matrix rows are ordered highest-IMC-first (row 0 = >=25)
    imc_row = 3 - imc_band  # invert: band 3 (>=25) → row 0

    categoria = _MATRIX[imc_row][bf_band]

    # Build BF labels for this sex
    bf_labels = []
    for i in range(len(bf_thresholds) + 1):
        if i == 0:
            bf_labels.append(f'< {bf_thresholds[0]}%')
        elif i == len(bf_thresholds):
            bf_labels.append(f'>= {bf_thresholds[-1]}%')
        else:
            bf_labels.append(f'{bf_thresholds[i-1]} - {bf_thresholds[i]}%')

    return {
        'categoria': categoria,
        'bf_band': bf_band,          # 0-3 column index
        'imc_band': imc_band,        # 0-3 (0=lowest)
        'imc_row': imc_row,          # 0-3 (0=highest, for rendering)
        'bf_value': round(bf, 1),
        'imc_value': round(imc, 1),
        'matrix': _MATRIX,           # 4x4 grid
        'bf_labels': bf_labels,       # column headers
        'imc_labels': list(reversed(_IMC_LABELS)),  # row headers (top=highest)
        'bf_thresholds': bf_thresholds,
        'imc_thresholds': _IMC_BANDS,
    }


# ---------------------------------------------------------------------------
# Rate Calculators (from legacy main.py lines 404-416)
# ---------------------------------------------------------------------------

def calculator_fatrate(fat_mass):
    """Max fat loss rate: fat_mass * 31 cal/day → kg/week."""
    maxloss = fat_mass * 31
    mapace = maxloss * 7 / 3500
    return round(mapace, 3)


def calculator_leanrate(lean_mass):
    """Max lean gain rate: lean_mass / 268 kg/week."""
    return round(lean_mass / 268, 3)


# ---------------------------------------------------------------------------
# Delta & Historical Lists (from legacy main.py lines 687-715)
# ---------------------------------------------------------------------------

def compute_deltas(dinamicodata):
    """Compute deltas between last two measurements and historical lists."""
    if not dinamicodata:
        return {}, [], [], []

    ultimo = dinamicodata[-1]
    deltapeso = round(safe_float(ultimo[13]) * 1000) if safe_float(ultimo[13]) else 0
    deltapg = round(safe_float(ultimo[15]) * 1000) if safe_float(ultimo[15]) else 0
    deltapm = round(safe_float(ultimo[17]) * 1000) if safe_float(ultimo[17]) else 0

    if len(dinamicodata) > 1:
        prev = dinamicodata[-2]
        imc_prev = safe_float(prev[8])
        ffmi_prev = safe_float(prev[9])
        bf_prev = safe_float(prev[7])
        imc_curr = safe_float(ultimo[8])
        ffmi_curr = safe_float(ultimo[9])
        bf_curr = safe_float(ultimo[7])
        deltaimc = round((imc_curr - imc_prev) * 100 / imc_prev, 1) if imc_prev else 0
        deltaffmi = round((ffmi_curr - ffmi_prev) * 100 / ffmi_prev, 1) if ffmi_prev else 0
        deltabf = round((bf_curr - bf_prev) * 100 / bf_prev, 1) if bf_prev else 0
    else:
        deltaimc = deltaffmi = deltabf = 0

    deltas = {
        'deltapeso_g': deltapeso,
        'deltapg_g': deltapg,
        'deltapm_g': deltapm,
        'deltaimc_pct': deltaimc,
        'deltaffmi_pct': deltaffmi,
        'deltabf_pct': deltabf,
    }

    lendata = min(len(dinamicodata), 14)
    listaimc = [safe_float(dinamicodata[-lendata + i][8]) for i in range(lendata)]
    listaffmi = [safe_float(dinamicodata[-lendata + i][9]) for i in range(lendata)]
    listabf = [safe_float(dinamicodata[-lendata + i][7]) for i in range(lendata)]

    return deltas, listaimc, listaffmi, listabf


# ---------------------------------------------------------------------------
# Performance Clock (from legacy main.py lines 471-685)
# ---------------------------------------------------------------------------

def build_performance_clock(dinamicodata, fatrate_target, leanrate_target, cursor_population=None):
    """Build the performance clock with all/positive/population metrics."""

    def is_positive_entry(entry):
        positive_lbm = {"Excelente", "Correcto", "Impresionante"}
        positive_fbm = {"Excelente", "Correcto"}
        return (entry.get("lbm_category") in positive_lbm) or (entry.get("fbm_category") in positive_fbm)

    user_entries = []
    for row in dinamicodata:
        entry_date = parse_date_safe(row[2])
        user_entries.append({
            "date": entry_date,
            "fat_mass": safe_float(row[10]),
            "lean_mass": safe_float(row[11]),
            "weight": safe_float(row[6]),
            "lbm_category": row[21] if len(row) > 21 else None,
            "fbm_category": row[23] if len(row) > 23 else None,
        })
    user_entries = [e for e in user_entries if e["date"] is not None]
    user_entries.sort(key=lambda x: x["date"])

    if not user_entries:
        return {}

    latest_entry_date = user_entries[-1]["date"]

    def prepare_entries(days, positive_only=False):
        start_date = latest_entry_date - timedelta(days=days)
        filtered = [e for e in user_entries if e["date"] >= start_date and (not positive_only or is_positive_entry(e))]
        baseline = None
        if filtered:
            for e in reversed(user_entries):
                if e["date"] < filtered[0]["date"] and (not positive_only or is_positive_entry(e)):
                    baseline = e
                    break
        return filtered, baseline

    def build_metrics(filtered_entries, baseline_entry, label):
        metrics = {"label": label, "fat_rate": None, "lean_rate": None, "confidence": {"count": len(filtered_entries), "cv": None}}
        weights = [e["weight"] for e in filtered_entries if e["weight"] is not None]
        if len(weights) > 1:
            mean_w = sum(weights) / len(weights)
            if mean_w:
                metrics["confidence"]["cv"] = round(statistics.pstdev(weights) / mean_w, 4)

        comparison = []
        if baseline_entry:
            comparison.append(baseline_entry)
        comparison.extend(filtered_entries)
        comparison = [e for e in comparison if e["date"] and e["fat_mass"] is not None and e["lean_mass"] is not None]

        if len(comparison) >= 2:
            first, last = comparison[0], comparison[-1]
            delta_days = (last["date"] - first["date"]).days
            if delta_days > 0:
                metrics["fat_rate"] = round((last["fat_mass"] - first["fat_mass"]) / delta_days * 7, 4)
                metrics["lean_rate"] = round((last["lean_mass"] - first["lean_mass"]) / delta_days * 7, 4)
        return metrics

    timeframes = [("week", 7, "Última semana"), ("month", 30, "Último mes"), ("year", 365, "Último año")]
    clock = {"all": {"label": "Todos los datos", "timeframes": {}}, "positive": {"label": "Solo positivos", "timeframes": {}}}

    for key, days, label in timeframes:
        f_all, b_all = prepare_entries(days, False)
        clock["all"]["timeframes"][key] = build_metrics(f_all, b_all, label)
        f_pos, b_pos = prepare_entries(days, True)
        clock["positive"]["timeframes"][key] = build_metrics(f_pos, b_pos, label)

    # Population metrics (if cursor provided)
    if cursor_population:
        clock["population"] = {"label": "Promedio de la población", "timeframes": {}}
        for key, days, label in timeframes:
            start_date = (latest_entry_date - timedelta(days=days)).strftime('%Y-%m-%d')
            end_date = latest_entry_date.strftime('%Y-%m-%d')
            try:
                cursor_population.execute("""
                    SELECT fecha, peso, peso_graso, peso_magro, delta_graso, delta_magro, delta_dias
                    FROM measurements
                    WHERE fecha IS NOT NULL AND DATE(fecha) BETWEEN ? AND ? AND delta_dias IS NOT NULL
                """, (start_date, end_date))
                rows = cursor_population.fetchall()
            except Exception:
                rows = []

            pop_metrics = {"label": label, "fat_rate": None, "lean_rate": None, "confidence": {"count": len(rows), "cv": None}}
            pop_w = [safe_float(r[1]) for r in rows if safe_float(r[1]) is not None]
            if len(pop_w) > 1:
                mw = sum(pop_w) / len(pop_w)
                if mw:
                    pop_metrics["confidence"]["cv"] = round(statistics.pstdev(pop_w) / mw, 4)

            total_days = total_fat = total_lean = 0
            for _, _, _, _, df, dl, dd in rows:
                if dd and dd > 0 and df is not None and dl is not None:
                    total_days += dd
                    total_fat += df
                    total_lean += dl
            if total_days > 0:
                pop_metrics["fat_rate"] = round(total_fat / total_days * 7, 4)
                pop_metrics["lean_rate"] = round(total_lean / total_days * 7, 4)

            clock["population"]["timeframes"][key] = pop_metrics

    return clock


# ---------------------------------------------------------------------------
# Full Analysis (analisis_completo from legacy main.py lines 724-1318)
# ---------------------------------------------------------------------------

def build_analisis_completo(dinamicodata, estaticodata, dietadata, objetivodata, performance_clock):
    """Build the comprehensive analysis object."""

    analisis = {
        "tiene_datos": False,
        "estado_actual": {},
        "objetivo_definido": {},
        "plan_nutricional": {},
        "plan_alimentario": {},
        "diferencias": {},
        "tasas_esperadas": {},
        "tasas_actuales": {},
        "comparacion_periodos": {},
        "diagnostico": {},
    }

    if not dinamicodata:
        return analisis

    ultimo = dinamicodata[-1]
    primer = dinamicodata[0]

    latest_date = parse_date_safe(ultimo[2])
    primer_date = parse_date_safe(primer[2])

    # 1. ESTADO ACTUAL
    analisis["estado_actual"] = {
        "peso": round(float(ultimo[6]), 2),
        "peso_magro": round(float(ultimo[11]), 2),
        "peso_graso": round(float(ultimo[10]), 2),
        "bf_porcentaje": round(float(ultimo[7]), 1),
        "ffmi": round(float(ultimo[9]), 2),
        "imc": round(float(ultimo[8]), 2),
        "fecha_ultimo_registro": ultimo[2],
        "fecha_primer_registro": primer[2],
        "total_registros": len(dinamicodata),
        "dias_monitoreados": (latest_date - primer_date).days if latest_date and primer_date else 0,
    }

    peso_actual = float(ultimo[6])
    peso_graso_actual = float(ultimo[10])
    peso_magro_actual = float(ultimo[11])
    sexo = estaticodata[0][4] if estaticodata else "M"

    # Rate targets
    fatrate_planner = calculator_fatrate(peso_graso_actual)
    leanrate_planner = calculator_leanrate(peso_magro_actual)

    # 2. OBJETIVO DEFINIDO
    peso_objetivo = safe_float(ultimo[30]) if len(ultimo) > 30 else None
    peso_magro_objetivo = safe_float(ultimo[31]) if len(ultimo) > 31 else None
    peso_graso_objetivo = safe_float(ultimo[32]) if len(ultimo) > 32 else None

    if peso_objetivo and peso_magro_objetivo and peso_graso_objetivo:
        bf_objetivo = (peso_graso_objetivo / peso_objetivo) * 100
        altura = normalize_altura(estaticodata[0][6] if estaticodata and len(estaticodata[0]) > 6 else 170)
        altura_m = max(1.0, min(2.5, altura / 100.0))
        ffmi_objetivo = peso_magro_objetivo / (altura_m ** 2)

        analisis["objetivo_definido"] = {
            "tiene_objetivo": True,
            "ffmi_objetivo": round(ffmi_objetivo, 2),
            "bf_objetivo": round(bf_objetivo, 1),
            "peso_objetivo": round(peso_objetivo, 2),
            "peso_magro_objetivo": round(peso_magro_objetivo, 2),
            "peso_graso_objetivo": round(peso_graso_objetivo, 2),
        }

        # Diferencias
        diff_bf = round(bf_objetivo - float(ultimo[7]), 1)
        diff_ffmi = round(ffmi_objetivo - float(ultimo[9]), 2)
        if abs(diff_bf) < 2 and abs(diff_ffmi) < 0.5:
            fase = "Mantenimiento"
        elif diff_bf < -2:
            fase = "Definición (Pérdida de grasa)"
        elif diff_ffmi > 0.5:
            fase = "Volumen (Ganancia muscular)"
        else:
            fase = "Transición"

        analisis["diferencias"] = {
            "peso": round(peso_objetivo - peso_actual, 2),
            "peso_magro": round(peso_magro_objetivo - peso_magro_actual, 2),
            "peso_graso": round(peso_graso_objetivo - peso_graso_actual, 2),
            "bf": diff_bf,
            "ffmi": diff_ffmi,
            "fase": fase,
        }

        # 5. TASAS ESPERADAS
        if fase == "Definición (Pérdida de grasa)":
            tasa_grasa = -fatrate_planner
            tasa_musculo = 0.0
            tasa_peso = tasa_grasa
            dias_est = round((peso_graso_actual - peso_graso_objetivo) / fatrate_planner * 7, 0) if fatrate_planner else None
            analisis["tasas_esperadas"] = {
                "peso_min_semanal": round(tasa_peso * 0.9, 3),
                "peso_max_semanal": round(tasa_peso * 1.1, 3),
                "grasa_semanal": round(tasa_grasa, 3),
                "musculo_semanal": 0.0,
                "fase": "definicion",
                "fatrate_planner": fatrate_planner,
                "leanrate_planner": leanrate_planner,
                "dias_estimados": dias_est,
            }
        elif fase == "Volumen (Ganancia muscular)":
            tasa_musculo = leanrate_planner
            tasa_grasa_vol = leanrate_planner * 0.5
            if sexo == "F":
                tasa_musculo *= 0.5
            tasa_peso = tasa_musculo + tasa_grasa_vol
            dias_est = round((peso_magro_objetivo - peso_magro_actual) / leanrate_planner * 7, 0) if leanrate_planner else None
            analisis["tasas_esperadas"] = {
                "peso_min_semanal": round(tasa_peso * 0.8, 3),
                "peso_max_semanal": round(tasa_peso * 1.2, 3),
                "grasa_semanal": round(tasa_grasa_vol, 3),
                "musculo_semanal": round(tasa_musculo, 3),
                "fase": "volumen",
                "fatrate_planner": fatrate_planner,
                "leanrate_planner": leanrate_planner,
                "dias_estimados": dias_est,
            }
        else:
            analisis["tasas_esperadas"] = {
                "peso_min_semanal": -0.1,
                "peso_max_semanal": 0.1,
                "grasa_semanal": 0.0,
                "musculo_semanal": 0.0,
                "fase": "mantenimiento",
                "fatrate_planner": fatrate_planner,
                "leanrate_planner": leanrate_planner,
            }
    else:
        analisis["objetivo_definido"] = {"tiene_objetivo": False}

    # 3. PLAN NUTRICIONAL
    if dietadata:
        plan = dietadata[0]
        fecha_plan = plan[25] if len(plan) > 25 and plan[25] else None
        dias_desde = None
        if fecha_plan:
            try:
                fp = datetime.fromisoformat(str(fecha_plan).replace(' ', 'T'))
                dias_desde = (datetime.now() - fp).days
            except Exception:
                pass

        analisis["plan_nutricional"] = {
            "tiene_plan": True,
            "calorias_totales": int(plan[2]) if plan[2] else 0,
            "proteina_total": round(float(plan[3]), 1) if plan[3] else 0,
            "grasa_total": round(float(plan[4]), 1) if plan[4] else 0,
            "carbohidratos_total": round(float(plan[5]), 1) if plan[5] else 0,
            "libertad_porcentaje": int(plan[24]) if len(plan) > 24 and plan[24] else 0,
            "fecha_creacion": fecha_plan,
            "dias_desde_creacion": dias_desde,
            "estrategia": plan[26] if len(plan) > 26 else None,
            "velocidad_cambio": safe_float(plan[27]) if len(plan) > 27 else None,
            "deficit_calorico": safe_float(plan[28]) if len(plan) > 28 else None,
            "disponibilidad_energetica": safe_float(plan[29]) if len(plan) > 29 else None,
        }
    else:
        analisis["plan_nutricional"] = {"tiene_plan": False}

    # 6. TASAS ACTUALES (from plan date)
    fecha_plan_str = analisis["plan_nutricional"].get("fecha_creacion")
    if fecha_plan_str and analisis["plan_nutricional"].get("dias_desde_creacion") is not None:
        try:
            fecha_plan_obj = datetime.fromisoformat(str(fecha_plan_str).replace(' ', 'T'))
        except Exception:
            fecha_plan_obj = None

        if fecha_plan_obj:
            baseline_reg = None
            posteriores = []
            for row in dinamicodata:
                try:
                    fr = parse_date_safe(row[2])
                    rd = {"date": fr, "fat_mass": safe_float(row[10]), "lean_mass": safe_float(row[11]), "weight": safe_float(row[6])}
                    if fr and fr <= fecha_plan_obj:
                        if baseline_reg is None or fr > baseline_reg["date"]:
                            baseline_reg = rd
                    if fr and fr > fecha_plan_obj:
                        posteriores.append(rd)
                except Exception:
                    continue

            if baseline_reg and len(posteriores) >= 1:
                last_e = posteriores[-1]
                dd = (last_e["date"] - baseline_reg["date"]).days
                if dd > 0 and last_e["fat_mass"] and baseline_reg["fat_mass"] and last_e["lean_mass"] and baseline_reg["lean_mass"] and last_e["weight"] and baseline_reg["weight"]:
                    fr_plan = (last_e["fat_mass"] - baseline_reg["fat_mass"]) / dd * 7
                    lr_plan = (last_e["lean_mass"] - baseline_reg["lean_mass"]) / dd * 7
                    pr_plan = (last_e["weight"] - baseline_reg["weight"]) / dd * 7
                    total_p = len(posteriores) + 1
                    suf = dd >= 7 and len(posteriores) >= 3
                    analisis["tasas_actuales"] = {
                        "desde_plan": {
                            "fat_rate": round(fr_plan, 3), "lean_rate": round(lr_plan, 3), "peso_rate": round(pr_plan, 3),
                            "pesajes": total_p, "dias_transcurridos": dd, "datos_suficientes": suf,
                            "mensaje": "Datos confiables" if suf else f"PRELIMINAR - Faltan {max(0, 7 - dd)} días y {max(0, 3 - len(posteriores))} pesajes más",
                            "fecha_baseline": baseline_reg["date"].strftime("%Y-%m-%d"),
                            "fecha_ultimo": last_e["date"].strftime("%Y-%m-%d"),
                        }
                    }
                else:
                    analisis["tasas_actuales"] = {"desde_plan": {"datos_suficientes": False, "mensaje": "Datos insuficientes para calcular tasas"}}
            else:
                analisis["tasas_actuales"] = {"desde_plan": {"datos_suficientes": False, "mensaje": "Necesitas baseline + al menos 1 pesaje posterior"}}
    elif performance_clock:
        mes = performance_clock.get("all", {}).get("timeframes", {}).get("month", {})
        analisis["tasas_actuales"] = {
            "desde_plan": {
                "fat_rate": mes.get("fat_rate"), "lean_rate": mes.get("lean_rate"),
                "peso_rate": (mes.get("fat_rate") or 0) + (mes.get("lean_rate") or 0),
                "pesajes": mes.get("confidence", {}).get("count", 0),
                "datos_suficientes": (mes.get("confidence", {}).get("count", 0) >= 4),
                "mensaje": "Sin fecha de plan - usando último mes",
            }
        }

    # 7. COMPARACIÓN
    metricas = analisis["tasas_actuales"].get("desde_plan", {})
    if metricas.get("fat_rate") is not None and metricas.get("lean_rate") is not None:
        analisis["comparacion_periodos"] = {
            "fat_rate_actual": round(metricas["fat_rate"], 3),
            "lean_rate_actual": round(metricas["lean_rate"], 3),
            "peso_rate_actual": round(metricas.get("peso_rate", 0), 3),
            "tiene_datos_suficientes": metricas.get("datos_suficientes", False),
        }
        if analisis["tasas_esperadas"]:
            esp = analisis["tasas_esperadas"]
            peso_mid = (esp.get("peso_min_semanal", 0) + esp.get("peso_max_semanal", 0)) / 2
            analisis["comparacion_periodos"]["evaluacion"] = {
                "peso_en_rango": esp.get("peso_min_semanal", 0) <= metricas.get("peso_rate", 0) <= esp.get("peso_max_semanal", 0),
                "diferencia_peso_vs_ideal": round(metricas.get("peso_rate", 0) - peso_mid, 3),
                "diferencia_grasa_vs_ideal": round(metricas["fat_rate"] - esp.get("grasa_semanal", 0), 3),
                "diferencia_musculo_vs_ideal": round(metricas["lean_rate"] - esp.get("musculo_semanal", 0), 3),
            }

    # 8. DIAGNÓSTICO
    comp = analisis.get("comparacion_periodos", {})
    if comp.get("tiene_datos_suficientes"):
        diag = {"alertas": [], "estado_general": "normal"}
        fase_e = analisis.get("tasas_esperadas", {}).get("fase")

        if fase_e == "definicion":
            pmin = analisis["tasas_esperadas"]["peso_min_semanal"]
            pmax = analisis["tasas_esperadas"]["peso_max_semanal"]
            pr = comp.get("peso_rate_actual", 0)
            if pr > 0:
                diag["alertas"].append("GANANDO PESO - Deberías estar perdiendo. Reducir calorías")
                diag["estado_general"] = "alerta_alta"
            elif pr > pmax * 0.5:
                diag["alertas"].append("Pérdida de peso muy lenta - Reducir calorías un 10-15%")
                diag["estado_general"] = "alerta_media"
            elif pr < pmin * 1.3:
                diag["alertas"].append("Pérdida de peso excesiva - Riesgo de pérdida muscular")
                diag["estado_general"] = "alerta_alta"
            if comp.get("lean_rate_actual", 0) < -0.1:
                diag["alertas"].append("CRÍTICO: Pérdida de masa magra detectada. Aumentar proteína")
                diag["estado_general"] = "alerta_alta"
            if comp.get("fat_rate_actual", 0) > 0:
                diag["alertas"].append("Ganando grasa en definición - Reducir calorías")
                diag["estado_general"] = "alerta_alta"

        elif fase_e == "volumen":
            pmin = analisis["tasas_esperadas"]["peso_min_semanal"]
            pmax = analisis["tasas_esperadas"]["peso_max_semanal"]
            pr = comp.get("peso_rate_actual", 0)
            if pr < 0:
                diag["alertas"].append("PERDIENDO PESO - Deberías estar ganando. Aumentar calorías")
                diag["estado_general"] = "alerta_alta"
            elif pr < pmin * 0.5:
                diag["alertas"].append("Ganancia muscular lenta - Considerar aumentar calorías")
                diag["estado_general"] = "alerta_media"
            elif pr > pmax * 1.3:
                diag["alertas"].append("Ganancia de peso excesiva - Reducir calorías")
                diag["estado_general"] = "alerta_alta"
            if comp.get("lean_rate_actual", 0) < 0:
                diag["alertas"].append("CRÍTICO: Perdiendo masa magra en volumen")
                diag["estado_general"] = "alerta_alta"
            if comp.get("fat_rate_actual", 0) > comp.get("lean_rate_actual", 0):
                diag["alertas"].append("Ganancia de grasa excede ganancia muscular")
                diag["estado_general"] = "alerta_media"

        if not diag["alertas"]:
            diag["alertas"].append("Progreso dentro del rango esperado")
            diag["estado_general"] = "optimo"

        analisis["diagnostico"] = diag

    analisis["tiene_datos"] = True
    return analisis
