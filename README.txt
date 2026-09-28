MÉDICO AMIGO v1.0.3 AUTH FIXED

La prueba auth-test-v2 confirmó:
- Supabase Auth funciona.
- La Publishable key funciona.
- RLS permite leer el perfil correcto.
- El usuario Dr. Hugo Alfaro carga su propio doctor_profiles.

Esta versión reemplaza la integración Auth anterior por la misma conexión directa
que funcionó en auth-test-v2.

IMPLEMENTADO:
- Login real.
- Sesión local con token Supabase.
- Carga de doctor_profiles según UID autenticado.
- Logout.
- Sin login falso.
- Sin dependencia del CDN supabase-js.

AÚN NO USAR DATOS CLÍNICOS REALES:
pacientes, consultas, recetas y pagos siguen pendientes de migración completa a Supabase.
