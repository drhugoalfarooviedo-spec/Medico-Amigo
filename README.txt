MÉDICO AMIGO v1.2.4 — GUARDADO DE CONSULTA

- Corrige definitivamente el error "selectedPatient is not defined".
- La consulta se guarda en public.consultations.
- Después del guardado muestra confirmación y vuelve a Pacientes.
- No intenta pasar todavía a Receta: primero verificaremos la fila en Supabase.
- No modifica la lógica estable de Pacientes.
- Mantiene Descargar Historia Clínica.

PRUEBA:
1. Ctrl+F5.
2. Paciente > + CONSULTA.
3. Completar una consulta ficticia.
4. Guardar.
5. Debe aparecer "Consulta guardada correctamente en Supabase".
6. Revisar Supabase > public.consultations.
