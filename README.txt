MÉDICO AMIGO v1.4.2 — IDENTIFICACIÓN DE PACIENTE

Corrección puntual sobre v1.4.1:
- Corrige “No se encontró el paciente seleccionado”.
- Al abrir una ficha guarda inmediatamente el UUID real del paciente.
- Para fichas abiertas desde componentes antiguos, recupera el UUID desde Supabase usando CI y, como respaldo, nombre.
- Editar y Eliminar usan ese UUID real.
- La eliminación continúa verificándose contra Supabase.
- No requiere SQL nuevo.
- Mantiene dashboard, receta, cobro, firma y demás funciones de v1.4.1.

Prueba recomendada:
1. Ctrl+F5.
2. Abrir Pacientes.
3. Abrir un paciente ficticio.
4. Eliminar paciente.
5. Confirmar dos veces.
