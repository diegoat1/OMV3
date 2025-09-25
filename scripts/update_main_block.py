from pathlib import Path

PATH = Path(r"c:\Users\diego\Documents\Compartidos\Proyectos - Dev\ONV2\src\main.py")

OLD_BLOCK = """            # Si hay datos de TEST para este ejercicio, guardarlos
            if nombre_ejercicio in datos_test:
                test_data = datos_test[nombre_ejercicio]
                repeticiones_test[nombre_ejercicio] = test_data.get('repeticiones', 0)
                incrementos_peso[nombre_ejercicio] = test_data.get('incrementoPeso', 2.5)
                
                # Verificar si fue convertida a TEST
                if test_data.get('convertedToTest', False):
                    sesiones_convertidas_test[nombre_ejercicio] = True
                    print(f"Ejercicio {nombre_ejercicio} fue CONVERTIDO A TEST: {repeticiones_test[nombre_ejercicio]} reps, incremento {incrementos_peso[nombre_ejercicio]} kg")
                else:
                    print(f"Datos TEST para {nombre_ejercicio}: {repeticiones_test[nombre_ejercicio]} reps, incremento {incrementos_peso[nombre_ejercicio]} kg")
"""

NEW_BLOCK = """            # Si hay datos de TEST para este ejercicio, guardarlos
            if nombre_ejercicio in datos_test:
                test_data = datos_test[nombre_ejercicio] or {}

                if nombre_ejercicio.lower() == 'running':
                    running_test_data = {
                        'velocidadBase': test_data.get('velocidadBase'),
                        'incrementoVelocidad': test_data.get('incrementoVelocidad', 0),
                        'tiempo': test_data.get('tiempo', 0),
                        'convertedToTest': test_data.get('convertedToTest', False)
                    }
                    repeticiones_test[nombre_ejercicio] = running_test_data

                    if running_test_data['convertedToTest']:
                        sesiones_convertidas_test[nombre_ejercicio] = True
                        print(
                            f"Ejercicio {nombre_ejercicio} (running) fue CONVERTIDO A TEST: "
                            f"tiempo={running_test_data['tiempo']} min, incremento velocidad={running_test_data['incrementoVelocidad']} km/h"
                        )
                    else:
                        print(
                            f"Datos TEST running para {nombre_ejercicio}: "
                            f"tiempo={running_test_data['tiempo']} min, incremento velocidad={running_test_data['incrementoVelocidad']} km/h"
                        )
                else:
                    repeticiones = test_data.get('repeticiones', 0)
                    incremento = test_data.get('incrementoPeso', 2.5)

                    repeticiones_test[nombre_ejercicio] = repeticiones
                    incrementos_peso[nombre_ejercicio] = incremento
                    
                    # Verificar si fue convertida a TEST
                    if test_data.get('convertedToTest', False):
                        sesiones_convertidas_test[nombre_ejercicio] = True
                        print(f"Ejercicio {nombre_ejercicio} fue CONVERTIDO A TEST: {repeticiones} reps, incremento {incremento} kg")
                    else:
                        print(f"Datos TEST para {nombre_ejercicio}: {repeticiones} reps, incremento {incremento} kg")
"""

def main():
    text = PATH.read_text(encoding="utf-8")
    if OLD_BLOCK not in text:
        raise SystemExit("Bloque original no encontrado en main.py")
    PATH.write_text(text.replace(OLD_BLOCK, NEW_BLOCK), encoding="utf-8")
    print("Bloque actualizado en main.py")


if __name__ == "__main__":
    main()
