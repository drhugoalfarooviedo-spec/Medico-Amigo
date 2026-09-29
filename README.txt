MÉDICO AMIGO v1.1.1 — LIMPIEZA

OBJETIVO
Dejar la aplicación en un estado clínico limpio antes de continuar la migración.

CAMBIOS
- Elimina una sola vez los datos clínicos/demo heredados de sessionStorage.
- NO elimina la sesión de Supabase ni la configuración del médico.
- María Fernández y Carlos Mamani ya no forman parte de la aplicación.
- Pacientes se inicializa vacío y luego se sincroniza únicamente desde public.patients.
- El dashboard deja de mostrar consultas/ingresos locales antiguos mientras esos módulos no estén migrados.
- Mantiene el login real y el perfil por UID de v1.0.4.
- Mantiene el registro de pacientes en Supabase de v1.1.

PRUEBA
1. Reemplazar los cuatro archivos en GitHub.
2. Ctrl+F5.
3. Iniciar sesión como Dr. Hugo.
4. Confirmar: Pacientes = 0 si public.patients está vacío.
5. Confirmar que ya no aparecen María Fernández, Carlos Mamani ni la consulta local anterior.
6. Luego crear UN paciente ficticio y verificarlo en Supabase.

Todavía no usar datos clínicos reales. Consultas, recetas y pagos aún deben migrarse.
