MÉDICO AMIGO v1.2.3 — CONSULTA ESTABLE

CORRECCIONES:
- + CONSULTA desde la ficha ahora abre el formulario clínico completo.
- Se conserva el paciente seleccionado y su UUID.
- El formulario incluye motivo, enfermedad actual, signos vitales, examen físico,
  estudios complementarios, diagnóstico, indicaciones, observaciones y seguimiento.
- Al guardar, la consulta se envía a public.consultations y continúa a Receta.
- El historial de la ficha se actualiza desde Supabase.
- Se eliminó el botón IMPRIMIR HISTORIA CLÍNICA.
- Se mantiene únicamente DESCARGAR HISTORIA CLÍNICA.
- No se modifica la lógica estable de pacientes ni se borra información de Supabase.

PRUEBA:
1. Entrar como Dr. Hugo.
2. Abrir un paciente.
3. Pulsar + CONSULTA.
4. Confirmar que aparece el formulario clínico completo.
5. Registrar una consulta ficticia y pulsar Guardar y continuar.
6. No completar receta/cobro todavía: comprobar primero public.consultations.
