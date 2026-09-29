MÉDICO AMIGO v1.1 — PACIENTES EN SUPABASE

Base: v1.0.4, cuyo login real ya fue validado.

CAMBIOS
- Se eliminaron María Fernández y Carlos Mamani del directorio.
- Pacientes se sincroniza desde public.patients.
- Nuevo paciente se guarda mediante la API de Supabase.
- El navegador NO envía doctor_id: PostgreSQL usa DEFAULT auth.uid().
- Las políticas RLS existentes limitan los registros al médico autenticado.
- El directorio y su búsqueda trabajan con los pacientes sincronizados.

PRUEBA DE ESTA ETAPA
1. Iniciar sesión como Dr. Hugo.
2. Pacientes > + NUEVO.
3. Registrar SOLO un paciente ficticio.
4. Confirmar que aparece en Supabase > Table Editor > patients.
5. Luego probaremos la separación entrando como Dr. Omar.

NOTA
En v1.1 estamos migrando el módulo Pacientes. La selección de paciente para iniciar
una consulta, consultas, recetas y pagos se conectarán en las siguientes etapas.
Todavía no usar información clínica real.
