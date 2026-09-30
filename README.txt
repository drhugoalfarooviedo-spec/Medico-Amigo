MÉDICO AMIGO v1.0.7 — RECETA INDEPENDIENTE

Corrección del conflicto real detectado en v1.0.6:

Había DOS manejadores distintos para el botón "Nueva receta".
El manejador viejo (v1.0.5) se ejecutaba primero y enviaba a la pantalla Pacientes,
por lo que el selector independiente de v1.0.6 nunca llegaba a ejecutarse.
Ese bloque fue retirado.

FLUJO CORRECTO:
Inicio > Nueva receta
→ aparece un selector flotante de paciente
→ elegir paciente
→ abre directamente Receta
→ Guardar y continuar
→ guarda prescriptions con consultation_id = NULL
→ guarda prescription_items
→ abre la receta profesional / PDF.

NO CREA:
- consulta
- cobro
- paciente nuevo

La receta independiente sigue necesitando identificar al paciente, pero ya NO obliga
a iniciar una consulta ni a navegar por la ficha clínica.

Se conservan:
- Historia Clínica mejorada
- edición de paciente corregida
- navegación corregida
- RLS y aislamiento por médico
- migración consultation_id nullable ya aplicada

No requiere SQL adicional.
