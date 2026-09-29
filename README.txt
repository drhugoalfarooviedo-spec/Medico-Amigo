MÉDICO AMIGO v1.5 — AISLAMIENTO POR MÉDICO

OBJETIVO
Impedir que una cuenta médica consulte o modifique datos clínicos pertenecientes a otra.

Cambios:
- Pacientes: filtro obligatorio doctor_id = usuario autenticado.
- Consultas: filtro obligatorio doctor_id = usuario autenticado.
- Recetas: filtro obligatorio doctor_id = usuario autenticado.
- Ítems de receta: filtro obligatorio doctor_id = usuario autenticado.
- Pagos: filtro obligatorio doctor_id = usuario autenticado.
- En nuevas escrituras y actualizaciones, doctor_id se fuerza al UUID autenticado.
- Mantiene v1.4.2: editar/eliminar paciente, cascada, dashboard, firma, receta y cobro.

IMPORTANTE
Esta versión agrega defensa en el navegador, pero RLS de Supabase sigue siendo la barrera de seguridad principal.
Antes de considerar el sistema listo para datos clínicos reales se debe verificar también RLS directamente.

PRUEBA
1. Entrar como Dr. Omar.
2. Debe mostrar 0 consultas, Bs 0 y ningún paciente de Hugo.
3. Crear un paciente ficticio de Omar.
4. Cerrar sesión.
5. Entrar como Hugo: el paciente de Omar no debe aparecer.
