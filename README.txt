MÉDICO AMIGO v1.0 AUTH

ETAPA IMPLEMENTADA
- Supabase Auth real con correo y contraseña.
- Sesión persistente gestionada por Supabase.
- Carga del perfil del médico autenticado desde doctor_profiles.
- Botón Salir para cerrar sesión.
- Project URL y Publishable key integrados en el frontend.
- No se usa ninguna Secret key ni service_role.

IMPORTANTE
Esta es la primera etapa de v1.0.
El login y el perfil profesional ya usan Supabase.
Pacientes, consultas, recetas y pagos TODAVÍA conservan la lógica temporal
de sessionStorage de v0.9. No usar todavía información clínica real.

SIGUIENTE ETAPA
Migrar Pacientes -> Consultas -> Recetas -> Pagos a Supabase y verificar RLS
con dos usuarios de prueba antes de considerar uso con datos reales.
