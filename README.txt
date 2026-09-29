MÉDICO AMIGO v1.5.1 — CAMBIO DE SESIÓN SEGURO

Corrección:
- Limpia paciente seleccionado y estado clínico al cerrar sesión.
- Limpia cachés clínicos legados del navegador.
- Detecta cambio real de UUID entre médicos.
- Fuerza recarga limpia al cambiar de cuenta.
- Mantiene v1.5: filtro explícito por doctor_id.
- Mantiene RLS de Supabase como barrera principal.
- No requiere SQL nuevo.

PRUEBA:
1. Entrar como Omar: debe ver solo sus datos.
2. Salir usando el botón de la aplicación.
3. Entrar como Hugo.
4. Hugo NO debe ver TEST-OMAR-01 ni la consulta de Omar.
5. Salir y volver a Omar: TEST-OMAR-01 debe reaparecer.
