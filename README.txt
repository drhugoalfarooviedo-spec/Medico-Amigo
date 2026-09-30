MÉDICO AMIGO v1.0.11 — FIX DEFINITIVO DE CONTEXTO EN RECETA INDEPENDIENTE

Error observado:
Cannot read properties of null (reading 'meta')

Causa encontrada:
No era un problema del campo meta del paciente.
El generador profesional de receta utilizaba las variables internas
selectedPatient/currentConsultation del flujo de consulta.
La receta independiente, en cambio, guardaba su contexto en
window.selectedPatient/window.currentConsultation.

Por eso la receta podía guardarse en Supabase, pero al construir el documento
el generador recibía selectedPatient = null y fallaba al leer p.meta.

Corrección:
- prescriptionPrint usa primero el contexto clínico normal;
- si no existe, utiliza el contexto de receta independiente;
- valida paciente y contexto antes de generar el documento;
- no modifica consultas, historia clínica, cobros, RLS ni base de datos.

No requiere SQL.
