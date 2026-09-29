MÉDICO AMIGO v1.2 — CONSULTAS + HISTORIA CLÍNICA

Base: v1.1.1.
- Guarda nuevas consultas en public.consultations.
- patient_id proviene del paciente seleccionado.
- doctor_id continúa asignándose por DEFAULT auth.uid() en PostgreSQL.
- La FK compuesta patients(id, doctor_id) -> consultations(patient_id, doctor_id) protege la pertenencia.
- Carga consultas del paciente desde Supabase.
- Añade Descargar / Imprimir Historia Clínica desde la ficha del paciente.
- El documento incluye datos del paciente, antecedentes y consultas disponibles en Supabase.

PRUEBA:
1) Entrar como Dr. Hugo.
2) Seleccionar a Jaquelin.
3) Crear UNA consulta ficticia.
4) Confirmar la fila en Supabase > consultations.
5) Volver a la ficha y comprobar historial.
6) Probar Descargar / Imprimir Historia Clínica.

IMPORTANTE: usar solo datos ficticios durante esta etapa de pruebas. Recetas, pagos y dashboard todavía no están completamente migrados.
