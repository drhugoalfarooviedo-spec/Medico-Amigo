MÉDICO AMIGO v1.5.2 — DASHBOARD POR SESIÓN

Corrección puntual sobre v1.5.1:
- Al iniciar sesión, pone el dashboard visual en cero antes de mostrarlo.
- Después del perfil, vuelve a consultar Supabase usando la sesión/JWT del médico recién autenticado.
- Al cerrar sesión elimina también del DOM las consultas recientes y pone contadores en cero.
- Mantiene el filtro explícito doctor_id de v1.5.
- Mantiene la limpieza de sesión de v1.5.1.
- No requiere SQL nuevo. No modificar las 23 políticas RLS.

PRUEBA:
1. Entrar como Hugo: debe ver únicamente los datos de Hugo.
2. Salir.
3. Entrar como Omar: debe ver únicamente TEST-OMAR-01 y sus propios importes.
4. Salir.
5. Volver a Hugo: TEST-OMAR-01 no debe aparecer.
