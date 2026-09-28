MÉDICO AMIGO v1.0.4

Corrección del problema identificado en v1.0.3:
- Los campos reales de correo y contraseña no tenían IDs, por lo que el login no leía sus valores.
- El bloque de autenticación anterior estaba fuera del DOMContentLoaded y no podía usar las utilidades internas de la app.
- v1.0.4 usa selectores DOM propios y la conexión REST directa que auth-test-v2 confirmó como funcional.
- El formulario captura el submit antes que cualquier controlador antiguo.
- Carga doctor_profiles por UID y muestra el nombre del médico autenticado.

Todavía no usar datos clínicos reales: la migración de pacientes/consultas/recetas/pagos viene después.
