MÉDICO AMIGO v1.3.3 — FLUJO ESTABLE

Correcciones:
- Nueva consulta busca pacientes directamente desde Supabase por nombre, CI o teléfono.
- El cobro exige confirmación real de Supabase antes de mostrar “Atención finalizada”.
- Dashboard lee consultas e ingresos reales de Supabase.
- Mantiene receta, antecedentes y firma privada.
- Mantiene la firma visible de v1.3.2.
- No requiere SQL nuevo.

Prueba recomendada:
1. Ctrl + F5.
2. Buscar un paciente existente por CI.
3. Abrir consulta y guardarla.
4. Receta u omitir receta.
5. Registrar cobro.
6. Confirmar el mensaje “Cobro guardado en Supabase”.
7. Volver a Inicio y comprobar Consultas e Ingresos.
