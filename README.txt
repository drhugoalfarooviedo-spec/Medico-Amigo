MÉDICO AMIGO v1.4.1 — ELIMINACIÓN VERIFICADA

Corrección puntual:
- Eliminar paciente solicita a Supabase devolver el registro eliminado.
- Luego consulta nuevamente la base para confirmar que ya no existe.
- Solo muestra “Paciente eliminado correctamente” después de ambas verificaciones.
- La misma verificación se aplica a eliminar consultas.
- Mantiene edición, búsqueda, dashboard, receta, cobro y firma.
- No requiere SQL nuevo (el ON DELETE CASCADE ya fue aplicado).

Prueba primero con un paciente ficticio/de prueba.
