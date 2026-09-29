MÉDICO AMIGO v1.2.2 — PACIENTES ESTABLE

CORRECCIÓN
- Supabase public.patients es la única fuente de pacientes.
- Se eliminó la recarga recursiva que podía duplicar tarjetas.
- Deduplicación adicional por UUID.
- + NUEVO y el formulario de paciente vuelven a estar disponibles.
- Un solo INSERT por envío del formulario.
- No se elimina ni modifica ninguna fila existente de Supabase.
- Se conservan Auth, RLS, Consultas v1.2 e Historia Clínica v1.2.1.

PRUEBA CONTROLADA
1. Ctrl+F5.
2. Entrar como Dr. Hugo.
3. Pacientes: Jaquelin debe aparecer UNA sola vez.
4. Pulsar + NUEVO.
5. Verificar que todos los campos puedan llenarse.
6. NO guardar un segundo paciente todavía.
