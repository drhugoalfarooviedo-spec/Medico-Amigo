MÉDICO AMIGO v1.2.6 — HISTORIA CLÍNICA COMPLETA

Incluye:
- Antecedentes personales patológicos.
- Antecedentes personales no patológicos.
- Antecedentes heredofamiliares.
- Antecedentes gineco-obstétricos solo para sexo Femenino:
  menarca, FUM, ritmo menstrual, gestas, partos, cesáreas, abortos,
  método anticonceptivo y otros.
- Persistencia en Supabase.
- Visualización en la ficha del paciente.
- Inclusión en la Historia Clínica descargable.
- Mantiene consultas e historial de la v1.2.4.

Requiere que ya se haya ejecutado:
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS pathological_history text,
  ADD COLUMN IF NOT EXISTS non_pathological_history text,
  ADD COLUMN IF NOT EXISTS family_history text,
  ADD COLUMN IF NOT EXISTS gynecological_history jsonb;

No se eliminan pacientes ni consultas existentes.
