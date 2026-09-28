MÉDICO AMIGO v1.0.1 AUTH FIX

CORRECCIÓN
- Eliminado el controlador de login simulado heredado del prototipo.
- El formulario de acceso ahora se procesa únicamente mediante Supabase Auth.
- Se agregó una protección adicional para impedir mostrar Inicio sin un perfil autenticado.
- Contraseña incorrecta: debe permanecer en Login.
- Credenciales correctas: carga doctor_profiles y recién entonces muestra Inicio.

ESTADO
Login y perfil: Supabase.
Pacientes, consultas, recetas y pagos: todavía sessionStorage.
NO usar datos clínicos reales todavía.
