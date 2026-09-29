MÉDICO AMIGO v1.2.5 — ANTECEDENTES CLÍNICOS

NUEVO:
- Antecedentes personales patológicos.
- Antecedentes personales no patológicos.
- Antecedentes heredofamiliares.
- Antecedentes gineco-obstétricos solo cuando el sexo es Femenino:
  menarca, FUM, ritmo menstrual, gestas, partos, cesáreas, abortos,
  método anticonceptivo y otros.
- Se mantienen Alergias, Medicación habitual y Observaciones.
- No se modifica la lógica estable de consultas ni la protección anti-duplicados.

IMPORTANTE — EJECUTAR UNA SOLA VEZ EN SUPABASE SQL EDITOR ANTES DE SUBIR ESTA VERSIÓN:

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS pathological_history text,
  ADD COLUMN IF NOT EXISTS non_pathological_history text,
  ADD COLUMN IF NOT EXISTS family_history text,
  ADD COLUMN IF NOT EXISTS gynecological_history jsonb;

Estos ADD COLUMN no eliminan ni modifican pacientes existentes.

Después:
1. Subir index.html, styles.css, app.js y README.txt.
2. Ctrl + F5.
3. Probar + NUEVO con un paciente ficticio masculino: no debe mostrar gineco-obstétricos.
4. Cambiar a Femenino: debe aparecer la sección gineco-obstétrica.
5. Guardar solo después de haber ejecutado el SQL anterior.
